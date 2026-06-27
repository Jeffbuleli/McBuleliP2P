#!/usr/bin/env node
/**
 * Create (and optionally send) a Resend Broadcast from exported marketing HTML.
 *
 *   npm run resend:export-broadcasts
 *   npx tsx scripts/send-marketing-broadcast.mjs --kind formation_crypto_reminder --locale fr --preview
 *   npx tsx scripts/send-marketing-broadcast.mjs --kind formation_crypto_reminder --locale fr --send
 *
 * Requires RESEND_API_KEY. For --send: RESEND_ALLOW_SEND=true (local) or production.
 * Segment: RESEND_SEGMENT_ID or default General segment.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadLocalEnv() {
  const envPath = resolve(root, ".env");
  if (existsSync(envPath)) {
    try {
      loadEnvFile(envPath);
    } catch {
      /* already loaded */
    }
  }
}

loadLocalEnv();

function parseArgs(argv) {
  const out = { preview: false, send: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--preview") out.preview = true;
    else if (a === "--send") out.send = true;
    else if (a.startsWith("--kind=")) out.kind = a.slice("--kind=".length);
    else if (a === "--kind" && argv[i + 1]) out.kind = argv[++i];
    else if (a.startsWith("--locale=")) out.locale = a.slice("--locale=".length);
    else if (a === "--locale" && argv[i + 1]) out.locale = argv[++i];
    else if (a.startsWith("--segment=")) out.segment = a.slice("--segment=".length);
    else if (a === "--segment" && argv[i + 1]) out.segment = argv[++i];
    else if (a.startsWith("--sync-post-id=")) out.syncPostId = a.slice("--sync-post-id=".length);
    else if (a === "--sync-post-id" && argv[i + 1]) out.syncPostId = argv[++i];
  }
  return out;
}

async function resendFetch(path, init) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) throw new Error("RESEND_API_KEY missing in .env");
  const res = await fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, body };
}

async function resolveSegmentId(explicit) {
  if (explicit?.trim()) return explicit.trim();
  const fromEnv = process.env.RESEND_SEGMENT_ID?.trim();
  if (fromEnv) return fromEnv;
  const listed = await resendFetch("/segments", { method: "GET" });
  if (!listed.ok) {
    throw new Error(`segments list failed: ${listed.status} ${listed.body.slice(0, 300)}`);
  }
  const json = JSON.parse(listed.body);
  const first = json?.data?.[0];
  if (!first?.id) throw new Error("No Resend segment found — create one in dashboard");
  console.log(`Using segment: ${first.name} (${first.id})`);
  return first.id;
}

function canSend() {
  if (!process.env.RESEND_API_KEY?.trim()) return false;
  if (process.env.NODE_ENV === "production") return true;
  const allow = (process.env.RESEND_ALLOW_SEND ?? "").trim().toLowerCase();
  return allow === "1" || allow === "true" || allow === "yes";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const kind = args.kind ?? "formation_crypto_reminder";
  const locale = args.locale ?? "fr";

  const slug = `mcbuleli-${kind}-${locale}`;
  const htmlPath = resolve(root, `content/email-broadcasts/${slug}.html`);
  const metaPath = resolve(root, `content/email-broadcasts/${slug}.json`);
  const txtPath = resolve(root, `content/email-broadcasts/${slug}.txt`);

  if (!existsSync(htmlPath) || !existsSync(metaPath)) {
    console.error(`Missing ${slug} — run: npm run resend:export-broadcasts`);
    process.exit(1);
  }

  const html = readFileSync(htmlPath, "utf8");
  const text = existsSync(txtPath) ? readFileSync(txtPath, "utf8") : undefined;
  const meta = JSON.parse(readFileSync(metaPath, "utf8"));

  const from = process.env.RESEND_BROADCAST_FROM?.trim() || "McBuleli <noreply@mcbuleli.org>";
  const segmentId = await resolveSegmentId(args.segment);

  if (args.syncPostId) {
    const { fetchFormationPostRecipients } = await import("./lib/fetch-formation-recipients.ts");
    const { syncContactsToSegment } = await import("./lib/resend-contact-sync.ts");
    const recipients = await fetchFormationPostRecipients(args.syncPostId);
    console.log(`Syncing ${recipients.length} enrolled contact(s) to segment…`);
    if (!recipients.length) {
      console.error("No enrolled recipients found for post — aborting.");
      process.exit(1);
    }
    const key = process.env.RESEND_API_KEY?.trim();
    const sync = await syncContactsToSegment({
      apiKey: key,
      segmentId,
      contacts: recipients,
    });
    console.log(`Contacts synced: ${sync.synced} ok, ${sync.failed} failed`);
    if (sync.synced === 0) {
      console.error("No contacts synced to Resend — aborting broadcast.");
      process.exit(1);
    }
  }

  console.log(`Broadcast: ${meta.name}`);
  console.log(`Subject:   ${meta.subject}`);
  console.log(`CTA:       ${meta.cta}`);
  console.log(`HTML:      ${htmlPath} (${html.length} chars)`);

  if (args.preview) {
    console.log("\n--- preview mode (no API call) ---");
    return;
  }

  if (args.send && !canSend()) {
    console.error("Send blocked — set RESEND_ALLOW_SEND=true in .env (local) or run in production.");
    process.exit(1);
  }

  const payload = {
    name: meta.name,
    segment_id: segmentId,
    from,
    subject: meta.subject,
    html,
    ...(text ? { text } : {}),
    send: Boolean(args.send),
  };

  const res = await resendFetch("/broadcasts", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error("Resend broadcast error:", res.status, res.body.slice(0, 800));
    process.exit(1);
  }

  const created = JSON.parse(res.body);
  console.log(args.send ? "✓ Broadcast sent" : "✓ Broadcast draft created", created);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

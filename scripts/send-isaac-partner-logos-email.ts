/**
 * Isaac Picture - send partner logos pack for affiches.
 *
 *   npx tsx scripts/send-isaac-partner-logos-email.ts
 *   npx tsx scripts/send-isaac-partner-logos-email.ts --to hi@mcbuleli.org --send
 *   npx tsx scripts/send-isaac-partner-logos-email.ts --to isaacitwiti@gmail.com --send
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import {
  buildIsaacPartnerLogosEmail,
  ISAAC_PICTURE_EMAIL,
} from "../src/lib/email/partnership/isaac-partner-logos-email";
import { partnershipArchiveBcc } from "../src/lib/email/partnership/partnership-email-config";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
  sendEmail,
} from "../src/lib/email/send";
import { SUPPORT_EMAIL } from "../src/lib/support-contact";

function loadLocalEnv(): void {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  try {
    loadEnvFile(envPath);
  } catch {
    /* already loaded */
  }
}

loadLocalEnv();

function parseArgs(argv: string[]) {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--preview") out.preview = true;
    else if (a === "--send") out.send = true;
    else if (a.startsWith("--to=")) out.to = a.slice("--to=".length);
    else if (a === "--to" && argv[i + 1]) out.to = argv[++i];
  }
  return out;
}

function mimeFor(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

function collectAttachments() {
  const pack = path.join(process.cwd(), "content/hackathon-partner-logos-pack");
  if (!existsSync(pack)) throw new Error(`Missing pack: ${pack}`);
  const files = readdirSync(pack)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .sort();
  if (files.length === 0) throw new Error(`No logo files in ${pack}`);
  return files.map((filename) => ({
    filename,
    content: readFileSync(path.join(pack, filename)).toString("base64"),
    content_type: mimeFor(filename),
  }));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = buildIsaacPartnerLogosEmail();
  const files = collectAttachments();

  const outDir = path.join(process.cwd(), "content/email-partnership");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    path.join(outDir, "isaac-partner-logos.html"),
    email.html,
    "utf8",
  );
  writeFileSync(
    path.join(outDir, "isaac-partner-logos.txt"),
    email.text,
    "utf8",
  );

  console.log(`Subject: ${email.subject}`);
  console.log(`Prod to: ${ISAAC_PICTURE_EMAIL}`);
  console.log(`Attachments (${files.length}):`);
  for (const f of files) console.log(`  - ${f.filename}`);
  console.log("Preview: content/email-partnership/isaac-partner-logos.html");

  if (!args.send) {
    console.log(
      `\nTest: npx tsx scripts/send-isaac-partner-logos-email.ts --to ${SUPPORT_EMAIL} --send`,
    );
    console.log(
      `Prod: npx tsx scripts/send-isaac-partner-logos-email.ts --to ${ISAAC_PICTURE_EMAIL} --send`,
    );
    return;
  }

  const to = typeof args.to === "string" ? args.to.trim() : "";
  if (!to) {
    console.error("Missing --to");
    process.exit(1);
  }
  if (!canSendViaResendApi()) {
    console.error(resendSendBlockedReason() || "Resend not configured");
    process.exit(1);
  }

  const from =
    process.env.PARTNERSHIP_EMAIL_FROM?.trim() ||
    `McBuleli Team <${SUPPORT_EMAIL}>`;
  const replyTo =
    process.env.PARTNERSHIP_EMAIL_REPLY_TO?.trim() || SUPPORT_EMAIL;

  const ok = await sendEmail({
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    from,
    replyTo,
    bcc: partnershipArchiveBcc(to),
    fileAttachments: files,
  });
  if (!ok) {
    console.error("Send failed");
    process.exit(1);
  }
  console.log(`OK → ${to}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

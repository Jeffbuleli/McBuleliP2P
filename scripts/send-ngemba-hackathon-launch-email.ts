/**
 * NGEMBA post-Hackathon launch email (participants, partners, public).
 *
 *   npx tsx scripts/send-ngemba-hackathon-launch-email.ts --preview
 *   npx tsx scripts/send-ngemba-hackathon-launch-email.ts --to hi@mcbuleli.org --send
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
} from "../src/lib/email/send";
import { SUPPORT_EMAIL } from "../src/lib/support-contact";

const SUBJECT =
  "NGEMBA · Paix en Kikongo · solution née du Hackathon";

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

function loadDossier() {
  const base = path.join(process.cwd(), "content/email-broadcasts");
  return {
    html: readFileSync(
      path.join(base, "ngemba-hackathon-launch-fr.html"),
      "utf8",
    ),
    text: readFileSync(
      path.join(base, "ngemba-hackathon-launch-fr.txt"),
      "utf8",
    ),
  };
}

async function sendViaResend(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
  from: string;
  replyTo: string;
}): Promise<{ ok: boolean; id?: string; status: number; body: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return { ok: false, status: 0, body: "missing_api_key" };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: args.from,
      reply_to: args.replyTo,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
    }),
  });
  const body = await res.text();
  let id: string | undefined;
  try {
    id = JSON.parse(body)?.id;
  } catch {
    /* ignore */
  }
  return { ok: res.ok, id, status: res.status, body: body.slice(0, 400) };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { html, text } = loadDossier();

  console.log(`Subject: ${SUBJECT}`);
  console.log(`HTML: content/email-broadcasts/ngemba-hackathon-launch-fr.html`);

  if (!args.send) {
    console.log(
      `\nTest: npx tsx scripts/send-ngemba-hackathon-launch-email.ts --to ${SUPPORT_EMAIL} --send`,
    );
    return;
  }

  const to =
    typeof args.to === "string" && args.to.trim()
      ? args.to.trim()
      : SUPPORT_EMAIL;

  if (!canSendViaResendApi()) {
    console.error("Envoi bloque:", resendSendBlockedReason());
    process.exit(1);
  }

  // Domaine Resend verifie mcbuleli.org (noreply) — reply-to hi@.
  const from =
    process.env.AUTH_EMAIL_FROM?.trim() ||
    process.env.PARTNERSHIP_EMAIL_FROM?.trim() ||
    "NGEMBA <noreply@mcbuleli.org>";

  const result = await sendViaResend({
    to,
    subject: `[TEST] ${SUBJECT}`,
    html: html.replace(/\{\{\{contact\.first_name\|ami\}\}\}/g, "ami"),
    text,
    from,
    replyTo: SUPPORT_EMAIL,
  });

  if (!result.ok) {
    console.error("Echec Resend", result.status, result.body);
    process.exit(1);
  }
  console.log(`Envoye via Resend -> ${to}`);
  console.log(`from: ${from}`);
  console.log(`resend_id: ${result.id ?? "(inconnu)"}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

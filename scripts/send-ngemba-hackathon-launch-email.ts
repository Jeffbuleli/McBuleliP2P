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
  sendEmail,
} from "../src/lib/email/send";
import { SUPPORT_EMAIL } from "../src/lib/support-contact";

const SUBJECT =
  "NGEMBA · Paix en Kikongo · solution née du McBuleli Hackathon";

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

  const from =
    process.env.NGEMBA_OPS_EMAIL_FROM?.trim() ||
    "NGEMBA <noreply@mcbuleli.org>";

  const ok = await sendEmail({
    to,
    subject: `[TEST] ${SUBJECT}`,
    html: html.replace(/\{\{\{contact\.first_name\|ami\}\}\}/g, "ami"),
    text,
    from,
    replyTo: SUPPORT_EMAIL,
  });
  if (!ok) {
    console.error("Echec Resend");
    process.exit(1);
  }
  console.log(`Envoye via Resend -> ${to}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

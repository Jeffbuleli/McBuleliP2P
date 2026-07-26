/**
 * MontanaPay — confirmation partenariat + calendrier + option sponsor.
 *
 *   npx tsx scripts/send-montana-pay-confirm-email.ts
 *   npx tsx scripts/send-montana-pay-confirm-email.ts --to hi@mcbuleli.org --send
 *   npx tsx scripts/send-montana-pay-confirm-email.ts --to montanadelly7@gmail.com --send
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { partnershipArchiveBcc } from "../src/lib/email/partnership/partnership-email-config";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
  sendEmail,
} from "../src/lib/email/send";
import { SUPPORT_EMAIL } from "../src/lib/support-contact";

export const MONTANAPAY_CONFIRM_TO = "montanadelly7@gmail.com";

const SUBJECT =
  "McBuleli Hackathon × MontanaPay - confirmation, calendrier & options de collaboration";

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
  const base = path.join(process.cwd(), "content/email-partnership");
  return {
    html: readFileSync(path.join(base, "montana-pay-confirm.html"), "utf8"),
    text: readFileSync(path.join(base, "montana-pay-confirm.txt"), "utf8"),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { html, text } = loadDossier();

  console.log(`Subject: ${SUBJECT}`);
  console.log(`HTML: content/email-partnership/montana-pay-confirm.html`);
  console.log(`Prod to: ${MONTANAPAY_CONFIRM_TO}`);

  if (!args.send) {
    console.log(
      `\nTest: npx tsx scripts/send-montana-pay-confirm-email.ts --to ${SUPPORT_EMAIL} --send`,
    );
    console.log(
      `Prod: npx tsx scripts/send-montana-pay-confirm-email.ts --to ${MONTANAPAY_CONFIRM_TO} --send`,
    );
    return;
  }

  const to = typeof args.to === "string" ? args.to.trim() : "";
  if (!to) {
    console.error("Missing --to");
    process.exit(1);
  }
  if (!canSendViaResendApi()) {
    console.error("Envoi bloqué:", resendSendBlockedReason());
    process.exit(1);
  }

  const from =
    process.env.PARTNERSHIP_EMAIL_FROM?.trim() ||
    `McBuleli Team <${SUPPORT_EMAIL}>`;
  const replyTo =
    process.env.PARTNERSHIP_EMAIL_REPLY_TO?.trim() || SUPPORT_EMAIL;

  const archiveBcc = partnershipArchiveBcc(to);
  const ok = await sendEmail({
    to,
    subject: SUBJECT,
    html,
    text,
    from,
    replyTo,
    bcc: archiveBcc,
  });
  if (!ok) {
    console.error("Échec Resend");
    process.exit(1);
  }
  console.log(`OK → ${to}${archiveBcc ? ` (BCC ${archiveBcc})` : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

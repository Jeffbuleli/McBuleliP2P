/**
 * Kilelo - programme Hackathon + lien McBuleli Meet (talk à distance Jeancy).
 *
 *   npx tsx scripts/send-kilelo-hackathon-remote-email.ts --preview
 *   npx tsx scripts/send-kilelo-hackathon-remote-email.ts --to hi@mcbuleli.org --send
 *   npx tsx scripts/send-kilelo-hackathon-remote-email.ts --to support@kileloapp.com --send
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
import { partnershipArchiveBcc } from "../src/lib/email/partnership/partnership-email-config";

export const KILELO_HACKATHON_REMOTE_TO = "support@kileloapp.com";
export const KILELO_HACKATHON_REMOTE_CC = "ceo@mcbuleli.org";
export const KILELO_HACKATHON_REMOTE_REPLY_TO = "ceo@mcbuleli.org";

const SUBJECT =
  "McBuleli Hackathon × Kilelo - programme & visio Meet (28 août · 10h00)";

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
    html: readFileSync(path.join(base, "kilelo-hackathon-remote.html"), "utf8"),
    text: readFileSync(path.join(base, "kilelo-hackathon-remote.txt"), "utf8"),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { html, text } = loadDossier();

  console.log(`Subject: ${SUBJECT}`);
  console.log(`HTML: content/email-partnership/kilelo-hackathon-remote.html`);
  console.log(
    `Prod to: ${KILELO_HACKATHON_REMOTE_TO} - CC ${KILELO_HACKATHON_REMOTE_CC} - Reply-To ${KILELO_HACKATHON_REMOTE_REPLY_TO}`,
  );
  console.log(`Meet: https://mcbuleli.org/meet/kilelo-hackathon-live`);

  if (!args.send) {
    console.log(
      `\nTest: npx tsx scripts/send-kilelo-hackathon-remote-email.ts --to ${SUPPORT_EMAIL} --send`,
    );
    console.log(
      `Prod: npx tsx scripts/send-kilelo-hackathon-remote-email.ts --to ${KILELO_HACKATHON_REMOTE_TO} --send`,
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

  const isTest = to.toLowerCase() === SUPPORT_EMAIL.toLowerCase();
  const cc = isTest ? undefined : [KILELO_HACKATHON_REMOTE_CC];
  const replyTo = isTest ? SUPPORT_EMAIL : KILELO_HACKATHON_REMOTE_REPLY_TO;

  const archiveBcc = partnershipArchiveBcc(to);
  const ok = await sendEmail({
    to,
    cc,
    subject: isTest ? `[TEST] ${SUBJECT}` : SUBJECT,
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
  const ccNote = cc?.length ? ` - CC ${cc.join(", ")}` : "";
  console.log(
    `Envoye via Resend -> ${to}${ccNote}${archiveBcc ? ` (BCC ${archiveBcc})` : ""}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

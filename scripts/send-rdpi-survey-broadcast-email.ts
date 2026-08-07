/**
 * RDPI survey broadcast — invitation enquête (aperçu / envoi ciblé).
 *
 *   npx tsx scripts/send-rdpi-survey-broadcast-email.ts --preview
 *   npx tsx scripts/send-rdpi-survey-broadcast-email.ts --send
 *   npx tsx scripts/send-rdpi-survey-broadcast-email.ts --to hi@mcbuleli.org --send
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import {
  buildRdpiSurveyBroadcastEmail,
  RDPI_SURVEY_BROADCAST_CONTACT_EMAIL,
} from "../src/lib/email/partnership/rdpi-survey-broadcast-email";
import { partnershipArchiveBcc } from "../src/lib/email/partnership/partnership-email-config";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
  sendEmail,
} from "../src/lib/email/send";
import { SUPPORT_EMAIL } from "../src/lib/support-contact";

const DEFAULT_RECIPIENTS = [
  "maristote@rdpithinktank.org",
  "info@rdpithinktank.org",
] as const;

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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { subject, html, text } = buildRdpiSurveyBroadcastEmail();

  const outDir = path.join(
    process.cwd(),
    "content/email-partnership/rdpi-survey-broadcast",
  );
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "broadcast.html"), html, "utf8");
  writeFileSync(path.join(outDir, "broadcast.txt"), text, "utf8");

  console.log(`Subject: ${subject}`);
  console.log(`HTML: content/email-partnership/rdpi-survey-broadcast/broadcast.html`);
  console.log(`Default To: ${DEFAULT_RECIPIENTS.join(", ")}`);
  console.log(`Reply-To: ${RDPI_SURVEY_BROADCAST_CONTACT_EMAIL}`);

  if (!args.send) {
    console.log(
      `\nSend both: npx tsx scripts/send-rdpi-survey-broadcast-email.ts --send`,
    );
    console.log(
      `One recipient: npx tsx scripts/send-rdpi-survey-broadcast-email.ts --to ${SUPPORT_EMAIL} --send`,
    );
    return;
  }

  if (!canSendViaResendApi()) {
    console.error("Envoi bloqué:", resendSendBlockedReason());
    process.exit(1);
  }

  const from =
    process.env.PARTNERSHIP_EMAIL_FROM?.trim() ||
    `McBuleli Team <${SUPPORT_EMAIL}>`;

  const recipients =
    typeof args.to === "string" && args.to.trim()
      ? [args.to.trim()]
      : [...DEFAULT_RECIPIENTS];

  for (const to of recipients) {
    const isTest = to.toLowerCase() === SUPPORT_EMAIL.toLowerCase();
    const archiveBcc = partnershipArchiveBcc(to);
    const ok = await sendEmail({
      to,
      ...(archiveBcc ? { bcc: archiveBcc } : {}),
      subject: isTest ? `[TEST] ${subject}` : subject,
      html,
      text,
      from,
      replyTo: isTest ? SUPPORT_EMAIL : RDPI_SURVEY_BROADCAST_CONTACT_EMAIL,
    });
    if (!ok) {
      console.error(`sendEmail failed → ${to}`);
      process.exit(1);
    }
    console.log(`Sent OK → ${to}${isTest ? " (test)" : ""}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

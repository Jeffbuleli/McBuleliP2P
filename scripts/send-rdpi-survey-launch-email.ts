/**
 * RDPI survey launch — M. Aristote MUGISHO.
 *
 *   npx tsx scripts/send-rdpi-survey-launch-email.ts --preview
 *   npx tsx scripts/send-rdpi-survey-launch-email.ts --to hi@mcbuleli.org --send
 *   npx tsx scripts/send-rdpi-survey-launch-email.ts --to maristote@rdpithinktank.org --send
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import {
  buildRdpiSurveyLaunchEmail,
  RDPI_SURVEY_EMAIL_CC,
  RDPI_SURVEY_EMAIL_REPLY_TO,
  RDPI_SURVEY_EMAIL_TO,
} from "../src/lib/email/partnership/rdpi-survey-launch-email";
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const isTestPreview =
    typeof args.to === "string" &&
    args.to.trim().toLowerCase() === SUPPORT_EMAIL.toLowerCase();
  const { subject, html, text } = buildRdpiSurveyLaunchEmail({
    testBanner: Boolean(args.send && isTestPreview),
  });

  const outDir = path.join(process.cwd(), "content/email-partnership");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "rdpi-survey-launch.html"), html, "utf8");
  writeFileSync(path.join(outDir, "rdpi-survey-launch.txt"), text, "utf8");

  console.log(`Subject: ${subject}`);
  console.log(`HTML: content/email-partnership/rdpi-survey-launch.html`);
  console.log(
    `Prod to: ${RDPI_SURVEY_EMAIL_TO} · CC ${RDPI_SURVEY_EMAIL_CC.join(", ")} · Reply-To ${RDPI_SURVEY_EMAIL_REPLY_TO}`,
  );
  console.log(`Survey: https://mcbuleli.org/rdpi`);
  console.log(`Dashboard: https://mcbuleli.org/rdpi/dashboard`);

  if (!args.send) {
    console.log(
      `\nTest: npx tsx scripts/send-rdpi-survey-launch-email.ts --to ${SUPPORT_EMAIL} --send`,
    );
    console.log(
      `Prod: npx tsx scripts/send-rdpi-survey-launch-email.ts --to ${RDPI_SURVEY_EMAIL_TO} --send`,
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
  const cc = isTest ? undefined : [...RDPI_SURVEY_EMAIL_CC, "ceo@mcbuleli.org"];
  const replyTo = isTest ? SUPPORT_EMAIL : RDPI_SURVEY_EMAIL_REPLY_TO;
  const archiveBcc = partnershipArchiveBcc(to);

  const ok = await sendEmail({
    to,
    ...(cc ? { cc } : {}),
    ...(archiveBcc ? { bcc: archiveBcc } : {}),
    subject: isTest ? `[TEST] ${subject}` : subject,
    html,
    text,
    from,
    replyTo,
  });

  if (!ok) {
    console.error("sendEmail failed");
    process.exit(1);
  }
  console.log(`Sent OK → ${to}${isTest ? " (test)" : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

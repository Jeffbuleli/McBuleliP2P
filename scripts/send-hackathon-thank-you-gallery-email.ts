/**
 * Merci post-hackathon · galerie HD · rappel livrables.
 *
 *   npx tsx scripts/send-hackathon-thank-you-gallery-email.ts --preview
 *   npx tsx scripts/send-hackathon-thank-you-gallery-email.ts --to hi@mcbuleli.org --send
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { buildHackathonThankYouGalleryEmail } from "../src/lib/email/partnership/hackathon-thank-you-gallery-email";
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
    else if (a.startsWith("--first-name=")) out.firstName = a.slice("--first-name=".length);
    else if (a === "--first-name" && argv[i + 1]) out.firstName = argv[++i];
  }
  return out;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const dossier = buildHackathonThankYouGalleryEmail({
    firstName: typeof args.firstName === "string" ? args.firstName : "Jeff",
  });

  const outDir = path.join(process.cwd(), "content/email-partnership");
  mkdirSync(outDir, { recursive: true });
  const stem = "hackathon-thank-you-gallery";
  writeFileSync(path.join(outDir, `${stem}.html`), dossier.html, "utf8");
  writeFileSync(path.join(outDir, `${stem}.txt`), dossier.text, "utf8");

  console.log(`Subject: ${dossier.subject}`);
  console.log(`Preview: content/email-partnership/${stem}.html`);

  if (args.preview && !args.send) {
    console.log("Preview only (--send not set).");
    return;
  }

  const to = typeof args.to === "string" ? args.to.trim() : "";
  if (!to) {
    console.error("ERROR: pass --to email@example.com with --send");
    process.exit(1);
  }

  if (!canSendViaResendApi()) {
    console.error(`ERROR: ${resendSendBlockedReason() ?? "Resend not configured"}`);
    process.exit(1);
  }

  const from =
    process.env.PARTNERSHIP_EMAIL_FROM?.trim() ||
    `McBuleli Team <${SUPPORT_EMAIL}>`;
  const replyTo =
    process.env.PARTNERSHIP_EMAIL_REPLY_TO?.trim() || SUPPORT_EMAIL;

  const ok = await sendEmail({
    to,
    subject: dossier.subject,
    html: dossier.html,
    text: dossier.text,
    from,
    replyTo,
    bcc: partnershipArchiveBcc(to),
  });

  if (!ok) {
    console.error("ERROR: send failed");
    process.exit(1);
  }

  console.log(`Sent to ${to}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

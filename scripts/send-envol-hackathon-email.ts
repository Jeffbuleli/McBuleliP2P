/**
 * Envol Concept hackathon partnership - preview / send via Resend.
 *
 *   npx tsx scripts/send-envol-hackathon-email.ts --preview
 *   npx tsx scripts/send-envol-hackathon-email.ts --to hi@mcbuleli.org --send
 *   npx tsx scripts/send-envol-hackathon-email.ts --to EMAIL_ENVOL --send
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import {
  buildEnvolHackathonFollowupEmail,
  hackathonPartnershipLevelsFicheText,
} from "../src/lib/email/partnership/envol-hackathon-email";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
  sendEmail,
} from "../src/lib/email/send";
import { SUPPORT_EMAIL } from "../src/lib/support-contact";
import { partnershipArchiveBcc } from "../src/lib/email/partnership/partnership-email-config";

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
  const email = buildEnvolHackathonFollowupEmail();
  const outDir = path.join(process.cwd(), "content/email-partnership");
  mkdirSync(outDir, { recursive: true });

  const fichePath = path.join(outDir, "mcbuleli-hackathon-niveaux-partenariat.txt");
  writeFileSync(fichePath, hackathonPartnershipLevelsFicheText(), "utf8");

  if (args.preview || !args.send) {
    writeFileSync(
      path.join(outDir, "envol-hackathon-followup.html"),
      email.html,
      "utf8",
    );
    writeFileSync(
      path.join(outDir, "envol-hackathon-followup.txt"),
      email.text,
      "utf8",
    );
    console.log(`✓ Fiche niveaux → ${fichePath}`);
    console.log(`Subject: ${email.subject}`);
    console.log(`✓ HTML → content/email-partnership/envol-hackathon-followup.html`);
    if (!args.send) {
      console.log(`\nTest : npx tsx scripts/send-envol-hackathon-email.ts --to ${SUPPORT_EMAIL} --send`);
      console.log("Puis : npx tsx scripts/send-envol-hackathon-email.ts --to EMAIL_ENVOL --send");
      return;
    }
  }

  const to = typeof args.to === "string" ? args.to.trim() : "";
  if (!to || !args.send) {
    console.error("Usage: --to email --send");
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
    subject: email.subject,
    html: email.html,
    text: email.text,
    from,
    replyTo,
    bcc: archiveBcc,
  });
  if (!ok) {
    console.error("Échec Resend");
    process.exit(1);
  }
  console.log(`✓ Envoyé via Resend : "${email.subject}" → ${to}${archiveBcc ? ` (BCC ${archiveBcc})` : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

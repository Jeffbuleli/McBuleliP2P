/**
 * EquityBCDC hackathon partnership — preview / send via Resend.
 *
 *   npx tsx scripts/send-equity-hackathon-email.ts --preview
 *   npx tsx scripts/send-equity-hackathon-email.ts --to hi@mcbuleli.org --send
 *   npx tsx scripts/send-equity-hackathon-email.ts --to marketing@equitybcdc.cd --send
 *
 * Requires RESEND_API_KEY and RESEND_ALLOW_SEND=true in .env
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import {
  buildEquityHackathonFollowupEmail,
  equityHackathonPartnershipFicheText,
  EQUITY_HACKATHON_TO_PRODUCTION,
} from "../src/lib/email/partnership/equity-hackathon-email";
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
    else if (a === "--fiche") out.fiche = true;
    else if (a.startsWith("--to=")) out.to = a.slice("--to=".length);
    else if (a === "--to" && argv[i + 1]) out.to = argv[++i];
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = buildEquityHackathonFollowupEmail();
  const outDir = path.join(process.cwd(), "content/email-partnership");
  mkdirSync(outDir, { recursive: true });

  if (args.fiche || args.preview) {
    const fichePath = path.join(outDir, "mcbuleli-hackathon-fiche-partenariat.txt");
    writeFileSync(fichePath, equityHackathonPartnershipFicheText(), "utf8");
    console.log(`✓ Fiche partenariat → ${fichePath}`);
  }

  if (args.preview || !args.send) {
    const htmlPath = path.join(outDir, "equity-hackathon-followup.html");
    const txtPath = path.join(outDir, "equity-hackathon-followup.txt");
    writeFileSync(htmlPath, email.html, "utf8");
    writeFileSync(txtPath, email.text, "utf8");
    console.log(`Subject: ${email.subject}`);
    console.log(`✓ HTML → ${htmlPath}`);
    console.log(`✓ Text → ${txtPath}`);
    if (!args.send) {
      console.log("\nTest Resend :");
      console.log(`  npx tsx scripts/send-equity-hackathon-email.ts --to ${SUPPORT_EMAIL} --send`);
      console.log("Puis Equity :");
      console.log(
        `  npx tsx scripts/send-equity-hackathon-email.ts --to ${EQUITY_HACKATHON_TO_PRODUCTION} --send`,
      );
      return;
    }
  }

  const to = typeof args.to === "string" ? args.to.trim() : "";
  if (!to) {
    console.error("Missing --to");
    process.exit(1);
  }
  if (!args.send) {
    console.error("Add --send to transmit via Resend.");
    process.exit(1);
  }

  if (!canSendViaResendApi()) {
    console.error("Envoi bloqué:", resendSendBlockedReason() ?? "Resend invalide");
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
    console.error("Échec Resend — voir logs [email].");
    process.exit(1);
  }
  console.log(`✓ Envoyé via Resend : "${email.subject}" → ${to}${archiveBcc ? ` (BCC ${archiveBcc})` : ""}`);
  console.log(`  From: ${from} · Reply-To: ${replyTo}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

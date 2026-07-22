/**
 * Preview: email confirmation partenariat hackathon (+ QR badge).
 *
 *   npx tsx scripts/send-hackathon-partner-confirm-preview-email.ts --send
 *   npx tsx scripts/send-hackathon-partner-confirm-preview-email.ts --to hi@mcbuleli.org --send
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { buildHackathonPartnerConfirmEmail } from "../src/lib/email/messages/hackathon";
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
    if (a === "--send") out.send = true;
    else if (a.startsWith("--to=")) out.to = a.slice("--to=".length);
    else if (a === "--to" && argv[i + 1]) out.to = argv[++i];
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const to =
    (typeof args.to === "string" ? args.to.trim() : "") || SUPPORT_EMAIL;

  const { subject, html, text } = buildHackathonPartnerConfirmEmail({
    to,
    orgName: "RDPI Think Tank",
    contactName: "Aristote MUGISHO",
    referentEmail: "maristote@rdpithinktank.org",
    roleLabel: "Partenaire Policy & Impact",
    ticketCode: "MBP-PREVIEW24A7",
    contributions: [
      "Atelier : innovation, politiques publiques & impact socio-économique en RDC",
      "Mentorat : impact, adoption des innovations & enjeux réglementaires",
      "Jury : pertinence socio-économique, durabilité & potentiel d'impact",
      "Diffusion via vos canaux institutionnels",
    ],
    locale: "fr",
    subjectPrefix: "[TEST] ",
  });

  console.log(`Subject: ${subject}`);
  console.log(`To: ${to}`);
  console.log(`Pass URL: https://mcbuleli.org/hackathon/pass/MBP-PREVIEW24A7`);

  if (!args.send) {
    console.log(
      `\nEnvoi: npx tsx scripts/send-hackathon-partner-confirm-preview-email.ts --to ${SUPPORT_EMAIL} --send`,
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

  const ok = await sendEmail({
    to,
    subject,
    html,
    text,
    from,
    replyTo: SUPPORT_EMAIL,
  });
  if (!ok) {
    console.error("Échec Resend");
    process.exit(1);
  }
  console.log(`✓ Preview partenaire (+ QR) envoyé → ${to}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

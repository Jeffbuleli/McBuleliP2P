/**
 * Preview: email confirmation paiement / ticket QR hackathon.
 *
 *   npx tsx scripts/send-hackathon-ticket-preview-email.ts --send
 *   npx tsx scripts/send-hackathon-ticket-preview-email.ts --to hi@mcbuleli.org --send
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { renderMcBuleliEmail } from "../src/lib/email/layout";
import { renderHackathonTicketQrCardHtml } from "../src/lib/email/messages/hackathon";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
  sendEmail,
} from "../src/lib/email/send";
import { HACKATHON_VENUE_SILIKIN } from "../src/lib/hackathon/constants";
import { SUPPORT_EMAIL } from "../src/lib/support-contact";

const SAMPLE_TICKET_CODE = "MBH-PREVIEW24A7";
const SAMPLE_FIRST = "Patty";
const SAMPLE_LAST = "B.";
const SAMPLE_PHONE = "+243 997 366 736";
const SAMPLE_REG_ID = "a1b2c3d4-preview";
/** Force prod origin so the QR / CTA look like production. */
const PROD_TICKET_URL = `https://mcbuleli.org/hackathon/pass/${encodeURIComponent(SAMPLE_TICKET_CODE)}`;

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

  const editionName = "McBuleli Hackathon";
  const ticketUrl = PROD_TICKET_URL;
  const subject = `[TEST] Votre ticket officiel - ${editionName}`;

  const extraHtml = renderHackathonTicketQrCardHtml({
    ticketUrl,
    ticketCode: SAMPLE_TICKET_CODE,
    isFr: true,
  });

  const { html, text } = renderMcBuleliEmail({
    locale: "fr",
    illustration: "verify",
    actionUrl: ticketUrl,
    extraHtml,
    copy: {
      subject,
      preheader: `Paiement confirmé · Ticket ${SAMPLE_TICKET_CODE}. Présentez le QR à l'entrée.`,
      title: `Bienvenue ${SAMPLE_FIRST}`,
      body: `Votre inscription à ${editionName} est confirmée. Conservez ce message et votre ticket QR (code ${SAMPLE_TICKET_CODE}) - ils vous seront demandés à l'entrée du Silikin Village.`,
      cta: "Ouvrir mon ticket",
      footerHelp: "Besoin d'aide ?",
      footerContact: "Contactez-nous",
    },
    detailRows: [
      { label: "Participant", value: `${SAMPLE_FIRST} ${SAMPLE_LAST}` },
      { label: "Email", value: to },
      { label: "Téléphone", value: SAMPLE_PHONE },
      { label: "Édition", value: editionName },
      { label: "Lieu", value: `${HACKATHON_VENUE_SILIKIN}, Kinshasa` },
      { label: "Date", value: "Août 2026" },
      { label: "Pack", value: "Programme 3 jours · 100 USD" },
      { label: "Code ticket", value: SAMPLE_TICKET_CODE },
      {
        label: "Réf. inscription",
        value: SAMPLE_REG_ID.slice(0, 8).toUpperCase(),
      },
    ],
  });

  console.log(`Subject: ${subject}`);
  console.log(`To: ${to}`);
  console.log(`Ticket URL: ${ticketUrl}`);
  console.log(`Code: ${SAMPLE_TICKET_CODE}`);

  if (!args.send) {
    console.log(
      `\nEnvoi: npx tsx scripts/send-hackathon-ticket-preview-email.ts --to ${SUPPORT_EMAIL} --send`,
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
  console.log(`✓ Preview ticket envoyé → ${to}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

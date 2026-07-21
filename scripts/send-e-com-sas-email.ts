/**
 * e-COM SAS - dossier partenariat (réponse formelle Direction).
 *
 *   npx tsx scripts/send-e-com-sas-email.ts --preview
 *   npx tsx scripts/send-e-com-sas-email.ts --to hi@mcbuleli.org --send
 *   npx tsx scripts/send-e-com-sas-email.ts --to contact@e-comsas.com --cc jean.andre@e-comsas.com --send
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

export const E_COM_SAS_EMAIL = "contact@e-comsas.com";
export const E_COM_SAS_CC = "jean.andre@e-comsas.com";

const SUBJECT = "McBuleli Hackathon - dossier partenariat e-COM SAS";

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
    else if (a.startsWith("--cc=")) out.cc = a.slice("--cc=".length);
    else if (a === "--cc" && argv[i + 1]) out.cc = argv[++i];
  }
  return out;
}

function loadDossier() {
  const base = path.join(process.cwd(), "content/email-partnership");
  const htmlPath = path.join(base, "e-com-sas-dossier-partenariat.html");
  const textPath = path.join(base, "e-com-sas-dossier-partenariat.txt");
  return {
    html: readFileSync(htmlPath, "utf8"),
    text: readFileSync(textPath, "utf8"),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { html, text } = loadDossier();

  console.log(`Subject: ${SUBJECT}`);
  console.log(`HTML: content/email-partnership/e-com-sas-dossier-partenariat.html`);
  console.log(`Contact prod: ${E_COM_SAS_EMAIL} (cc ${E_COM_SAS_CC})`);

  if (!args.send) {
    console.log(`\nTest: npx tsx scripts/send-e-com-sas-email.ts --to ${SUPPORT_EMAIL} --send`);
    console.log(
      `Prod: npx tsx scripts/send-e-com-sas-email.ts --to ${E_COM_SAS_EMAIL} --cc ${E_COM_SAS_CC} --send`,
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

  const cc =
    typeof args.cc === "string" && args.cc.trim()
      ? args.cc.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;

  const archiveBcc = partnershipArchiveBcc(to);
  const ok = await sendEmail({
    to,
    cc,
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
  const ccNote = cc?.length ? ` · CC ${cc.join(", ")}` : "";
  console.log(`✓ Envoyé via Resend → ${to}${ccNote}${archiveBcc ? ` (BCC ${archiveBcc})` : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

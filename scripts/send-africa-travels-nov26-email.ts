/**
 * Africa Travels Co. — proposition formation nov26 (WhatsApp Business + RS / IA).
 *
 *   npx tsx scripts/send-africa-travels-nov26-email.ts
 *   npx tsx scripts/send-africa-travels-nov26-email.ts --to hi@mcbuleli.org --send
 *   npx tsx scripts/send-africa-travels-nov26-email.ts --to africatravelsco@gmail.com --send --confirm-prod
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

export const AFRICA_TRAVELS_TO = "africatravelsco@gmail.com";
export const AFRICA_TRAVELS_FROM = "Jeff Buleli - McBuleli <ceo@mcbuleli.org>";
export const AFRICA_TRAVELS_REPLY_TO = "ceo@mcbuleli.org";

const SUBJECT =
  "Africa Travels Co. - compétences en fin de formation (WhatsApp, RS, IA) - 27-29 nov.";

const POSTER_PATH = path.join(
  process.cwd(),
  "public/events/nov26/affiche.png",
);

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
    else if (a === "--confirm-prod") out.confirmProd = true;
    else if (a.startsWith("--to=")) out.to = a.slice("--to=".length);
    else if (a === "--to" && argv[i + 1]) out.to = argv[++i];
  }
  return out;
}

function loadDossier() {
  const base = path.join(process.cwd(), "content/email-partnership");
  return {
    html: readFileSync(
      path.join(base, "africa-travels-nov26-proposal.html"),
      "utf8",
    ),
    text: readFileSync(
      path.join(base, "africa-travels-nov26-proposal.txt"),
      "utf8",
    ),
  };
}

function posterAttachment() {
  if (!existsSync(POSTER_PATH)) {
    throw new Error(`Affiche manquante: ${POSTER_PATH}`);
  }
  return {
    filename: "McBuleli-Formation-Nov2026-affiche.png",
    content: readFileSync(POSTER_PATH).toString("base64"),
    content_type: "image/png",
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { html, text } = loadDossier();

  console.log(`Subject: ${SUBJECT}`);
  console.log(`Dossier: content/email-partnership/africa-travels-nov26-proposal.*`);
  console.log(`Prod to: ${AFRICA_TRAVELS_TO} · From ${AFRICA_TRAVELS_REPLY_TO}`);
  console.log(`CTA: https://mcbuleli.com/nov26`);

  if (!args.send) {
    console.log(
      `\nTest: npx tsx scripts/send-africa-travels-nov26-email.ts --to ${SUPPORT_EMAIL} --send`,
    );
    console.log(
      `Prod: npx tsx scripts/send-africa-travels-nov26-email.ts --to ${AFRICA_TRAVELS_TO} --send --confirm-prod`,
    );
    return;
  }

  const to = typeof args.to === "string" ? args.to.trim() : "";
  if (!to) {
    console.error("Missing --to");
    process.exit(1);
  }

  const isTest = to.toLowerCase() === SUPPORT_EMAIL.toLowerCase();
  if (!isTest && !args.confirmProd) {
    console.error(
      `\nBlocked: envoi hors test. D'abord:\n  --to ${SUPPORT_EMAIL} --send\nPuis prod:\n  --to ${AFRICA_TRAVELS_TO} --send --confirm-prod`,
    );
    process.exit(1);
  }

  if (!canSendViaResendApi()) {
    console.error("Envoi bloqué:", resendSendBlockedReason());
    process.exit(1);
  }

  const archiveBcc = partnershipArchiveBcc(to);
  const ok = await sendEmail({
    to,
    subject: isTest ? `[TEST] ${SUBJECT}` : SUBJECT,
    html,
    text,
    from: AFRICA_TRAVELS_FROM,
    replyTo: isTest ? SUPPORT_EMAIL : AFRICA_TRAVELS_REPLY_TO,
    bcc: archiveBcc,
    fileAttachments: [posterAttachment()],
  });

  if (!ok) {
    console.error("Échec Resend");
    process.exit(1);
  }
  console.log(
    `✓ Envoyé → ${to}${archiveBcc ? ` (BCC ${archiveBcc})` : ""} · PJ affiche nov26`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

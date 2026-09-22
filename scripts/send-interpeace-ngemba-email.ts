/**
 * NGEMBA × Interpeace — email partenariat / soutien.
 *
 *   npx tsx scripts/send-interpeace-ngemba-email.ts --preview
 *   npx tsx scripts/send-interpeace-ngemba-email.ts --to hi@mcbuleli.org --send
 *   npx tsx scripts/send-interpeace-ngemba-email.ts --to info@interpeace.org --send
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import {
  buildInterpeaceNgembaEmail,
  INTERPEACE_CONTACT_EMAIL,
} from "../src/lib/email/partnership/interpeace-ngemba-email";
import { partnershipArchiveBcc } from "../src/lib/email/partnership/partnership-email-config";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
  sendEmail,
} from "../src/lib/email/send";
import { SUPPORT_EMAIL } from "../src/lib/support-contact";

const FROM = `Mme Patty B. - McBuleli <${SUPPORT_EMAIL}>`;
const REPLY_TO = SUPPORT_EMAIL;
const OUT_DIR = path.join(
  process.cwd(),
  "content/email-partnership/institutional-coop",
);
const OUT_BASE = "interpeace-ngemba";

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

function writePreview(): void {
  const email = buildInterpeaceNgembaEmail();
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(path.join(OUT_DIR, `${OUT_BASE}.html`), email.html, "utf8");
  writeFileSync(path.join(OUT_DIR, `${OUT_BASE}.txt`), email.text, "utf8");
  console.log(`✓ Preview → ${OUT_DIR}/${OUT_BASE}.{html,txt}`);
  console.log(`Subject: ${email.subject}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.preview || !args.send) {
    writePreview();
    if (!args.send) {
      console.log(
        `\nTest: npx tsx scripts/send-interpeace-ngemba-email.ts --to ${SUPPORT_EMAIL} --send`,
      );
      console.log(
        `Prod:  npx tsx scripts/send-interpeace-ngemba-email.ts --to ${INTERPEACE_CONTACT_EMAIL} --send`,
      );
      return;
    }
  }

  if (!canSendViaResendApi()) {
    console.error("Envoi bloque:", resendSendBlockedReason());
    process.exit(1);
  }

  const to = String(args.to || SUPPORT_EMAIL).trim();
  const email = buildInterpeaceNgembaEmail();
  const isTest =
    to.toLowerCase() === SUPPORT_EMAIL.toLowerCase() ||
    to.toLowerCase() === "ceo@mcbuleli.org";
  const subject = isTest ? `[TEST] ${email.subject}` : email.subject;
  const archiveBcc = partnershipArchiveBcc(to);

  writePreview();

  const ok = await sendEmail({
    to,
    subject,
    html: email.html,
    text: email.text,
    from: FROM,
    replyTo: REPLY_TO,
    bcc: archiveBcc,
  });

  if (!ok) {
    console.error(`Echec → ${to}`);
    process.exit(1);
  }
  console.log(
    `Envoye → ${to} | ${subject}${archiveBcc ? ` (BCC ${archiveBcc})` : ""}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

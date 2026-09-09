/**
 * NGEMBA × BCA — email info + accès ops.
 *
 *   NGEMBA_OPS_TOKEN_NGO_BCA=... npx tsx scripts/send-ngemba-bca-access-email.ts --preview
 *   NGEMBA_OPS_TOKEN_NGO_BCA=... npx tsx scripts/send-ngemba-bca-access-email.ts --to hi@mcbuleli.org --send
 *   NGEMBA_OPS_TOKEN_NGO_BCA=... npx tsx scripts/send-ngemba-bca-access-email.ts --to blocamanirdc@gmail.com --send
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { partnershipArchiveBcc } from "../src/lib/email/partnership/partnership-email-config";
import {
  BCA_CONTACT,
  buildBcaAccessEmail,
} from "../src/lib/email/partnership/ngemba-bca-access-email";
import { sendEmail } from "../src/lib/email/send";
import { SUPPORT_EMAIL } from "../src/lib/support-contact";

const FROM = `Mme Patty B. - McBuleli <${SUPPORT_EMAIL}>`;
const REPLY_TO = SUPPORT_EMAIL;
const OUT_DIR = path.join(process.cwd(), "content/email-partnership/ngemba-bca");

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

function requireToken(): string {
  const t = process.env.NGEMBA_OPS_TOKEN_NGO_BCA?.trim();
  if (!t || t.length < 32) {
    console.error(
      "Définir NGEMBA_OPS_TOKEN_NGO_BCA (min 32 car.) avant preview/send.",
    );
    process.exit(1);
  }
  return t;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const token = requireToken();
  const email = buildBcaAccessEmail(token);

  if (args.preview || !args.send) {
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(path.join(OUT_DIR, "bca-access.html"), email.html, "utf8");
    writeFileSync(path.join(OUT_DIR, "bca-access.txt"), email.text, "utf8");
    console.log(`✓ Preview → ${OUT_DIR}/bca-access.{html,txt}`);
    console.log(`Subject: ${email.subject}`);
    if (!args.send) {
      console.log(
        `\nTest: NGEMBA_OPS_TOKEN_NGO_BCA=… npx tsx scripts/send-ngemba-bca-access-email.ts --to ${SUPPORT_EMAIL} --send`,
      );
      return;
    }
  }

  const to = String(args.to || SUPPORT_EMAIL).trim();
  const isTest =
    to.toLowerCase() === SUPPORT_EMAIL.toLowerCase() ||
    to.toLowerCase() === "ceo@mcbuleli.org";
  const subject = isTest ? `[TEST · bca] ${email.subject}` : email.subject;
  const archiveBcc = partnershipArchiveBcc(to);
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
    console.error(`Échec → ${to}`);
    process.exit(1);
  }
  console.log(
    `Envoyé → ${to} | ${subject}${archiveBcc ? ` (BCC ${archiveBcc})` : ""}`,
  );
  console.log(
    `Destinataire prod prévu : ${BCA_CONTACT.to} (après validation du test).`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Kilelo - envoi rapport audit securite kileloapp.com.
 *
 *   npx tsx scripts/send-kilelo-security-audit-email.ts --preview
 *   npx tsx scripts/send-kilelo-security-audit-email.ts --to hi@mcbuleli.org --send
 *   npx tsx scripts/send-kilelo-security-audit-email.ts --to support@kileloapp.com --send
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

export const KILELO_SECURITY_TO = "support@kileloapp.com";
export const KILELO_SECURITY_CC = "ceo@mcbuleli.org";
export const KILELO_SECURITY_REPLY_TO = "ceo@mcbuleli.org";

const SUBJECT =
  "McBuleli - Rapport d'audit de sécurité kileloapp.com (27-28 juillet 2026)";

const PACK_DIR = path.join(
  process.cwd(),
  "content/email-partnership/kilelo-security-audit",
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
    if (a === "--preview") out.preview = true;
    else if (a === "--send") out.send = true;
    else if (a.startsWith("--to=")) out.to = a.slice("--to=".length);
    else if (a === "--to" && argv[i + 1]) out.to = argv[++i];
  }
  return out;
}

function mimeFor(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".md")) return "text/markdown; charset=utf-8";
  if (lower.endsWith(".txt")) return "text/plain; charset=utf-8";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lower.endsWith(".odt")) {
    return "application/vnd.oasis.opendocument.text";
  }
  return "application/octet-stream";
}

function collectAttachments() {
  const names = [
    "McBuleli_Autorisation_Diagnostic_Securite_Kileloapp-v2.pdf",
    "McBuleli_Rapport_Audit_Securite_Kileloapp-resume.md",
    "McBuleli_Rapport_Pentest_Kileloapp-2026-07-28.docx",
    "McBuleli_Rapport_Pentest_Kileloapp-2026-07-28.odt",
  ];
  return names.map((filename) => {
    const abs = path.join(PACK_DIR, filename);
    if (!existsSync(abs)) throw new Error(`Missing ${abs}`);
    return {
      filename,
      content: readFileSync(abs).toString("base64"),
      content_type: mimeFor(filename),
    };
  });
}

function loadBody() {
  const base = path.join(process.cwd(), "content/email-partnership");
  return {
    html: readFileSync(path.join(base, "kilelo-security-audit.html"), "utf8"),
    text: readFileSync(path.join(base, "kilelo-security-audit.txt"), "utf8"),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { html, text } = loadBody();
  const files = collectAttachments();

  console.log(`Subject: ${SUBJECT}`);
  console.log("HTML: content/email-partnership/kilelo-security-audit.html");
  console.log(`Attachments (${files.length}):`);
  for (const f of files) console.log(`  - ${f.filename}`);
  console.log(
    `Prod to: ${KILELO_SECURITY_TO} - CC ${KILELO_SECURITY_CC} - Reply-To ${KILELO_SECURITY_REPLY_TO}`,
  );

  if (!args.send) {
    console.log(
      `\nTest: npx tsx scripts/send-kilelo-security-audit-email.ts --to ${SUPPORT_EMAIL} --send`,
    );
    console.log(
      `Prod: npx tsx scripts/send-kilelo-security-audit-email.ts --to ${KILELO_SECURITY_TO} --send`,
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
  const cc = isTest ? undefined : [KILELO_SECURITY_CC];
  const replyTo = isTest ? SUPPORT_EMAIL : KILELO_SECURITY_REPLY_TO;
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
    fileAttachments: files,
  });
  if (!ok) {
    console.error("Échec Resend");
    process.exit(1);
  }
  const ccNote = cc?.length ? ` - CC ${cc.join(", ")}` : "";
  console.log(
    `Envoyé via Resend -> ${to}${ccNote}${archiveBcc ? ` (BCC ${archiveBcc})` : ""}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Preview or send AvadaPay partnership emails via Resend (McBuleli branding).
 *
 *   npx tsx scripts/send-avadapay-partnership-email.ts --list
 *   npx tsx scripts/send-avadapay-partnership-email.ts --template avadapay_initial_fr --preview
 *   npx tsx scripts/send-avadapay-partnership-email.ts --template avadapay_initial_fr --to info@avadapay.com --send
 *
 * Requires RESEND_API_KEY and RESEND_ALLOW_SEND=true in .env (loaded automatically).
 */
import { existsSync } from "node:fs";
import fs from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import {
  getPartnershipTemplate,
  listPartnershipTemplateIds,
  type PartnershipTemplateId,
} from "../src/lib/email/partnership/avadapay-templates";
import {
  PARTNERSHIP_EMAIL_LAYOUT,
  partnershipEmailBaseUrl,
} from "../src/lib/email/partnership/partnership-email-config";
import { renderPartnershipEmail } from "../src/lib/email/partnership/render-partnership-email";
import { sendPartnershipEmail } from "../src/lib/email/partnership/send-partnership-email";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
} from "../src/lib/email/send";

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
    if (a === "--list") out.list = true;
    else if (a === "--preview") out.preview = true;
    else if (a === "--send") out.send = true;
    else if (a.startsWith("--template=")) out.template = a.slice("--template=".length);
    else if (a === "--template" && argv[i + 1]) {
      out.template = argv[++i];
    } else if (a.startsWith("--to=")) out.to = a.slice("--to=".length);
    else if (a === "--to" && argv[i + 1]) {
      out.to = argv[++i];
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.list) {
    console.log("Templates:");
    for (const id of listPartnershipTemplateIds()) {
      const t = getPartnershipTemplate(id);
      console.log(`  ${id}  →  ${t.subject}`);
    }
    return;
  }

  const templateId = args.template as PartnershipTemplateId | undefined;
  if (!templateId) {
    console.error("Missing --template (e.g. avadapay_initial_fr). Use --list.");
    process.exit(1);
  }

  const template = getPartnershipTemplate(templateId);
  const { html, text, subject } = renderPartnershipEmail({
    template,
    actionUrl: partnershipEmailBaseUrl(),
    layout: PARTNERSHIP_EMAIL_LAYOUT,
  });

  if (args.preview) {
    const outDir = path.join(process.cwd(), ".tmp");
    fs.mkdirSync(outDir, { recursive: true });
    const base = path.join(outDir, `avadapay-${templateId}`);
    fs.writeFileSync(`${base}.html`, html, "utf8");
    fs.writeFileSync(`${base}.txt`, text, "utf8");
    console.log(`Subject: ${subject}`);
    console.log(`Wrote ${base}.html and ${base}.txt`);
    console.log(`Layout: ${PARTNERSHIP_EMAIL_LAYOUT} (conversation = style Gmail Principale)`);
    return;
  }

  const to = typeof args.to === "string" ? args.to : "";
  if (!to) {
    console.error("Missing --to (e.g. info@avadapay.com). Use --preview to export HTML only.");
    process.exit(1);
  }

  if (!args.send) {
    console.error("Add --send to transmit via Resend (or use --preview).");
    process.exit(1);
  }

  if (!canSendViaResendApi()) {
    const reason = resendSendBlockedReason();
    console.error("Envoi bloqué:", reason ?? "configuration Resend invalide");
    console.error("Vérifiez .env à la racine du projet :");
    console.error("  RESEND_API_KEY=re_...");
    console.error("  RESEND_ALLOW_SEND=true");
    process.exit(1);
  }

  const ok = await sendPartnershipEmail({ to, templateId });
  if (!ok) {
    console.error("Échec Resend — voir les logs [email] resend html error ci-dessus.");
    process.exit(1);
  }
  console.log(`✓ Envoyé via Resend : "${subject}" → ${to}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

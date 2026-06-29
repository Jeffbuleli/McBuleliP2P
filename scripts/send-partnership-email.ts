/**
 * Preview or send partnership outreach emails via Resend (McBuleli branding).
 *
 *   npm run email:partnership -- --list
 *   npm run email:partnership -- --template silikin_initial_fr --preview
 *   npm run email:partnership -- --template silikin_initial_fr --to j.kanda@texaf-rdc.com --attach-legal --send
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
} from "../src/lib/email/partnership/partnership-registry";
import {
  buildLegalDocumentAttachments,
  LEGAL_DOCS_DIR,
  listLocalLegalDocumentPaths,
} from "../src/lib/email/partnership/legal-attachments";
import {
  PARTNERSHIP_EMAIL_LAYOUT,
  partnershipEmailBaseUrl,
  partnershipEmailFrom,
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
    else if (a === "--attach-legal") out.attachLegal = true;
    else if (a === "--list-legal") out.listLegal = true;
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

  if (args.listLegal) {
    const files = listLocalLegalDocumentPaths();
    console.log(`Dossier recommandé : ${LEGAL_DOCS_DIR}`);
    if (files.length === 0) {
      console.log("Aucun document légal trouvé.");
      console.log("Copiez vos scans : rccm-1.pdf, rccm-2.pdf, id-nat.pdf");
      return;
    }
    console.log("Documents détectés :");
    for (const f of files) console.log(`  ${f}`);
    return;
  }

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
    console.error("Missing --template (e.g. silikin_initial_fr). Use --list.");
    process.exit(1);
  }

  const template = getPartnershipTemplate(templateId);
  const { html, text, subject } = renderPartnershipEmail({
    template,
    actionUrl: partnershipEmailBaseUrl(),
    layout: PARTNERSHIP_EMAIL_LAYOUT,
  });

  const fileAttachments = args.attachLegal ? buildLegalDocumentAttachments() : undefined;

  if (args.preview) {
    const outDir = path.join(process.cwd(), ".tmp");
    fs.mkdirSync(outDir, { recursive: true });
    const base = path.join(outDir, `partnership-${templateId}`);
    fs.writeFileSync(`${base}.html`, html, "utf8");
    fs.writeFileSync(`${base}.txt`, text, "utf8");
    console.log(`Subject: ${subject}`);
    console.log(`From: ${partnershipEmailFrom(template)}`);
    console.log(`Wrote ${base}.html and ${base}.txt`);
    if (args.attachLegal) {
      const files = listLocalLegalDocumentPaths();
      console.log(
        files.length
          ? `Pièces jointes légales (${files.length}) : ${files.map((f) => path.basename(f)).join(", ")}`
          : "⚠ --attach-legal : aucun RCCM / ID NAT trouvé (voir content/legal-private/README.md)",
      );
    }
    return;
  }

  const to = typeof args.to === "string" ? args.to : "";
  if (!to) {
    console.error("Missing --to (e.g. j.kanda@texaf-rdc.com). Use --preview to export HTML only.");
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

  if (args.attachLegal && (!fileAttachments || fileAttachments.length === 0)) {
    console.error("⚠ --attach-legal : aucun document trouvé dans content/legal-private/");
    console.error("  Copiez rccm-1.pdf, rccm-2.pdf, id-nat.pdf puis relancez.");
    process.exit(1);
  }

  const ok = await sendPartnershipEmail({ to, templateId, fileAttachments });
  if (!ok) {
    console.error("Échec Resend — voir les logs [email] resend html error ci-dessus.");
    process.exit(1);
  }
  const attachNote =
    fileAttachments?.length ? ` (+ ${fileAttachments.length} pièce(s) jointe(s))` : "";
  console.log(`✓ Envoyé via Resend : "${subject}" → ${to}${attachNote}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

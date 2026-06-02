/**
 * Preview or send AvadaPay partnership emails via Resend (McBuleli branding).
 *
 *   npx tsx scripts/send-avadapay-partnership-email.ts --list
 *   npx tsx scripts/send-avadapay-partnership-email.ts --template avadapay_initial_fr --preview
 *   npx tsx scripts/send-avadapay-partnership-email.ts --template avadapay_initial_fr --to info@avadapay.com --send
 *
 * Requires RESEND_API_KEY and RESEND_ALLOW_SEND=true in dev.
 */
import fs from "node:fs";
import path from "node:path";
import {
  getPartnershipTemplate,
  listPartnershipTemplateIds,
  type PartnershipTemplateId,
} from "../src/lib/email/partnership/avadapay-templates";
import { renderPartnershipEmail } from "../src/lib/email/partnership/render-partnership-email";
import { sendPartnershipEmail } from "../src/lib/email/partnership/send-partnership-email";

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
  const { html, text, subject } = renderPartnershipEmail({ template });

  if (args.preview) {
    const outDir = path.join(process.cwd(), ".tmp");
    fs.mkdirSync(outDir, { recursive: true });
    const base = path.join(outDir, `avadapay-${templateId}`);
    fs.writeFileSync(`${base}.html`, html, "utf8");
    fs.writeFileSync(`${base}.txt`, text, "utf8");
    console.log(`Subject: ${subject}`);
    console.log(`Wrote ${base}.html and ${base}.txt`);
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

  const ok = await sendPartnershipEmail({ to, templateId });
  if (!ok) {
    console.error("Send failed or skipped (check RESEND_API_KEY / RESEND_ALLOW_SEND).");
    process.exit(1);
  }
  console.log(`Sent "${subject}" to ${to}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

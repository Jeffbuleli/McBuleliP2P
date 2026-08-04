/**
 * Budget transparent - email court sur mesure par partenaire.
 *
 * Preview:
 *   npx tsx scripts/send-partner-budget-pitch-email.ts --preview
 *
 * Test (toutes les variantes → hi@) :
 *   npx tsx scripts/send-partner-budget-pitch-email.ts --to hi@mcbuleli.org --send
 *
 * Test une org :
 *   npx tsx scripts/send-partner-budget-pitch-email.ts --to hi@mcbuleli.org --partner=ilokwe --send
 *
 * Prod (destinataires reels) :
 *   npx tsx scripts/send-partner-budget-pitch-email.ts --all --send
 *   npx tsx scripts/send-partner-budget-pitch-email.ts --partner=ilokwe --all --send
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import {
  buildPartnerBudgetPitchEmail,
  findPartnerBudgetPitchRecipient,
  PARTNER_BUDGET_PITCH_RECIPIENTS,
  type PartnerBudgetPitchRecipient,
} from "../src/lib/email/partnership/partner-budget-pitch-email";
import {
  partnershipArchiveBcc,
  partnershipEmailFrom,
  partnershipEmailReplyTo,
} from "../src/lib/email/partnership/partnership-email-config";
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
    if (a === "--preview") out.preview = true;
    else if (a === "--send") out.send = true;
    else if (a === "--all") out.all = true;
    else if (a === "--list") out.list = true;
    else if (a.startsWith("--to=")) out.to = a.slice("--to=".length);
    else if (a === "--to" && argv[i + 1]) out.to = argv[++i];
    else if (a.startsWith("--partner="))
      out.partner = a.slice("--partner=".length);
    else if (a === "--partner" && argv[i + 1]) out.partner = argv[++i];
  }
  return out;
}

function selectedPartners(args: Record<string, string | boolean>) {
  if (typeof args.partner === "string" && args.partner.trim()) {
    const hit = findPartnerBudgetPitchRecipient(args.partner);
    if (!hit) {
      console.error(
        `Unknown partner "${args.partner}". IDs: ${PARTNER_BUDGET_PITCH_RECIPIENTS.map((p) => p.id).join(", ")}`,
      );
      process.exit(1);
    }
    return [hit];
  }
  return [...PARTNER_BUDGET_PITCH_RECIPIENTS];
}

function writePreview(partner: PartnerBudgetPitchRecipient) {
  const email = buildPartnerBudgetPitchEmail(partner);
  const dir = path.join(
    process.cwd(),
    "content/email-partnership/partner-budget-pitch",
  );
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${partner.id}.html`), email.html, "utf8");
  writeFileSync(path.join(dir, `${partner.id}.txt`), email.text, "utf8");
  return email;
}

async function sendOne(opts: {
  partner: PartnerBudgetPitchRecipient;
  to: string;
  cc?: string[];
  testMode: boolean;
}) {
  const email = buildPartnerBudgetPitchEmail(opts.partner);
  const subject = opts.testMode
    ? `[TEST ${opts.partner.shortName}] ${email.subject}`
    : email.subject;

  const ok = await sendEmail({
    to: opts.to,
    cc: opts.cc?.length ? opts.cc : undefined,
    subject,
    html: email.html,
    text: email.text,
    from: partnershipEmailFrom(),
    replyTo: partnershipEmailReplyTo(),
    bcc: partnershipArchiveBcc(opts.to),
  });
  writePreview(opts.partner);
  console.log(
    ok
      ? `OK ${opts.partner.shortName} → ${opts.to}${opts.cc?.length ? ` (cc ${opts.cc.join(", ")})` : ""}`
      : `FAIL ${opts.partner.shortName} → ${opts.to}`,
  );
  return ok;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const partners = selectedPartners(args);

  console.log(`Partners (${partners.length}):`);
  for (const p of partners) {
    console.log(
      `  - ${p.id}: ${p.orgName} → ${p.to}${p.cc?.length ? ` (cc ${p.cc.join(", ")})` : ""}`,
    );
    console.log(`    hook: ${p.hook}`);
  }

  for (const p of partners) writePreview(p);
  console.log(
    `\nPreview: content/email-partnership/partner-budget-pitch/{id}.{html,txt}`,
  );

  if (args.list || args.preview || !args.send) {
    console.log(
      `\nTest all → hi@: npm run email:partner-budget-pitch -- --to ${SUPPORT_EMAIL} --send`,
    );
    console.log(
      `Test one:     npm run email:partner-budget-pitch -- --to ${SUPPORT_EMAIL} --partner=ilokwe --send`,
    );
    console.log(
      `Prod:         npm run email:partner-budget-pitch -- --all --send`,
    );
    return;
  }

  if (!canSendViaResendApi()) {
    console.error(resendSendBlockedReason() || "Resend not configured");
    process.exit(1);
  }

  if (args.all) {
    let fails = 0;
    for (const p of partners) {
      const ok = await sendOne({
        partner: p,
        to: p.to,
        cc: p.cc,
        testMode: false,
      });
      if (!ok) fails += 1;
    }
    if (fails) process.exit(1);
    return;
  }

  const to = typeof args.to === "string" ? args.to.trim() : "";
  if (!to) {
    console.error("Missing --to (or use --all for prod recipients)");
    process.exit(1);
  }

  let fails = 0;
  for (const p of partners) {
    const ok = await sendOne({
      partner: p,
      to,
      testMode: true,
    });
    if (!ok) fails += 1;
  }
  if (fails) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

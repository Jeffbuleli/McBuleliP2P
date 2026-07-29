/**
 * Rappel pré-campagne (1er août) — partenaires logo/info manquants ou non confirmés.
 *
 * Preview roster:
 *   npx tsx scripts/send-partner-campaign-reminder-email.ts --preview
 *
 * Test (toutes les variantes → hi@) :
 *   npx tsx scripts/send-partner-campaign-reminder-email.ts --to hi@mcbuleli.org --send
 *
 * Test une org :
 *   npx tsx scripts/send-partner-campaign-reminder-email.ts --to hi@mcbuleli.org --partner=cesar-group --send
 *
 * Prod (destinataires réels) :
 *   npx tsx scripts/send-partner-campaign-reminder-email.ts --all --send
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import {
  buildPartnerCampaignReminderEmail,
  findPartnerCampaignReminder,
  PARTNER_CAMPAIGN_REMINDERS,
  type PartnerCampaignReminder,
} from "../src/lib/email/partnership/partner-campaign-reminder-email";
import { partnershipArchiveBcc } from "../src/lib/email/partnership/partnership-email-config";
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
    else if (a.startsWith("--exclude="))
      out.exclude = a.slice("--exclude=".length);
    else if (a === "--exclude" && argv[i + 1]) out.exclude = argv[++i];
  }
  return out;
}

function selectedPartners(args: Record<string, string | boolean>) {
  let list: PartnerCampaignReminder[] = PARTNER_CAMPAIGN_REMINDERS;
  if (typeof args.partner === "string" && args.partner.trim()) {
    const hit = findPartnerCampaignReminder(args.partner);
    if (!hit) {
      console.error(
        `Unknown partner "${args.partner}". IDs: ${PARTNER_CAMPAIGN_REMINDERS.map((p) => p.id).join(", ")}`,
      );
      process.exit(1);
    }
    list = [hit];
  }
  if (typeof args.exclude === "string" && args.exclude.trim()) {
    const excluded = new Set(
      args.exclude
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    );
    list = list.filter(
      (p) =>
        !excluded.has(p.id.toLowerCase()) &&
        !excluded.has(p.shortName.toLowerCase()),
    );
  }
  return list;
}

function writePreview(partner: PartnerCampaignReminder) {
  const email = buildPartnerCampaignReminderEmail(partner);
  const dir = path.join(
    process.cwd(),
    "content/email-partnership/partner-campaign-reminder",
  );
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${partner.id}.html`), email.html, "utf8");
  writeFileSync(path.join(dir, `${partner.id}.txt`), email.text, "utf8");
  return email;
}

async function sendOne(opts: {
  partner: PartnerCampaignReminder;
  to: string;
  cc?: string[];
  testMode: boolean;
}) {
  const email = buildPartnerCampaignReminderEmail(opts.partner);
  const subject = opts.testMode
    ? `[TEST ${opts.partner.shortName}] ${email.subject}`
    : email.subject;
  const from =
    process.env.PARTNERSHIP_EMAIL_FROM?.trim() ||
    `McBuleli Team <${SUPPORT_EMAIL}>`;
  const replyTo =
    process.env.PARTNERSHIP_EMAIL_REPLY_TO?.trim() || SUPPORT_EMAIL;
  const archiveBcc = partnershipArchiveBcc(opts.to);

  const ok = await sendEmail({
    to: opts.to,
    cc: opts.cc?.length ? opts.cc : undefined,
    subject,
    html: email.html,
    text: email.text,
    from,
    replyTo,
    bcc: archiveBcc,
  });
  writePreview(opts.partner);
  console.log(
    ok
      ? `OK ${opts.partner.shortName} → ${opts.to}${opts.cc?.length ? ` (cc ${opts.cc.join(", ")})` : ""}${archiveBcc ? ` (BCC ${archiveBcc})` : ""}`
      : `FAIL ${opts.partner.shortName} → ${opts.to}`,
  );
  return ok;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const partners = selectedPartners(args);

  console.log(`Partners (${partners.length}):`);
  for (const p of partners) {
    const flags = [
      p.needsLogo ? "logo" : null,
      p.needsConfirmation ? "confirm" : null,
    ]
      .filter(Boolean)
      .join("+");
    console.log(
      `  - ${p.id}: ${p.orgName} [${p.status}|${flags}] → ${p.to}${p.cc?.length ? ` (cc ${p.cc.join(", ")})` : ""}`,
    );
  }

  for (const p of partners) {
    writePreview(p);
  }
  console.log(
    `\nPreview files: content/email-partnership/partner-campaign-reminder/{id}.{html,txt}`,
  );

  if (args.list || args.preview || !args.send) {
    console.log(
      `\nTest all → hi@: npm run email:partner-campaign-reminder -- --to ${SUPPORT_EMAIL} --send`,
    );
    console.log(
      `Prod all:     npm run email:partner-campaign-reminder -- --all --send`,
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

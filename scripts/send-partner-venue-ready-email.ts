/**
 * Confirmation salle Silikin - email partenaires + PJ capture.
 *
 * Preview:
 *   npx tsx scripts/send-partner-venue-ready-email.ts --preview
 *
 * Test (variantes → hi@) :
 *   npx tsx scripts/send-partner-venue-ready-email.ts --to hi@mcbuleli.org --send
 *
 * Une org :
 *   npx tsx scripts/send-partner-venue-ready-email.ts --to hi@mcbuleli.org --partner=ilokwe --send
 *
 * Prod :
 *   npx tsx scripts/send-partner-venue-ready-email.ts --all --send
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import {
  buildPartnerVenueReadyEmail,
  findPartnerVenueReadyRecipient,
  PARTNER_VENUE_READY_RECIPIENTS,
  type PartnerVenueReadyRecipient,
} from "../src/lib/email/partnership/partner-venue-ready-email";
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

const ATTACHMENT_PATH = path.join(
  process.cwd(),
  "public/email-attachments/silikin-confirmation.png",
);

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
    const hit = findPartnerVenueReadyRecipient(args.partner);
    if (!hit) {
      console.error(
        `Unknown partner. IDs: ${PARTNER_VENUE_READY_RECIPIENTS.map((p) => p.id).join(", ")}`,
      );
      process.exit(1);
    }
    return [hit];
  }
  return [...PARTNER_VENUE_READY_RECIPIENTS];
}

function silikinAttachment() {
  if (!existsSync(ATTACHMENT_PATH)) {
    throw new Error(`Missing PJ: ${ATTACHMENT_PATH}`);
  }
  return {
    filename: "silikin-confirmation.png",
    content: readFileSync(ATTACHMENT_PATH).toString("base64"),
    content_type: "image/png",
  };
}

function writePreview(partner: PartnerVenueReadyRecipient) {
  const email = buildPartnerVenueReadyEmail(partner);
  const dir = path.join(
    process.cwd(),
    "content/email-partnership/partner-venue-ready",
  );
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${partner.id}.html`), email.html, "utf8");
  writeFileSync(path.join(dir, `${partner.id}.txt`), email.text, "utf8");
  return email;
}

async function sendOne(opts: {
  partner: PartnerVenueReadyRecipient;
  to: string;
  cc?: string[];
  testMode: boolean;
  attachment: ReturnType<typeof silikinAttachment>;
}) {
  const email = buildPartnerVenueReadyEmail(opts.partner);
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
    fileAttachments: [opts.attachment],
  });
  writePreview(opts.partner);
  console.log(
    ok
      ? `OK ${opts.partner.shortName} → ${opts.to}`
      : `FAIL ${opts.partner.shortName} → ${opts.to}`,
  );
  return ok;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const partners = selectedPartners(args);

  if (args.list) {
    for (const p of PARTNER_VENUE_READY_RECIPIENTS) {
      console.log(`${p.id}\t${p.to}\t${p.orgName}`);
    }
    return;
  }

  if (args.preview || !args.send) {
    for (const p of partners) writePreview(p);
    console.log(
      `Preview: content/email-partnership/partner-venue-ready/ (${partners.length})`,
    );
    console.log(
      `Test: npx tsx scripts/send-partner-venue-ready-email.ts --to ${SUPPORT_EMAIL} --send`,
    );
    if (!args.send) return;
  }

  if (!canSendViaResendApi()) {
    console.error(resendSendBlockedReason() || "Resend not configured");
    process.exit(1);
  }

  const attachment = silikinAttachment();
  const testTo =
    typeof args.to === "string" && args.to.trim() ? args.to.trim() : "";

  if (args.all) {
    let ok = 0;
    for (const partner of partners) {
      const sent = await sendOne({
        partner,
        to: partner.to,
        cc: partner.cc,
        testMode: false,
        attachment,
      });
      if (sent) ok += 1;
    }
    console.log(`Done ${ok}/${partners.length}`);
    return;
  }

  if (!testTo) {
    console.error("Missing --to (test) or --all (prod)");
    process.exit(1);
  }

  let ok = 0;
  for (const partner of partners) {
    const sent = await sendOne({
      partner,
      to: testTo,
      testMode: true,
      attachment,
    });
    if (sent) ok += 1;
  }
  console.log(`Test done ${ok}/${partners.length} → ${testTo}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

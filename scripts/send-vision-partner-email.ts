/**
 * Send tailored partnership emails for the 8-défis partner list.
 *
 * Preview one:
 *   npx tsx scripts/send-vision-partner-email.ts --partner ilokwe-group --preview
 *
 * Preview all:
 *   npx tsx scripts/send-vision-partner-email.ts --partner all --preview
 *
 * Test to hi@ before external send:
 *   npx tsx scripts/send-vision-partner-email.ts --partner all --to hi@mcbuleli.org --send
 *
 * Send one partner to real contact:
 *   npx tsx scripts/send-vision-partner-email.ts --partner netikash --send
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import {
  buildVisionPartnerEmail,
  getVisionPartnerProfile,
  type VisionPartnerId,
  VISION_PARTNER_PROFILES,
} from "../src/lib/email/partnership/vision-partners-email";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
  sendEmail,
} from "../src/lib/email/send";
import { SUPPORT_EMAIL } from "../src/lib/support-contact";
import { partnershipArchiveBcc } from "../src/lib/email/partnership/partnership-email-config";

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
    else if (a.startsWith("--partner=")) out.partner = a.slice("--partner=".length);
    else if (a === "--partner" && argv[i + 1]) out.partner = argv[++i];
    else if (a.startsWith("--to=")) out.to = a.slice("--to=".length);
    else if (a === "--to" && argv[i + 1]) out.to = argv[++i];
  }
  return out;
}

function resolvePartners(partnerArg: string | undefined): VisionPartnerId[] {
  if (!partnerArg || partnerArg === "all") {
    return VISION_PARTNER_PROFILES.map((p) => p.id);
  }
  const ids = new Set(VISION_PARTNER_PROFILES.map((p) => p.id));
  if (!ids.has(partnerArg as VisionPartnerId)) {
    throw new Error(
      `Unknown --partner=${partnerArg}. Use one of: ${Array.from(ids).join(", ")}, all`,
    );
  }
  return [partnerArg as VisionPartnerId];
}

async function sendOne(args: {
  partnerId: VisionPartnerId;
  toOverride: string | null;
}): Promise<boolean> {
  const profile = getVisionPartnerProfile(args.partnerId);
  const email = buildVisionPartnerEmail(profile);
  const to = (args.toOverride?.trim() || profile.contactEmail || "").trim();
  if (!to) {
    console.error(`⨯ ${profile.id}: no recipient email (provide --to).`);
    return false;
  }
  const from =
    process.env.PARTNERSHIP_EMAIL_FROM?.trim() ||
    `McBuleli Team <${SUPPORT_EMAIL}>`;
  const replyTo =
    process.env.PARTNERSHIP_EMAIL_REPLY_TO?.trim() || SUPPORT_EMAIL;
  const archiveBcc = partnershipArchiveBcc(to);
  const ok = await sendEmail({
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    from,
    replyTo,
    bcc: archiveBcc,
  });
  if (!ok) {
    console.error(`⨯ ${profile.id}: send failed`);
    return false;
  }
  console.log(`✓ ${profile.id}: sent to ${to}${archiveBcc ? ` (BCC ${archiveBcc})` : ""}`);
  return true;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const partnerIds = resolvePartners(typeof args.partner === "string" ? args.partner : undefined);
  const outDir = path.join(process.cwd(), "content/email-partnership/vision-partners");
  mkdirSync(outDir, { recursive: true });

  for (const id of partnerIds) {
    const profile = getVisionPartnerProfile(id);
    const email = buildVisionPartnerEmail(profile);
    writeFileSync(path.join(outDir, `${id}.html`), email.html, "utf8");
    writeFileSync(path.join(outDir, `${id}.txt`), email.text, "utf8");
  }
  console.log(`✓ Generated ${partnerIds.length} email fiche(s) in content/email-partnership/vision-partners`);

  if (!args.send) {
    console.log(`\nTest all on hi@:\n  npx tsx scripts/send-vision-partner-email.ts --partner all --to ${SUPPORT_EMAIL} --send`);
    console.log("Send one real:\n  npx tsx scripts/send-vision-partner-email.ts --partner netikash --send");
    return;
  }
  if (!canSendViaResendApi()) {
    console.error("Envoi bloqué:", resendSendBlockedReason());
    process.exit(1);
  }

  const toOverride = typeof args.to === "string" ? args.to : null;
  let okCount = 0;
  for (const id of partnerIds) {
    if (await sendOne({ partnerId: id, toOverride })) okCount += 1;
  }
  console.log(`\nDone: ${okCount}/${partnerIds.length} sent`);
  if (okCount !== partnerIds.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


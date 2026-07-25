/**
 * Annonce rôle partenaire + liens d'accès selon accréditation.
 *
 * Preview roster:
 *   npx tsx scripts/send-partner-role-announcement-email.ts --preview
 *
 * Test (toutes les variantes → hi@) :
 *   npx tsx scripts/send-partner-role-announcement-email.ts --to hi@mcbuleli.org --send
 *
 * Test une org :
 *   npx tsx scripts/send-partner-role-announcement-email.ts --to hi@mcbuleli.org --partner=ilokwe --send
 *
 * Prod (destinataires réels) :
 *   npx tsx scripts/send-partner-role-announcement-email.ts --all --send
 *   npx tsx scripts/send-partner-role-announcement-email.ts --partner=ilokwe --all --send
 *   npx tsx scripts/send-partner-role-announcement-email.ts --all --send --exclude=silikin
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import {
  buildPartnerRoleAnnouncementEmail,
  findPartnerRoleAnnouncement,
  PARTNER_ROLE_ANNOUNCEMENTS,
  type PartnerRoleAnnouncement,
} from "../src/lib/email/partnership/partner-role-announcement-email";
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
    else if (a === "--confirmed") out.confirmed = true;
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
  let list: PartnerRoleAnnouncement[] = PARTNER_ROLE_ANNOUNCEMENTS;
  if (typeof args.partner === "string" && args.partner.trim()) {
    const hit = findPartnerRoleAnnouncement(args.partner);
    if (!hit) {
      console.error(
        `Unknown partner "${args.partner}". IDs: ${PARTNER_ROLE_ANNOUNCEMENTS.map((p) => p.id).join(", ")}`,
      );
      process.exit(1);
    }
    list = [hit];
  }
  if (args.confirmed) {
    list = list.filter((p) => p.status === "confirmed");
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
        !excluded.has(p.shortName.toLowerCase()) &&
        !excluded.has((p.orgSlug ?? "").toLowerCase()),
    );
  }
  return list;
}

function writePreview(partner: PartnerRoleAnnouncement) {
  const email = buildPartnerRoleAnnouncementEmail(partner);
  const dir = path.join(
    process.cwd(),
    "content/email-partnership/partner-role-announcement",
  );
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${partner.id}.html`), email.html, "utf8");
  writeFileSync(path.join(dir, `${partner.id}.txt`), email.text, "utf8");
  return email;
}

async function enrichPartnerBadge(
  partner: PartnerRoleAnnouncement,
): Promise<PartnerRoleAnnouncement> {
  if (partner.hasBadges === false) return partner;
  const { and, eq } = await import("drizzle-orm");
  const { getDb, hackathonPartnerOrgs } = await import("../src/db");
  const { ensurePartnerOrgsSeeded } = await import(
    "../src/lib/hackathon/partner-chat"
  );
  const { ensureOrgPartnerPasses, passToPublic } = await import(
    "../src/lib/hackathon/partner-passes"
  );
  const editionId = await ensurePartnerOrgsSeeded();
  const slug = partner.orgSlug ?? partner.id;
  if (!editionId) {
    throw new Error("featured edition missing - cannot mint partner badges");
  }
  const db = getDb();
  const [org] = await db
    .select()
    .from(hackathonPartnerOrgs)
    .where(
      and(
        eq(hackathonPartnerOrgs.editionId, editionId),
        eq(hackathonPartnerOrgs.slug, slug),
      ),
    )
    .limit(1);
  if (!org) {
    throw new Error(`partner org not found for slug=${slug}`);
  }
  const passes = await ensureOrgPartnerPasses(org.id);
  const seat1 = passes.find((p) => p.seatIndex === 1 && p.ticketCode);
  if (!seat1?.ticketCode) {
    throw new Error(`seat-1 badge missing for ${partner.shortName}`);
  }
  const pub = passToPublic(seat1);
  return {
    ...partner,
    badgePassUrl: pub.passUrl,
    badgeCode: pub.ticketCode,
    hasBadges: true,
  };
}

async function sendOne(opts: {
  partner: PartnerRoleAnnouncement;
  to: string;
  cc?: string[];
  testMode: boolean;
}) {
  let partner = opts.partner;
  try {
    partner = await enrichPartnerBadge(partner);
  } catch (e) {
    console.warn(
      `badge enrich failed for ${opts.partner.shortName}:`,
      e instanceof Error ? e.message : e,
    );
    if (opts.partner.hasBadges !== false) {
      console.error(
        `Abort send for ${opts.partner.shortName}: badge URL required (no /chat fallback).`,
      );
      return false;
    }
  }

  const email = buildPartnerRoleAnnouncementEmail(partner);
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
  writePreview(partner);
  console.log(
    ok
      ? `OK ${opts.partner.shortName} → ${opts.to}${opts.cc?.length ? ` (cc ${opts.cc.join(", ")})` : ""}${partner.badgeCode ? ` [badge ${partner.badgeCode}]` : ""}${archiveBcc ? ` (BCC ${archiveBcc})` : ""}`
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
      `  - ${p.id}: ${p.orgName} [${p.status}] → ${p.to}${p.cc?.length ? ` (cc ${p.cc.join(", ")})` : ""}`,
    );
    console.log(`    rôle: ${p.roleTitle}`);
    console.log(`    CTA: ${p.links[0]?.url}`);
  }

  const enrichedPreviews: PartnerRoleAnnouncement[] = [];
  for (const p of partners) {
    try {
      enrichedPreviews.push(await enrichPartnerBadge(p));
    } catch (e) {
      console.warn(
        `preview badge enrich skipped for ${p.shortName}:`,
        e instanceof Error ? e.message : e,
      );
      enrichedPreviews.push(p);
    }
  }
  for (const p of enrichedPreviews) {
    writePreview(p);
  }
  console.log(
    `\nPreview files: content/email-partnership/partner-role-announcement/{id}.{html,txt}`,
  );
  for (const p of enrichedPreviews) {
    if (p.hasBadges !== false && p.badgePassUrl) {
      console.log(`  badge ${p.shortName}: ${p.badgePassUrl}`);
    }
  }

  if (args.list || args.preview || !args.send) {
    console.log(
      `\nTest all → hi@: npm run email:partner-role-announcement -- --to ${SUPPORT_EMAIL} --send`,
    );
    console.log(
      `Test one:     npm run email:partner-role-announcement -- --to ${SUPPORT_EMAIL} --partner=ilokwe --send`,
    );
    console.log(
      `Prod confirmed: npm run email:partner-role-announcement -- --confirmed --all --send`,
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
      // no CC on test redirects
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

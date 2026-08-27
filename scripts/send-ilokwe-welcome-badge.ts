/**
 * ILOKWE GROUP — ensure McBuleli login + seat-1 badge, send programme email (Mme Patty B.).
 *
 *   npx tsx scripts/send-ilokwe-welcome-badge.ts --preview
 *   npx tsx scripts/send-ilokwe-welcome-badge.ts --send
 *   npx tsx scripts/send-ilokwe-welcome-badge.ts --to hi@mcbuleli.org --send
 */
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import bcrypt from "bcryptjs";
import { buildPartnerWelcomeBadgeEmail } from "../src/lib/email/partnership/partner-welcome-badge-email";
import { partnershipArchiveBcc } from "../src/lib/email/partnership/partnership-email-config";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
  sendEmail,
} from "../src/lib/email/send";
import { ILOKWE_PARTNER } from "../src/lib/hackathon/event-content";
import { passPublicUrl } from "../src/lib/hackathon/access";
import { SUPPORT_EMAIL } from "../src/lib/support-contact";

const PARTNER = {
  orgSlug: "ilokwe",
  email: ILOKWE_PARTNER.email,
  firstName: "Christian",
  lastName: "Ikwele",
  title: "Mr",
  orgName: ILOKWE_PARTNER.name,
  roleLabel:
    "Partenaire Agriculture & AgriBusiness - Sponsor Or - Jury - Mentorat - Atelier",
  talkSlotFr: "10h10 - 10h20 · Agro · Sponsor Or · Prix ILOKWE",
  entitlements: [
    "Talk scène 10h10-10h20 (AgroTech / Sponsor Or)",
    "Siège Jury sur les prototypes AgroTech (Demo Day)",
    "Mentorat des équipes sur le défi AgroTech & économie réelle",
    "Naming du premier prix : Prix ILOKWE",
    "2 places badges partenaires (vous + 1 collègue via Espace partenaires)",
  ],
} as const;

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

function vpsAt(sql: string): string {
  const b64 = Buffer.from(sql, "utf8").toString("base64");
  const out = execSync(
    `ssh -o BatchMode=yes -o ConnectTimeout=20 root@162.35.181.98 "echo ${b64} | base64 -d | docker compose -f /opt/mcbuleli/ops/vps/docker-compose.yml exec -T db psql -U mcbuleli -d mcbuleli -v ON_ERROR_STOP=1 -Atq"`,
    { encoding: "utf8" },
  );
  return out
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^INSERT\s/i.test(l) && !/^UPDATE\s/i.test(l))
    .join("\n")
    .trim();
}

function sqlStr(s: string): string {
  return s.replace(/'/g, "''");
}

/** Ensure verified McBuleli user + link seat-1 badge; return ticket code. */
async function ensureIlokweAccess(): Promise<string> {
  const existingCode = vpsAt(`
SELECT p.ticket_code
FROM hackathon_partner_passes p
JOIN hackathon_partner_orgs o ON o.id = p.org_id
WHERE o.slug = '${PARTNER.orgSlug}'
  AND p.seat_index = 1
  AND p.ticket_code IS NOT NULL
LIMIT 1;
`);
  if (!existingCode) {
    throw new Error("ILOKWE seat-1 badge missing in prod — seed partner passes first");
  }

  const userExists = vpsAt(`
SELECT id FROM users WHERE lower(email) = lower('${sqlStr(PARTNER.email)}') LIMIT 1;
`);

  let userId = userExists;
  if (!userId) {
    const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
    userId = vpsAt(`
INSERT INTO users (
  email, email_canonical, password_hash, role, display_name,
  country_code, legal_first_name, legal_last_name, email_verified_at
)
VALUES (
  lower('${sqlStr(PARTNER.email)}'),
  lower('${sqlStr(PARTNER.email)}'),
  '${sqlStr(passwordHash)}',
  'user',
  '${sqlStr(`${PARTNER.firstName} ${PARTNER.lastName}`)}',
  'CD',
  '${sqlStr(PARTNER.firstName)}',
  '${sqlStr(PARTNER.lastName)}',
  now()
)
ON CONFLICT (email) DO UPDATE
  SET email_verified_at = COALESCE(users.email_verified_at, now()),
      display_name = COALESCE(users.display_name, EXCLUDED.display_name)
RETURNING id;
`);
  } else {
    vpsAt(`
UPDATE users
SET email_verified_at = COALESCE(email_verified_at, now())
WHERE id = '${sqlStr(userId)}'
RETURNING id;
`);
  }

  if (!userId) throw new Error("Failed to ensure ILOKWE user");

  vpsAt(`
UPDATE hackathon_partner_passes p
SET
  owner_user_id = '${sqlStr(userId)}'::uuid,
  holder_email = lower('${sqlStr(PARTNER.email)}'),
  holder_name = COALESCE(holder_name, '${sqlStr(`${PARTNER.firstName} ${PARTNER.lastName}`)}'),
  updated_at = now()
FROM hackathon_partner_orgs o
WHERE o.id = p.org_id
  AND o.slug = '${PARTNER.orgSlug}'
  AND p.seat_index = 1
RETURNING p.ticket_code;
`);

  return existingCode;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ticketCode = await ensureIlokweAccess();
  const ticketUrl = passPublicUrl(ticketCode);
  const email = buildPartnerWelcomeBadgeEmail({
    firstName: PARTNER.firstName,
    lastName: PARTNER.lastName,
    email: PARTNER.email,
    orgName: PARTNER.orgName,
    roleLabel: PARTNER.roleLabel,
    ticketCode,
    ticketUrl,
    title: PARTNER.title,
    talkSlotFr: PARTNER.talkSlotFr,
    entitlements: [...PARTNER.entitlements],
  });

  const outDir = path.join(process.cwd(), "content/email-partnership");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "ilokwe-welcome-badge.html"), email.html, "utf8");
  writeFileSync(path.join(outDir, "ilokwe-welcome-badge.txt"), email.text, "utf8");

  console.log(`Subject: ${email.subject}`);
  console.log(`Badge: ${ticketCode}`);
  console.log(`URL: ${ticketUrl}`);
  console.log(`✓ Preview → content/email-partnership/ilokwe-welcome-badge.html`);

  if (!args.send) {
    console.log(`\nSend: npx tsx scripts/send-ilokwe-welcome-badge.ts --send`);
    console.log(
      `Test: npx tsx scripts/send-ilokwe-welcome-badge.ts --to ${SUPPORT_EMAIL} --send`,
    );
    if (args.preview) console.log(`\n--- TEXT ---\n${email.text}`);
    return;
  }

  process.env.RESEND_ALLOW_SEND = "true";
  if (!canSendViaResendApi()) {
    console.error(resendSendBlockedReason());
    process.exit(1);
  }

  const to =
    (typeof args.to === "string" ? args.to.trim() : "") || PARTNER.email;
  const ok = await sendEmail({
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    from: `Mme Patty B. - McBuleli <${SUPPORT_EMAIL}>`,
    replyTo: SUPPORT_EMAIL,
    bcc: partnershipArchiveBcc(to),
  });
  console.log(ok ? `✓ Sent → ${to}` : `⨯ Send failed → ${to}`);
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

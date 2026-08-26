/**
 * Invite guest Félix Tchana — complimentary ticket + welcome (Mme Patty B.).
 *
 *   npx tsx scripts/send-felix-tchana-welcome-ticket.ts --preview
 *   npx tsx scripts/send-felix-tchana-welcome-ticket.ts --send
 *   npx tsx scripts/send-felix-tchana-welcome-ticket.ts --to hi@mcbuleli.org --send
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { buildGuestWelcomeTicketEmail } from "../src/lib/email/partnership/guest-welcome-ticket-email";
import { partnershipArchiveBcc } from "../src/lib/email/partnership/partnership-email-config";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
  sendEmail,
} from "../src/lib/email/send";
import { SUPPORT_EMAIL } from "../src/lib/support-contact";

const GUEST = {
  firstName: "Félix",
  lastName: "Tchana",
  email: "tchanafelix92@gmail.com",
  title: "Mr",
  /** Placeholder MoMo-format phone (required by schema); guest can update later. */
  phone: "243899200092",
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

/** Ensure paid complimentary registration; return ticket code. */
function ensureGuestTicket(): string {
  const existing = vpsAt(`
SELECT ticket_code
FROM hackathon_registrations r
JOIN hackathon_editions e ON e.id = r.edition_id AND e.featured = true
WHERE lower(r.email) = lower('${GUEST.email}')
  AND r.payment_status = 'paid'
  AND r.ticket_code IS NOT NULL
LIMIT 1;
`);
  if (existing) return existing;

  const inserted = vpsAt(`
WITH ed AS (
  SELECT id FROM hackathon_editions WHERE featured = true LIMIT 1
),
code AS (
  SELECT 'MBH-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10)) AS ticket_code
)
INSERT INTO hackathon_registrations (
  edition_id, first_name, last_name, email, phone, whatsapp,
  level, work_mode, ticket_pack, price_usd, payment_status,
  ticket_code, locale, promo_code, utm_source, utm_medium, utm_campaign,
  presence_status, created_at, updated_at
)
SELECT
  ed.id,
  '${GUEST.firstName.replace(/'/g, "''")}',
  '${GUEST.lastName.replace(/'/g, "''")}',
  lower('${GUEST.email}'),
  '${GUEST.phone}',
  '${GUEST.phone}',
  'intermediate',
  'solo',
  'full',
  0.00,
  'paid',
  code.ticket_code,
  'fr',
  'GUEST',
  'invite',
  'email',
  'patty_welcome',
  'absent',
  now(),
  now()
FROM ed, code
RETURNING ticket_code;
`);
  if (!inserted) throw new Error("Failed to insert guest registration");
  return inserted;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ticketCode = ensureGuestTicket();
  const ticketUrl = `https://mcbuleli.org/hackathon/pass/${encodeURIComponent(ticketCode)}`;
  const email = buildGuestWelcomeTicketEmail({
    firstName: GUEST.firstName,
    lastName: GUEST.lastName,
    email: GUEST.email,
    ticketCode,
    ticketUrl,
    title: GUEST.title,
  });

  const outDir = path.join(process.cwd(), "content/email-partnership");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "felix-tchana-welcome-ticket.html"), email.html, "utf8");
  writeFileSync(path.join(outDir, "felix-tchana-welcome-ticket.txt"), email.text, "utf8");

  console.log(`Subject: ${email.subject}`);
  console.log(`Ticket: ${ticketCode}`);
  console.log(`URL: ${ticketUrl}`);
  console.log(`✓ Preview → content/email-partnership/felix-tchana-welcome-ticket.html`);

  if (!args.send) {
    console.log(
      `\nSend: npx tsx scripts/send-felix-tchana-welcome-ticket.ts --send`,
    );
    console.log(
      `Test: npx tsx scripts/send-felix-tchana-welcome-ticket.ts --to ${SUPPORT_EMAIL} --send`,
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
    (typeof args.to === "string" ? args.to.trim() : "") || GUEST.email;
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

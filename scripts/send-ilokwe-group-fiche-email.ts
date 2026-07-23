/**
 * ILOKWE GROUP - fiche partenariat confirmé + seed promo ILOKWE (VPS DB via SSH).
 *
 *   npx tsx scripts/send-ilokwe-group-fiche-email.ts --preview
 *   npx tsx scripts/send-ilokwe-group-fiche-email.ts --to hi@mcbuleli.org --send
 *   npx tsx scripts/send-ilokwe-group-fiche-email.ts --to ilokwegroup@gmail.com --send
 */
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import {
  buildIlokweGroupFicheEmail,
  ILOKWE_GROUP_EMAIL,
  ILOKWE_LOGO_CID,
  ILOKWE_LOGO_PUBLIC_PATH,
} from "../src/lib/email/partnership/ilokwe-group-fiche-email";
import { partnershipPublicBaseUrl } from "../src/lib/email/config";
import { partnershipArchiveBcc } from "../src/lib/email/partnership/partnership-email-config";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
  sendEmail,
} from "../src/lib/email/send";
import { ILOKWE_PARTNER } from "../src/lib/hackathon/event-content";
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
    else if (a.startsWith("--to=")) out.to = a.slice("--to=".length);
    else if (a === "--to" && argv[i + 1]) out.to = argv[++i];
  }
  return out;
}

function sqlEscape(s: string): string {
  return s.replace(/'/g, "''");
}

function vpsSql(sql: string): string {
  const b64 = Buffer.from(sql, "utf8").toString("base64");
  return execSync(
    `ssh -o BatchMode=yes root@162.35.181.98 "echo ${b64} | base64 -d | docker compose -f /opt/mcbuleli/ops/vps/docker-compose.yml exec -T db psql -U mcbuleli -d mcbuleli -v ON_ERROR_STOP=1 -At"`,
    { encoding: "utf8", maxBuffer: 2_000_000 },
  ).trim();
}

function seedIlokwePromo(): { code: string; shareUrl: string; dashboardUrl: string } {
  const editionId = vpsSql(
    `SELECT id FROM hackathon_editions WHERE featured = true LIMIT 1;`,
  );
  if (!editionId) throw new Error("Aucune edition featured sur VPS.");

  const code = ILOKWE_PARTNER.promoCode;
  const existing = vpsSql(
    `SELECT dashboard_token FROM hackathon_promo_codes WHERE edition_id = '${sqlEscape(editionId)}' AND lower(code) = lower('${sqlEscape(code)}') LIMIT 1;`,
  );

  let token = existing;
  if (!token) {
    token = randomBytes(24).toString("base64url");
    vpsSql(`
INSERT INTO hackathon_promo_codes (
  edition_id, code, org_name, partner_email, partner_name, kind,
  discount_percent, cashback_usd, active, dashboard_token
) VALUES (
  '${sqlEscape(editionId)}',
  '${sqlEscape(code)}',
  '${sqlEscape(ILOKWE_PARTNER.name)}',
  '${sqlEscape(ILOKWE_GROUP_EMAIL)}',
  '${sqlEscape(ILOKWE_PARTNER.contactName)}',
  'partner',
  10, 10, true, '${sqlEscape(token)}'
);`);
    console.log(`[seed] inserted ${code}`);
  } else {
    vpsSql(`
UPDATE hackathon_promo_codes SET
  org_name = '${sqlEscape(ILOKWE_PARTNER.name)}',
  partner_email = '${sqlEscape(ILOKWE_GROUP_EMAIL)}',
  partner_name = '${sqlEscape(ILOKWE_PARTNER.contactName)}',
  kind = 'partner',
  discount_percent = 10,
  cashback_usd = 10,
  active = true,
  code = '${sqlEscape(code)}',
  updated_at = now()
WHERE edition_id = '${sqlEscape(editionId)}' AND lower(code) = lower('${sqlEscape(code)}');`);
    console.log(`[seed] updated ${code}`);
  }

  const base = partnershipPublicBaseUrl();
  return {
    code,
    shareUrl: `${base}/hackathon?promo=${encodeURIComponent(code)}#register`,
    dashboardUrl: `${base}/hackathon/promo/dashboard/${encodeURIComponent(token)}`,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const promo = seedIlokwePromo();

  const email = buildIlokweGroupFicheEmail({
    promoShareUrl: promo.shareUrl,
    promoDashboardUrl: promo.dashboardUrl,
    useInlineLogo: true,
  });

  const outDir = path.join(process.cwd(), "content/email-partnership");
  mkdirSync(outDir, { recursive: true });

  const preview = buildIlokweGroupFicheEmail({
    promoShareUrl: promo.shareUrl,
    promoDashboardUrl: promo.dashboardUrl,
    useInlineLogo: false,
  });
  writeFileSync(
    path.join(outDir, "ilokwe-group-fiche-partenariat.html"),
    preview.html,
    "utf8",
  );
  writeFileSync(
    path.join(outDir, "ilokwe-group-fiche-partenariat.txt"),
    preview.text,
    "utf8",
  );

  console.log(`Subject: ${email.subject}`);
  console.log(`Promo ${promo.code}: ${promo.shareUrl}`);
  console.log(`Dashboard: ${promo.dashboardUrl}`);
  console.log(
    "✓ HTML → content/email-partnership/ilokwe-group-fiche-partenariat.html",
  );
  console.log(`Contact: ${ILOKWE_PARTNER.contactName} · ${ILOKWE_GROUP_EMAIL}`);

  if (!args.send) {
    console.log(
      `\nTest: npx tsx scripts/send-ilokwe-group-fiche-email.ts --to ${SUPPORT_EMAIL} --send`,
    );
    console.log(
      `Prod: npx tsx scripts/send-ilokwe-group-fiche-email.ts --to ${ILOKWE_GROUP_EMAIL} --send`,
    );
    return;
  }

  const to = typeof args.to === "string" ? args.to.trim() : "";
  if (!to) {
    console.error("Missing --to");
    process.exit(1);
  }

  process.env.RESEND_ALLOW_SEND = "true";
  if (!canSendViaResendApi()) {
    console.error("Envoi bloqué:", resendSendBlockedReason());
    process.exit(1);
  }

  const from =
    process.env.PARTNERSHIP_EMAIL_FROM?.trim() ||
    `McBuleli Team <${SUPPORT_EMAIL}>`;
  const replyTo =
    process.env.PARTNERSHIP_EMAIL_REPLY_TO?.trim() || SUPPORT_EMAIL;

  const logoAbs = path.join(process.cwd(), "public", ILOKWE_LOGO_PUBLIC_PATH);
  const logoB64 = readFileSync(logoAbs).toString("base64");

  const archiveBcc = partnershipArchiveBcc(to);
  const ok = await sendEmail({
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    from,
    replyTo,
    bcc: archiveBcc,
    inlineAttachments: [
      {
        filename: "ilokwe-group-logo.png",
        content: logoB64,
        content_id: ILOKWE_LOGO_CID,
        content_type: "image/png",
      },
    ],
  });
  if (!ok) {
    console.error("Échec Resend");
    process.exit(1);
  }
  console.log(
    `✓ Envoyé via Resend → ${to}${archiveBcc ? ` (BCC ${archiveBcc})` : ""}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

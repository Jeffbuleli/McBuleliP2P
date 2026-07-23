/**
 * Batch seed + send partner promo confirm emails (VPS DB via SSH, Resend local).
 *
 *   npx tsx scripts/send-partner-promo-batch.ts --send
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { buildPartnerPromoConfirmEmail } from "../src/lib/email/partnership/partner-promo-confirm-email";
import { partnershipArchiveBcc } from "../src/lib/email/partnership/partnership-email-config";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
  sendEmail,
} from "../src/lib/email/send";
import { partnershipPublicBaseUrl } from "../src/lib/email/config";
import { HACKATHON_PRICE_USD } from "../src/lib/hackathon/constants";
import { SUPPORT_EMAIL } from "../src/lib/support-contact";

type BatchPartner = {
  to: string;
  cc?: string[];
  code: string;
  orgName: string;
  partnerName: string;
};

const PARTNERS: BatchPartner[] = [
  {
    to: "aleluyaprod12@gmail.com",
    code: "ALELUYAPROD12",
    orgName: "Aleluya Prod",
    partnerName: "Aleluya Prod",
  },
  {
    to: "kinideenews@gmail.com",
    code: "KINIDEENEWS",
    orgName: "KinIdee News",
    partnerName: "KinIdee News",
  },
  {
    to: "mangingacarlos@gmail.com",
    code: "MANGINGA3",
    orgName: "Mangina Carlos",
    partnerName: "Carlos",
  },
  {
    to: "anselmk4@gmail.com",
    cc: ["ansel@kuettu.com"],
    code: "ANSELLA",
    orgName: "AnsellA / Kuettu",
    partnerName: "Ansell",
  },
  {
    to: "japhetnm@gmail.com",
    code: "ENVOLCONCEPT",
    orgName: "Envol Concept",
    partnerName: "Envol Concept",
  },
];

function loadLocalEnv(): void {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  try {
    loadEnvFile(envPath);
  } catch {
    /* already */
  }
}

loadLocalEnv();

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

function priceUsd(discountPercent: number): string {
  return String(Math.round((Number(HACKATHON_PRICE_USD) * (100 - discountPercent)) / 100));
}

async function main() {
  const send = process.argv.includes("--send");
  if (!send) {
    console.log("Ajoutez --send pour seed VPS + envoi Resend.");
    return;
  }
  process.env.RESEND_ALLOW_SEND = "true";
  if (!canSendViaResendApi()) {
    console.error(resendSendBlockedReason());
    process.exit(1);
  }

  const editionId = vpsSql(
    `SELECT id FROM hackathon_editions WHERE featured = true LIMIT 1;`,
  );
  if (!editionId) {
    console.error("Aucune edition featured sur VPS.");
    process.exit(1);
  }
  console.log(`[edition] ${editionId}`);

  const base = partnershipPublicBaseUrl();
  const outDir = path.resolve(process.cwd(), "content/email-partnership/partner-promo");
  mkdirSync(outDir, { recursive: true });

  for (const p of PARTNERS) {
    const code = p.code.trim().toUpperCase();
    const existing = vpsSql(
      `SELECT dashboard_token FROM hackathon_promo_codes WHERE edition_id = '${sqlEscape(editionId)}' AND lower(code) = lower('${sqlEscape(code)}') LIMIT 1;`,
    );
    let token = existing;
    if (!token) {
      token = randomBytes(24).toString("base64url");
      vpsSql(`
INSERT INTO hackathon_promo_codes (
  edition_id, code, org_name, partner_email, partner_name,
  discount_percent, cashback_usd, active, dashboard_token
) VALUES (
  '${sqlEscape(editionId)}',
  '${sqlEscape(code)}',
  '${sqlEscape(p.orgName)}',
  '${sqlEscape(p.to.toLowerCase())}',
  '${sqlEscape(p.partnerName)}',
  10, 10, true, '${sqlEscape(token)}'
);`);
      console.log(`[seed] inserted ${code}`);
    } else {
      vpsSql(`
UPDATE hackathon_promo_codes SET
  org_name = '${sqlEscape(p.orgName)}',
  partner_email = '${sqlEscape(p.to.toLowerCase())}',
  partner_name = '${sqlEscape(p.partnerName)}',
  discount_percent = 10,
  cashback_usd = 10,
  active = true,
  code = '${sqlEscape(code)}',
  updated_at = now()
WHERE edition_id = '${sqlEscape(editionId)}' AND lower(code) = lower('${sqlEscape(code)}');`);
      console.log(`[seed] updated ${code}`);
    }

    const shareUrl = `${base}/hackathon?promo=${encodeURIComponent(code)}#register`;
    const dashboardUrl = `${base}/hackathon/promo/dashboard/${encodeURIComponent(token)}`;
    const email = buildPartnerPromoConfirmEmail({
      orgName: p.orgName,
      partnerName: p.partnerName,
      partnerEmail: p.to,
      code,
      discountPercent: 10,
      cashbackUsd: 10,
      priceUsd: priceUsd(10),
      shareUrl,
      dashboardUrl,
    });

    writeFileSync(path.join(outDir, `${code.toLowerCase()}.html`), email.html, "utf8");
    writeFileSync(path.join(outDir, `${code.toLowerCase()}.txt`), email.text, "utf8");

    const ok = await sendEmail({
      to: p.to,
      cc: p.cc,
      subject: email.subject,
      html: email.html,
      text: email.text,
      from: `McBuleli <${SUPPORT_EMAIL}>`,
      replyTo: SUPPORT_EMAIL,
      bcc: partnershipArchiveBcc(p.to),
    });
    if (!ok) {
      console.error(`[fail] ${p.to} ${code}`);
      process.exit(1);
    }
    console.log(
      `[ok] ${p.to}${p.cc?.length ? ` cc=${p.cc.join(",")}` : ""} - ${code}`,
    );
    console.log(`     ${dashboardUrl}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

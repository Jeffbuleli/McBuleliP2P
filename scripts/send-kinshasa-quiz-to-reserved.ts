/**
 * Bonne nouvelle quiz Kinshasa → inscrits payment_status=reserved.
 *
 *   npx tsx scripts/send-kinshasa-quiz-to-reserved.ts --preview
 *   npx tsx scripts/send-kinshasa-quiz-to-reserved.ts --to hi@mcbuleli.org --send
 *   npx tsx scripts/send-kinshasa-quiz-to-reserved.ts --all --send
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { partnershipArchiveBcc } from "../src/lib/email/partnership/partnership-email-config";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
  sendEmail,
} from "../src/lib/email/send";
import { SUPPORT_EMAIL } from "../src/lib/support-contact";

const QUIZ_URL =
  "https://mcbuleli.org/hackathon/promo/kinshasa?utm_source=email&utm_medium=reserved&utm_campaign=kinshasa_quiz";

const SUBJECT =
  "Bonne nouvelle : place gratuite possible via quiz · McBuleli Hackathon";

type Recipient = {
  firstName: string;
  lastName: string;
  email: string;
};

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
  }
  return out;
}

function vpsAt(sql: string): string {
  const b64 = Buffer.from(sql, "utf8").toString("base64");
  return execSync(
    `ssh -o BatchMode=yes -o ConnectTimeout=20 root@162.35.181.98 "echo ${b64} | base64 -d | docker compose -f /opt/mcbuleli/ops/vps/docker-compose.yml exec -T db psql -U mcbuleli -d mcbuleli -v ON_ERROR_STOP=1 -At"`,
    { encoding: "utf8" },
  ).trim();
}

function loadReserved(): Recipient[] {
  const raw = vpsAt(`
SELECT first_name || E'\\t' || last_name || E'\\t' || email
FROM hackathon_registrations
WHERE payment_status = 'reserved'
ORDER BY created_at;
`);
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [firstName, lastName, email] = line.split("\t");
      return {
        firstName: (firstName || "Ami").trim(),
        lastName: (lastName || "").trim(),
        email: (email || "").trim().toLowerCase(),
      };
    })
    .filter((r) => r.email.includes("@"));
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmail(firstName: string) {
  const name = firstName.trim() || "Ami";
  const text = `Bonjour ${name},

Bonne nouvelle concernant votre réservation au McBuleli Hackathon (28 août · Silikin Village).

Un partenaire vient d'ouvrir 10 places gratuites pour les personnes qui réussissent un quiz de bases en informatique et programmation. Comme votre inscription n'est pas encore payée, vous pouvez tenter d'obtenir une place offerte — si vous êtes éligible.

IMPORTANT — ne passez le quiz que si :
• vous êtes à Kinshasa, et
• vous serez bien disponible toute la journée du 28 août 2026 à Silikin Village.

Sinon, ne candidatez pas : les places sont limitées, une seule tentative, et seuls les présents comptent.

Le quiz : 10 questions · 9 minutes · réussite à 70 % · ticket QR gratuit par e-mail si réussi.

Lien :
${QUIZ_URL}

Vous pouvez aussi finaliser votre paiement classique si vous préférez garder le parcours payant.

L'équipe McBuleli
${SUPPORT_EMAIL}
`;

  const html = `<!DOCTYPE html>
<html lang="fr"><body style="margin:0;padding:0;background:#e8f3ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#e8f3ee;padding:28px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #d6d3d1;overflow:hidden;">
<tr><td style="padding:22px 28px 8px;border-bottom:1px solid #d6d3d1;">
<p style="margin:0;font-size:17px;font-weight:800;color:#305f33;">McBuleli</p>
<p style="margin:2px 0 0;font-size:12px;color:#57534e;">Hackathon · Bonne nouvelle</p>
</td></tr>
<tr><td style="padding:24px 28px;">
<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#0c0a09;">Bonjour ${esc(name)},</p>
<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#57534e;">
<strong style="color:#0c0a09;">Bonne nouvelle</strong> concernant votre réservation au McBuleli Hackathon
(<strong style="color:#0c0a09;">28 août · Silikin Village</strong>).
</p>
<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#57534e;">
Un partenaire vient d'ouvrir <strong style="color:#0c0a09;">10 places gratuites</strong> pour celles et ceux qui réussissent un quiz de bases en informatique et programmation.
Comme votre inscription n'est <strong style="color:#0c0a09;">pas encore payée</strong>, vous pouvez tenter d'obtenir une place offerte — si vous êtes éligible.
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
<tr><td style="padding:14px 16px;background:#fffbeb;border-radius:12px;">
<p style="margin:0;font-size:14px;line-height:1.5;color:#0c0a09;">
<strong>Passez le quiz seulement si</strong> vous êtes <strong>à Kinshasa</strong> et
<strong>disponible le 28 août</strong> toute la journée à Silikin Village.
Sinon, ne candidatez pas : places limitées, une seule tentative.
</p>
</td></tr>
</table>
<p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:#57534e;">
10 questions · 9 minutes · réussite à 70 % · ticket QR gratuit par e-mail si réussi.
</p>
<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 14px;"><tr>
<td style="border-radius:12px;background:#305f33;">
<a href="${QUIZ_URL}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Tenter le quiz gratuit</a>
</td>
</tr></table>
<p style="margin:0;font-size:13px;line-height:1.5;color:#57534e;">
Vous pouvez aussi finaliser le paiement classique si vous préférez le parcours payant.
</p>
</td></tr>
<tr><td style="padding:18px 28px 24px;border-top:1px solid #d6d3d1;font-size:12px;color:#57534e;">
L'équipe McBuleli · <a href="mailto:${SUPPORT_EMAIL}" style="color:#305f33;">${SUPPORT_EMAIL}</a>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  return { subject: SUBJECT, html, text };
}

async function sendOne(r: Recipient): Promise<boolean> {
  const email = buildEmail(r.firstName);
  const ok = await sendEmail({
    to: r.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
    from: `McBuleli Team <${SUPPORT_EMAIL}>`,
    replyTo: SUPPORT_EMAIL,
    bcc: partnershipArchiveBcc(r.email),
  });
  console.log(ok ? `✓ ${r.firstName} → ${r.email}` : `⨯ ${r.firstName} → ${r.email}`);
  return ok;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const recipients = loadReserved();
  console.log(`Subject: ${SUBJECT}`);
  console.log(`Reserved recipients: ${recipients.length}`);
  for (const r of recipients) {
    console.log(`  - ${r.firstName} ${r.lastName} <${r.email}>`);
  }

  if (args.list || args.preview || !args.send) {
    const sample = buildEmail(recipients[0]?.firstName || "Ami");
    console.log(
      `\nTest: npx tsx scripts/send-kinshasa-quiz-to-reserved.ts --to ${SUPPORT_EMAIL} --send`,
    );
    console.log(
      `Prod:  npx tsx scripts/send-kinshasa-quiz-to-reserved.ts --all --send`,
    );
    if (args.preview) {
      console.log(`\n--- TEXT ---\n${sample.text}`);
    }
    return;
  }

  process.env.RESEND_ALLOW_SEND = "true";
  if (!canSendViaResendApi()) {
    console.error(resendSendBlockedReason());
    process.exit(1);
  }

  if (args.all) {
    let fails = 0;
    for (const r of recipients) {
      const ok = await sendOne(r);
      if (!ok) fails += 1;
    }
    if (fails) process.exit(1);
    return;
  }

  const to = typeof args.to === "string" ? args.to.trim() : "";
  if (!to) {
    console.error("Missing --to or --all");
    process.exit(1);
  }
  const match = recipients.find((r) => r.email === to.toLowerCase());
  const ok = await sendOne({
    firstName: match?.firstName || "Ami",
    lastName: match?.lastName || "",
    email: to,
  });
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

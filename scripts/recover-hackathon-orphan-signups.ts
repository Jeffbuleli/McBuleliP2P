/**
 * Recover hackathon funnel gaps:
 * - Restore payment tokens for failed / reserved rows missing tokens
 * - Create reserved draft seats for verified accounts without registration
 * - Email pay / finish links
 *
 *   npx tsx scripts/recover-hackathon-orphan-signups.ts --preview
 *   npx tsx scripts/recover-hackathon-orphan-signups.ts --send
 */
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { and, desc, eq, or, sql } from "drizzle-orm";
import {
  getDb,
  hackathonEditions,
  hackathonRegistrations,
  users,
} from "../src/db";
import { HACKATHON_PRICE_USD } from "../src/lib/hackathon/constants";
import {
  generatePaymentToken,
  payLaterPublicUrl,
} from "../src/lib/hackathon/service";
import { sendHackathonReserveEmail } from "../src/lib/email/messages/hackathon";
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

const PARTNER_OR_STAFF_EMAIL_RE =
  /(kilelo|montana|rdpi|e-comsas|ch-kin|dewiyatech|mcbuleli|menorah|cesar|silikin|pawapay|binance)/i;

/** Personal-looking accounts to backfill (exclude known partners). */
function isLikelyParticipantOrphan(email: string, displayName: string | null): boolean {
  const e = email.toLowerCase();
  if (PARTNER_OR_STAFF_EMAIL_RE.test(e)) return false;
  if (PARTNER_OR_STAFF_EMAIL_RE.test(displayName || "")) return false;
  // Prefer freemail / personal inboxes created recently for the hackathon funnel.
  return (
    e.endsWith("@gmail.com") ||
    e.endsWith("@yahoo.com") ||
    e.endsWith("@outlook.com") ||
    e.endsWith("@hotmail.com")
  );
}

function splitName(displayName: string | null, email: string): {
  firstName: string;
  lastName: string;
} {
  const raw = (displayName || email.split("@")[0] || "Participant").trim();
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return {
      firstName: parts[0]!.slice(0, 80),
      lastName: parts.slice(1).join(" ").slice(0, 80),
    };
  }
  return { firstName: raw.slice(0, 80), lastName: "Participant" };
}

function draftPhoneForEmail(email: string): string {
  // Unique placeholder MoMo MSISDN (user must replace on pay page).
  const hex = randomBytes(3).toString("hex");
  const n = Number.parseInt(hex, 16) % 10_000_000;
  return `24389${String(n).padStart(7, "0")}`;
}

function parseArgs(argv: string[]) {
  const out: { send?: boolean; preview?: boolean } = {};
  for (const a of argv) {
    if (a === "--send") out.send = true;
    if (a === "--preview") out.preview = true;
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const db = getDb();

  const [edition] = await db
    .select({ id: hackathonEditions.id, nameFr: hackathonEditions.nameFr })
    .from(hackathonEditions)
    .where(eq(hackathonEditions.featured, true))
    .orderBy(desc(hackathonEditions.createdAt))
    .limit(1);
  if (!edition) {
    console.error("No featured edition");
    process.exit(1);
  }
  console.log(`Edition: ${edition.nameFr} (${edition.id})`);

  // 1) Restore tokens for failed / reserved missing tokens
  const broken = await db
    .select({
      id: hackathonRegistrations.id,
      email: hackathonRegistrations.email,
      firstName: hackathonRegistrations.firstName,
      paymentStatus: hackathonRegistrations.paymentStatus,
      paymentToken: hackathonRegistrations.paymentToken,
    })
    .from(hackathonRegistrations)
    .where(
      and(
        eq(hackathonRegistrations.editionId, edition.id),
        or(
          eq(hackathonRegistrations.paymentStatus, "failed"),
          eq(hackathonRegistrations.paymentStatus, "reserved"),
          eq(hackathonRegistrations.paymentStatus, "pending"),
        ),
      ),
    );

  for (const row of broken) {
    if (row.paymentToken) {
      console.log(`OK token ${row.email} (${row.paymentStatus})`);
      continue;
    }
    const token = generatePaymentToken();
    if (!args.send) {
      console.log(`[preview] restore token → ${row.email}`);
      continue;
    }
    await db
      .update(hackathonRegistrations)
      .set({
        paymentToken: token,
        paymentStatus:
          row.paymentStatus === "failed" ? "failed" : "reserved",
        updatedAt: new Date(),
      })
      .where(eq(hackathonRegistrations.id, row.id));
    console.log(`✓ token restored ${row.email} → ${payLaterPublicUrl(token)}`);
    void sendHackathonReserveEmail({ registrationId: row.id }).catch(() => null);
  }

  // 2) Orphan verified users → reserved draft + email
  const orphanRows = await db
    .select({
      id: users.id,
      email: users.email,
      display_name: users.displayName,
      created_at: users.createdAt,
    })
    .from(users)
    .where(
      and(
        sql`${users.emailVerifiedAt} is not null`,
        sql`${users.createdAt} > now() - interval '21 days'`,
        sql`not exists (
          select 1 from hackathon_registrations hr
          where lower(hr.email) = lower(${users.email})
             or hr.user_id = ${users.id}
        )`,
      ),
    )
    .orderBy(desc(users.createdAt));

  for (const u of orphanRows) {
    if (!isLikelyParticipantOrphan(u.email, u.display_name)) {
      console.log(`skip partner/staff orphan ${u.email}`);
      continue;
    }
    const { firstName, lastName } = splitName(u.display_name, u.email);
    const token = generatePaymentToken();
    const phone = draftPhoneForEmail(u.email);
    if (!args.send) {
      console.log(
        `[preview] add reserved ${u.email} (${firstName} ${lastName}) phone=${phone}`,
      );
      continue;
    }
    const [created] = await db
      .insert(hackathonRegistrations)
      .values({
        editionId: edition.id,
        userId: u.id,
        email: u.email.toLowerCase(),
        firstName,
        lastName,
        phone,
        whatsapp: phone,
        ticketPack: "full",
        priceUsd: HACKATHON_PRICE_USD,
        paymentStatus: "reserved",
        paymentToken: token,
        locale: "fr",
        utmSource: "orphan_account_recovery",
        utmMedium: "email",
        utmCampaign: "hackathon_finish_signup",
      })
      .onConflictDoNothing()
      .returning({ id: hackathonRegistrations.id });

    if (!created) {
      console.log(`skip existing ${u.email}`);
      continue;
    }
    console.log(`✓ reserved ${u.email} → ${payLaterPublicUrl(token)}`);
    void sendHackathonReserveEmail({ registrationId: created.id }).catch(
      () => null,
    );

    if (!canSendViaResendApi()) {
      console.warn(resendSendBlockedReason());
    } else {
      const payUrl = payLaterPublicUrl(token);
      // Resend allows ~10 req/s — keep headroom when also sending reserve emails.
      await new Promise((r) => setTimeout(r, 250));
      await sendEmail({
        to: u.email,
        subject:
          "McBuleli Hackathon - Finalisez votre inscription (compte ≠ place)",
        text: `Bonjour ${firstName},

Vous avez créé un compte McBuleli, mais cela ne réserve pas encore une place au Hackathon.

Pour être sur la liste des inscrits, finalisez le paiement ici :
${payUrl}

Important :
1) Remplacez le numéro téléphone MoMo par votre vrai numéro (Orange, M-Pesa ou Airtel)
2) Confirmez le paiement sur votre téléphone
3) Vous recevrez ensuite votre ticket QR

Programme : 28–29 août 2026 · Silikin Village
https://mcbuleli.org/hackathon

Mme Patty B.
McBuleli Team
${SUPPORT_EMAIL}
`,
        html: `<p>Bonjour <strong>${firstName}</strong>,</p>
<p>Vous avez créé un compte McBuleli, mais <strong>cela ne réserve pas encore une place</strong> au Hackathon.</p>
<p>Pour être sur la liste des inscrits, finalisez le paiement&nbsp;:</p>
<p><a href="${payUrl}" style="display:inline-block;background:#305f33;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700;">Payer / finaliser</a></p>
<p>Remplacez le numéro MoMo par votre vrai numéro (Orange, M-Pesa ou Airtel), confirmez sur votre téléphone, puis recevez votre ticket QR.</p>
<p>Programme : 28–29 août 2026 · Silikin Village<br/><a href="https://mcbuleli.org/hackathon">mcbuleli.org/hackathon</a></p>
<p>Mme Patty B.<br/>McBuleli Team<br/>${SUPPORT_EMAIL}</p>`,
        from: `McBuleli Team <${SUPPORT_EMAIL}>`,
        replyTo: SUPPORT_EMAIL,
      });
      console.log(`✓ emailed ${u.email}`);
    }
  }

  if (!args.send) {
    console.log("\nDry-run only. Re-run with --send to apply + email.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

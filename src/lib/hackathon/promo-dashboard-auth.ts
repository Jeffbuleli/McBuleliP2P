import { createHash, randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getDb, hackathonPromoCodes } from "@/db";
import { getJwtSecret } from "@/lib/env";
import { sendEmail } from "@/lib/email/send";
import { EMAIL_BRAND, logoUrl } from "@/lib/email/config";
import { SUPPORT_EMAIL } from "@/lib/support-contact";
import { getPromoByDashboardToken } from "@/lib/hackathon/promo";
import { getSessionUserId } from "@/lib/session";

const COOKIE = "mcbuleli_promo_dash";
const OTP_TTL_MS = 15 * 60 * 1000;
const SESSION_TTL = "7d";

export function promoDashCookieName() {
  return COOKIE;
}

function hashOtp(code: string): string {
  return createHash("sha256").update(code.trim()).digest("hex");
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "***";
  const head = user.slice(0, 1);
  return `${head}***@${domain}`;
}

export async function signPromoDashSession(args: {
  promoId: string;
  email: string;
}): Promise<string> {
  const secret = new TextEncoder().encode(getJwtSecret());
  return new SignJWT({
    pid: args.promoId,
    email: args.email.toLowerCase(),
    typ: "promo_dash",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(secret);
}

export async function verifyPromoDashSession(
  token: string,
): Promise<{ promoId: string; email: string } | null> {
  try {
    const secret = new TextEncoder().encode(getJwtSecret());
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });
    if (payload.typ !== "promo_dash") return null;
    const promoId = typeof payload.pid === "string" ? payload.pid : "";
    const email = typeof payload.email === "string" ? payload.email : "";
    if (!promoId || !email) return null;
    return { promoId, email: email.toLowerCase() };
  } catch {
    return null;
  }
}

export async function readPromoDashSession(): Promise<{
  promoId: string;
  email: string;
} | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  return verifyPromoDashSession(raw);
}

async function isOwnerSession(
  promo: NonNullable<Awaited<ReturnType<typeof getPromoByDashboardToken>>>,
): Promise<boolean> {
  if (!promo.ownerUserId) return false;
  const userId = await getSessionUserId();
  return Boolean(userId && userId === promo.ownerUserId);
}

export async function requirePromoDashAuth(dashboardToken: string): Promise<
  | { ok: true; promo: NonNullable<Awaited<ReturnType<typeof getPromoByDashboardToken>>>; email: string }
  | { ok: false; error: string; status: number }
> {
  const promo = await getPromoByDashboardToken(dashboardToken);
  if (!promo) return { ok: false, error: "not_found", status: 404 };

  if (await isOwnerSession(promo)) {
    return { ok: true, promo, email: promo.partnerEmail.toLowerCase() };
  }

  const session = await readPromoDashSession();
  if (!session || session.promoId !== promo.id) {
    return { ok: false, error: "auth_required", status: 401 };
  }
  if (session.email !== promo.partnerEmail.toLowerCase()) {
    return { ok: false, error: "email_mismatch", status: 403 };
  }
  return { ok: true, promo, email: session.email };
}

export async function requestPromoDashOtp(dashboardToken: string): Promise<
  | { ok: true; maskedEmail: string }
  | { ok: false; error: string; status: number }
> {
  const promo = await getPromoByDashboardToken(dashboardToken);
  if (!promo || !promo.active) {
    return { ok: false, error: "not_found", status: 404 };
  }

  const code = String(randomInt(100000, 999999));
  const db = getDb();
  await db
    .update(hackathonPromoCodes)
    .set({
      dashboardOtpHash: hashOtp(code),
      dashboardOtpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
      updatedAt: new Date(),
    })
    .where(eq(hackathonPromoCodes.id, promo.id));

  const html = `<!DOCTYPE html><html lang="fr"><body style="font-family:Arial,sans-serif;background:#f3f4f1;padding:24px;">
  <table style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #d6d3d1;padding:24px;">
    <tr><td style="text-align:center;"><img src="${logoUrl()}" width="48" height="48" alt="McBuleli" style="border-radius:12px;" /></td></tr>
    <tr><td style="padding-top:16px;font-size:15px;color:#0c0a09;">Code de vérification dashboard partenaire <strong>${promo.code}</strong></td></tr>
    <tr><td style="padding:18px 0;text-align:center;font-size:28px;font-weight:800;letter-spacing:0.2em;color:${EMAIL_BRAND.primary};">${code}</td></tr>
    <tr><td style="font-size:13px;color:#57534e;">Valable 15 minutes. Seul ${promo.partnerEmail} peut réclamer le cashback.</td></tr>
    <tr><td style="padding-top:16px;font-size:12px;color:#57534e;">${SUPPORT_EMAIL}</td></tr>
  </table></body></html>`;

  const sent = await sendEmail({
    to: promo.partnerEmail,
    subject: `Code dashboard ${promo.code} - McBuleli Hackathon`,
    html,
    text: `Code ${code} pour le dashboard partenaire ${promo.code}. Valable 15 minutes.`,
    from: `McBuleli <${SUPPORT_EMAIL}>`,
    replyTo: SUPPORT_EMAIL,
  });
  if (!sent) return { ok: false, error: "email_failed", status: 502 };

  return { ok: true, maskedEmail: maskEmail(promo.partnerEmail) };
}

export async function verifyPromoDashOtp(args: {
  dashboardToken: string;
  code: string;
}): Promise<
  | { ok: true; sessionToken: string; email: string }
  | { ok: false; error: string; status: number }
> {
  const promo = await getPromoByDashboardToken(args.dashboardToken);
  if (!promo) return { ok: false, error: "not_found", status: 404 };

  if (
    !promo.dashboardOtpHash ||
    !promo.dashboardOtpExpiresAt ||
    promo.dashboardOtpExpiresAt.getTime() < Date.now()
  ) {
    return { ok: false, error: "otp_expired", status: 400 };
  }
  if (hashOtp(args.code) !== promo.dashboardOtpHash) {
    return { ok: false, error: "otp_invalid", status: 400 };
  }

  const db = getDb();
  await db
    .update(hackathonPromoCodes)
    .set({
      dashboardOtpHash: null,
      dashboardOtpExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(hackathonPromoCodes.id, promo.id));

  const sessionToken = await signPromoDashSession({
    promoId: promo.id,
    email: promo.partnerEmail,
  });
  return {
    ok: true,
    sessionToken,
    email: promo.partnerEmail.toLowerCase(),
  };
}

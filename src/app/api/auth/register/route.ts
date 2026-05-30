import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export const maxDuration = 60;
import { getDb, users } from "@/db";
import { findReferrerByCode } from "@/lib/referral-service";
import { friendlyAuthError } from "@/lib/auth-errors";
import { assertEmailAvailable } from "@/lib/auth/email-uniqueness";
import { isSuperAdminEmail, UserRole } from "@/lib/roles";
import { isDisplayNameTaken } from "@/lib/display-name-uniqueness";
import { registerSchema } from "@/lib/validation";
import { sessionCookieName, signSessionToken } from "@/lib/jwt";
import { sendEmailVerification } from "@/lib/auth/email-verification";
import { resolveEmailLocale } from "@/lib/email/locale";
import { getSessionCookieWriteOptions } from "@/lib/session-cookie";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const first =
        Object.values(flat.fieldErrors).flat()[0] ??
        flat.formErrors[0] ??
        "Invalid email or password format.";
      return NextResponse.json(
        { message: first, fieldErrors: flat.fieldErrors },
        { status: 400 },
      );
    }
    const { email, password, referralCode, countryCode, displayName } = parsed.data;
    const db = getDb();

    const emailCheck = await assertEmailAvailable({ rawEmail: email });
    if (!emailCheck.ok) {
      return NextResponse.json(
        {
          message: emailCheck.code,
          ...(emailCheck.suggestedEmail
            ? { suggestedEmail: emailCheck.suggestedEmail }
            : {}),
        },
        { status: 409 },
      );
    }

    let referredByUserId: string | null = null;
    if (referralCode) {
      const ref = await findReferrerByCode(referralCode);
      if (ref) referredByUserId = ref.id;
    }

    if (await isDisplayNameTaken(displayName)) {
      return NextResponse.json({ error: "profile_pseudo_taken" }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const role = isSuperAdminEmail(emailCheck.email)
      ? UserRole.SUPER_ADMIN
      : UserRole.USER;
    const [created] = await db
      .insert(users)
      .values({
        email: emailCheck.email,
        emailCanonical: emailCheck.emailCanonical,
        passwordHash,
        role,
        tradeLiveEnabled: false,
        referredByUserId,
        ...(countryCode ? { countryCode } : {}),
        displayName: displayName.trim(),
      })
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
      });

    const locale = await resolveEmailLocale(req);
    void sendEmailVerification(created.id, created.email, locale).catch((err) => {
      console.warn("[auth/register] verification email failed", err);
    });

    const token = await signSessionToken(created.id, 0);
    const res = NextResponse.json({ user: created, emailVerificationSent: true });
    res.cookies.set(
      sessionCookieName(),
      token,
      getSessionCookieWriteOptions(),
    );
    return res;
  } catch (e) {
    console.error("[auth/register]", e);
    return NextResponse.json(
      { message: friendlyAuthError(e) },
      { status: 500 },
    );
  }
}

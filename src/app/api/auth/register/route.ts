import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export const maxDuration = 60;
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { findReferrerByCode } from "@/lib/referral-service";
import { friendlyAuthError } from "@/lib/auth-errors";
import { isSuperAdminEmail, UserRole } from "@/lib/roles";
import { isDisplayNameTaken } from "@/lib/display-name-uniqueness";
import { registerSchema } from "@/lib/validation";
import { sessionCookieName, signSessionToken } from "@/lib/jwt";
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

    let referredByUserId: string | null = null;
    if (referralCode) {
      const ref = await findReferrerByCode(referralCode);
      if (ref) referredByUserId = ref.id;
    }
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing.length) {
      return NextResponse.json(
        { message: "This email is already registered. Try logging in." },
        { status: 409 },
      );
    }

    if (await isDisplayNameTaken(displayName)) {
      return NextResponse.json({ error: "profile_pseudo_taken" }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const role = isSuperAdminEmail(email)
      ? UserRole.SUPER_ADMIN
      : UserRole.USER;
    const [created] = await db
      .insert(users)
      .values({
        email,
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

    const token = await signSessionToken(created.id);
    const res = NextResponse.json({ user: created });
    res.cookies.set(
      sessionCookieName(),
      token,
      getSessionCookieWriteOptions(60 * 60 * 24 * 30),
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

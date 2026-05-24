import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

/** Cold DB / bcrypt — generous timeout so Neon can wake on first login. */
export const maxDuration = 60;
import { eq, sql } from "drizzle-orm";
import { getDb, users } from "@/db";
import { friendlyAuthError } from "@/lib/auth-errors";
import { isSuperAdminEmail, UserRole } from "@/lib/roles";
import { loginSchema } from "@/lib/validation";
import { sessionCookieName, signSessionToken } from "@/lib/jwt";
import { getSessionCookieWriteOptions } from "@/lib/session-cookie";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const first =
        Object.values(flat.fieldErrors).flat()[0] ??
        flat.formErrors[0] ??
        "Invalid input.";
      return NextResponse.json(
        { message: first, fieldErrors: flat.fieldErrors },
        { status: 400 },
      );
    }
    const { email, password } = parsed.data;
    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = lower(${email})`)
      .limit(1);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 },
      );
    }

    let sessionUser = user;
    if (isSuperAdminEmail(user.email) && user.role !== UserRole.SUPER_ADMIN) {
      const [up] = await db
        .update(users)
        .set({ role: UserRole.SUPER_ADMIN })
        .where(eq(users.id, user.id))
        .returning();
      if (up) sessionUser = up;
    }

    const token = await signSessionToken(
      sessionUser.id,
      sessionUser.sessionVersion ?? 0,
    );
    const res = NextResponse.json({
      user: {
        id: sessionUser.id,
        email: sessionUser.email,
        role: sessionUser.role,
      },
    });
    res.cookies.set(
      sessionCookieName(),
      token,
      getSessionCookieWriteOptions(60 * 60 * 24 * 30),
    );
    reconcileKycAfterLogin(sessionUser.id);
    return res;
  } catch (e) {
    console.error("[auth/login]", e);
    return NextResponse.json(
      { message: friendlyAuthError(e) },
      { status: 500 },
    );
  }
}

async function reconcileKycAfterLogin(userId: string) {
  const { tryRefreshKycIfPending } = await import("@/lib/didit/try-refresh-pending");
  void tryRefreshKycIfPending(userId).catch((err) => {
    console.warn("[auth/login] kyc reconcile", err);
  });
}

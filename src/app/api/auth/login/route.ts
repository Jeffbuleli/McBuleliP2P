import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

/** Cold DB / bcrypt — avoid Vercel default 10s cutting login before Neon wakes. */
export const maxDuration = 60;
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { friendlyAuthError } from "@/lib/auth-errors";
import { isSuperAdminEmail, UserRole } from "@/lib/roles";
import { loginSchema } from "@/lib/validation";
import { sessionCookieName, signSessionToken } from "@/lib/jwt";

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
      .where(eq(users.email, email))
      .limit(1);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 },
      );
    }

    let sessionUser = user;
    if (isSuperAdminEmail(email) && user.role !== UserRole.SUPER_ADMIN) {
      const [up] = await db
        .update(users)
        .set({ role: UserRole.SUPER_ADMIN })
        .where(eq(users.id, user.id))
        .returning();
      if (up) sessionUser = up;
    }

    const token = await signSessionToken(sessionUser.id);
    const res = NextResponse.json({
      user: {
        id: sessionUser.id,
        email: sessionUser.email,
        role: sessionUser.role,
      },
    });
    res.cookies.set(sessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (e) {
    console.error("[auth/login]", e);
    return NextResponse.json(
      { message: friendlyAuthError(e) },
      { status: 500 },
    );
  }
}

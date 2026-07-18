import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

/** Cold DB / bcrypt — generous timeout so Neon can wake on first login. */
export const maxDuration = 60;
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { findUserByAuthEmail } from "@/lib/auth/email-uniqueness";
import { friendlyAuthError } from "@/lib/auth-errors";
import { isSuperAdminEmail, UserRole } from "@/lib/roles";
import { loginSchema } from "@/lib/validation";
import { sessionCookieName, signSessionToken } from "@/lib/jwt";
import { getSessionCookieWriteOptions } from "@/lib/session-cookie";
import { recordLoginEvent } from "@/lib/login-events";
import {
  checkRateLimit,
  rateLimitedResponse,
  rateLimitKeyIp,
} from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";

export async function POST(req: Request) {
  try {
    const ipLimit = checkRateLimit({
      key: rateLimitKeyIp("auth:login", req),
      limit: 5,
      windowMs: 60_000,
    });
    if (!ipLimit.ok) {
      return rateLimitedResponse(ipLimit.retryAfterSec);
    }

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

    const captcha = await verifyTurnstileToken(parsed.data.turnstileToken, req);
    if (!captcha.ok) {
      return NextResponse.json(
        { message: captcha.message },
        { status: captcha.status },
      );
    }

    const { email, password } = parsed.data;
    const db = getDb();
    const user = await findUserByAuthEmail(email);
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
    const { userNeedsEmailVerification } = await import(
      "@/lib/auth/email-verified-gate"
    );
    const emailVerified = !userNeedsEmailVerification({
      email: sessionUser.email,
      emailVerifiedAt: sessionUser.emailVerifiedAt,
    });
    const res = NextResponse.json({
      user: {
        id: sessionUser.id,
        email: sessionUser.email,
        role: sessionUser.role,
        emailVerified,
      },
    });
    res.cookies.set(
      sessionCookieName(),
      token,
      getSessionCookieWriteOptions(),
    );
    reconcileKycAfterLogin(sessionUser.id);
    reconcileRewardPointsAfterLogin(sessionUser.id);
    reconcileAcademyAfterLogin(sessionUser.id, sessionUser.email);
    void recordLoginEvent({ userId: sessionUser.id, method: "password", req }).catch(
      (err) => console.warn("[auth/login] login event", err),
    );
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
  const { restoreApprovedKycFromHistory } = await import(
    "@/lib/kyc-restore-from-history"
  );
  void restoreApprovedKycFromHistory(userId).catch((err) => {
    console.warn("[auth/login] kyc restore", err);
  });
  const { tryRefreshKycIfPending } = await import("@/lib/didit/try-refresh-pending");
  void tryRefreshKycIfPending(userId).catch((err) => {
    console.warn("[auth/login] kyc reconcile", err);
  });
}

async function reconcileRewardPointsAfterLogin(userId: string) {
  const { reconcileUserRewardPoints } = await import("@/lib/reward-points-service");
  void reconcileUserRewardPoints(userId).catch((err) => {
    console.warn("[auth/login] reward points reconcile", err);
  });
}

async function reconcileAcademyAfterLogin(userId: string, email: string) {
  const { linkTrainingRegistrationToUser, autoEnrollLaunchCohort } = await import(
    "@/lib/academy-service"
  );
  void linkTrainingRegistrationToUser({ userId, email })
    .then(() => autoEnrollLaunchCohort(userId))
    .catch((err) => {
      console.warn("[auth/login] academy reconcile", err);
    });
  void import("@/lib/hackathon/ensure-user").then(({ linkHackathonRegistrationToUser }) =>
    linkHackathonRegistrationToUser({ userId, email }).catch((err) => {
      console.warn("[auth/login] hackathon reconcile", err);
    }),
  );
}

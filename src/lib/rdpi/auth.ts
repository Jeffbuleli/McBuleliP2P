import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { userNeedsEmailVerification } from "@/lib/auth/email-verified-gate";
import { getSessionUser, type SessionUser } from "@/lib/session-user";

/** Any verified McBuleli account on this org domain can view survey responses. */
export const RDPI_EMAIL_DOMAIN = "rdpithinktank.org";

export function isRdpiOrgEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith(`@${RDPI_EMAIL_DOMAIN}`);
}

export type RdpiDashboardAccess =
  | { ok: true; user: SessionUser; via: "admin" | "partner" }
  | {
      ok: false;
      reason: "unauthenticated" | "forbidden" | "unverified";
    };

export async function resolveRdpiDashboardAccess(): Promise<RdpiDashboardAccess> {
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "unauthenticated" };
  if (user.role === "super_admin") {
    return { ok: true, user, via: "admin" };
  }
  if (!isRdpiOrgEmail(user.email)) {
    return { ok: false, reason: "forbidden" };
  }

  const db = getDb();
  const [row] = await db
    .select({ emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (
    userNeedsEmailVerification({
      email: user.email,
      emailVerifiedAt: row?.emailVerifiedAt,
    })
  ) {
    return { ok: false, reason: "unverified" };
  }

  return { ok: true, user, via: "partner" };
}

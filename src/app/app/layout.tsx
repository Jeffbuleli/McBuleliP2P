import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/mobile/app-shell";
import { getDb, users } from "@/db";
import {
  userNeedsEmailVerification,
  VERIFY_EMAIL_PENDING_PATH,
} from "@/lib/auth/email-verified-gate";
import { getSessionUserId } from "@/lib/session";
import { safeAppRedirectPath } from "@/lib/safe-app-path";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getSessionUserId();
  if (!userId) {
    const h = await headers();
    const next = safeAppRedirectPath(h.get("x-pathname"));
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const db = getDb();
  const [u] = await db
    .select({
      email: users.email,
      avatarUrl: users.avatarUrl,
      role: users.role,
      emailVerifiedAt: users.emailVerifiedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (
    u &&
    userNeedsEmailVerification({
      email: u.email,
      emailVerifiedAt: u.emailVerifiedAt,
    })
  ) {
    redirect(VERIFY_EMAIL_PENDING_PATH);
  }

  return (
    <AppShell
      email={u?.email ?? ""}
      avatarUrl={u?.avatarUrl ?? null}
      isSupportStaff={u?.role === "agent" || u?.role === "super_admin"}
    >
      {children}
    </AppShell>
  );
}

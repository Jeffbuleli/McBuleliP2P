import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/mobile/app-shell";
import { getDb, users } from "@/db";
import { getSessionUserId } from "@/lib/session";
import { safeAppRedirectPath } from "@/lib/safe-app-path";

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
    .select({ email: users.email, avatarUrl: users.avatarUrl, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

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

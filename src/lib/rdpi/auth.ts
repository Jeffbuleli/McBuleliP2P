import { getSessionUser, type SessionUser } from "@/lib/session-user";

/** Partner emails allowed to view RDPI survey dashboard (plus super_admin). */
export const RDPI_DASHBOARD_EMAILS = [
  "maristote@rdpithinktank.org",
  "info@rdpithinktank.org",
] as const;

export function isRdpiDashboardEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const n = email.trim().toLowerCase();
  return (RDPI_DASHBOARD_EMAILS as readonly string[]).includes(n);
}

export type RdpiDashboardAccess =
  | { ok: true; user: SessionUser; via: "admin" | "partner" }
  | { ok: false; reason: "unauthenticated" | "forbidden" };

export async function resolveRdpiDashboardAccess(): Promise<RdpiDashboardAccess> {
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "unauthenticated" };
  if (user.role === "super_admin") {
    return { ok: true, user, via: "admin" };
  }
  if (isRdpiDashboardEmail(user.email)) {
    return { ok: true, user, via: "partner" };
  }
  return { ok: false, reason: "forbidden" };
}

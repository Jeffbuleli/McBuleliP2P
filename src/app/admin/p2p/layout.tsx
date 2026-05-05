import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";
import { agentHasScope } from "@/lib/staff-scopes";

export default async function AdminP2pLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await getSessionUser();
  if (!u) {
    redirect("/login");
  }
  if (u.role !== UserRole.AGENT && u.role !== UserRole.SUPER_ADMIN) {
    redirect("/app");
  }
  if (!agentHasScope(u, "p2p_disputes")) {
    redirect("/admin");
  }
  return <>{children}</>;
}

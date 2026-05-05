import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";
import { agentHasScope } from "@/lib/staff-scopes";

export default async function AdminGroupsLayout({
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
  if (!agentHasScope(u, "groups")) {
    redirect("/admin");
  }
  return <>{children}</>;
}

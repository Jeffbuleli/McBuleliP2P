import { redirect } from "next/navigation";
import { HackathonAdminClient } from "@/components/admin/hackathon-admin-client";
import { UserRole } from "@/lib/roles";
import { getSessionUser } from "@/lib/session-user";
import { agentHasScope } from "@/lib/staff-scopes";

export default async function AdminHackathonPage() {
  const u = await getSessionUser();
  if (!u) redirect("/login");
  const canStats =
    u.role === UserRole.SUPER_ADMIN || agentHasScope(u, "hackathon_stats");
  const canAdmin = u.role === UserRole.SUPER_ADMIN;
  if (!canStats && !canAdmin) {
    if (agentHasScope(u, "hackathon_scan")) {
      redirect("/admin/hackathon/scan");
    }
    redirect("/admin");
  }
  return (
    <HackathonAdminClient
      mode={canAdmin ? "admin" : "stats"}
    />
  );
}

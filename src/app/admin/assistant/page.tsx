import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";
import { AdminAssistantPanel } from "@/components/admin/admin-assistant-panel";

export default async function AdminAssistantPage() {
  const u = await getSessionUser();
  if (!u || u.role !== UserRole.SUPER_ADMIN) {
    redirect("/admin");
  }
  return <AdminAssistantPanel />;
}

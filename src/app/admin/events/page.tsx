import { redirect } from "next/navigation";
import { AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";
import { EventsAdminDashboard } from "@/components/admin/events-admin-dashboard";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const me = await getSessionUser();
  if (!me || me.role !== UserRole.SUPER_ADMIN) redirect("/admin");

  return (
    <div>
      <AdminBackLink href="/admin">Admin</AdminBackLink>
      <AdminPageHeader title="Events & Trainings" />
      <EventsAdminDashboard />
    </div>
  );
}

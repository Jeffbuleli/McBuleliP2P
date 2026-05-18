import { redirect } from "next/navigation";
import { ProfileOpsHub } from "@/components/profile/profile-ops-hub";
import { ProfileSubpageHeader } from "@/components/profile/profile-subpage-header";
import { getAdminDashboardStats } from "@/lib/admin-dashboard-stats";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import {
  buildProfileOpsHubItems,
  opsHubTotalPending,
} from "@/lib/profile-ops-items";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export default async function ProfileOpsPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const user = await getSessionUser();
  const staff = user?.role === "agent" || user?.role === "super_admin";
  if (!staff || !user) redirect("/app/profile");

  const stats = await getAdminDashboardStats();
  const items = buildProfileOpsHubItems(user, stats);
  const totalPending = opsHubTotalPending(items);

  return (
    <>
      <ProfileSubpageHeader title={d.ops} subtitle={d.profile_ops_sub} />
      <ProfileOpsHub items={items} totalPending={totalPending} />
    </>
  );
}

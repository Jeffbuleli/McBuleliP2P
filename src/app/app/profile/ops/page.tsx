import { redirect } from "next/navigation";
import { ProfileOpsHub } from "@/components/profile/profile-ops-hub";
import { ProfileSubpageHeader } from "@/components/profile/profile-subpage-header";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export default async function ProfileOpsPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const user = await getSessionUser();
  const staff = user?.role === "agent" || user?.role === "super_admin";
  if (!staff) redirect("/app/profile");

  return (
    <>
      <ProfileSubpageHeader title={d.ops} subtitle={d.profile_ops_sub} />
      <ProfileOpsHub />
    </>
  );
}

import { redirect } from "next/navigation";
import { HomeHubView } from "@/components/mobile/home-hub/home-hub-view";
import type { AcademyViewerRole } from "@/lib/academy-service";
import { getLocale } from "@/lib/get-locale";
import { loadHomeHubData } from "@/lib/home-hub-data";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=%2Fapp");
  }

  const locale = await getLocale();
  const viewerRole: AcademyViewerRole =
    user.role === "agent" || user.role === "super_admin" ? "staff" : "learner";

  const data = await loadHomeHubData({
    userId: user.id,
    locale,
    viewerRole,
  });

  return <HomeHubView data={data} locale={locale} />;
}

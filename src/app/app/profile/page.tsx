import { AcademyJourneyTeaser } from "@/components/profile/academy-journey-teaser";
import { ProfileHero } from "@/components/profile/profile-hero";
import { ProfileScreenHeader } from "@/components/profile/profile-screen-header";
import { ProfileSecurityMeter } from "@/components/profile/profile-security-meter";
import { ProfileSettingsList } from "@/components/profile/profile-settings-list";
import { ProfileStatsRow } from "@/components/profile/profile-stats-row";
import { ProfileWalletStrip } from "@/components/profile/profile-wallet-strip";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { getProfileDashboard } from "@/lib/profile-stats";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const sessionUser = await getSessionUser();
  const dash = sessionUser
    ? await getProfileDashboard(sessionUser.id, locale)
    : null;

  const staff =
    sessionUser?.role === "agent" || sessionUser?.role === "super_admin";

  const memberSince = dash?.createdAt
    ? new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
        month: "short",
        year: "numeric",
      }).format(dash.createdAt)
    : "—";

  if (!dash) {
    return (
      <p className="py-8 text-center text-sm text-[var(--fd-muted)]">—</p>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <ProfileScreenHeader title={d.profile_title} />
      <ProfileHero dash={dash} locale={locale} />
      <ProfileWalletStrip portfolio={dash.portfolio} locale={locale} />
      <ProfileSecurityMeter />
      <ProfileStatsRow dash={dash} locale={locale} memberSince={memberSince} />
      <AcademyJourneyTeaser />
      <ProfileSettingsList
        showAdmin={staff}
        meta={{
          userId: dash.id,
          kycStatus: dash.kycStatus,
          referralBalanceUsdt: dash.referralBalanceUsdt,
          paymentMethodsCount: dash.paymentMethodsCount,
          communityHandle: dash.communityHandle,
          piLinked: dash.piLinked,
        }}
      />
    </div>
  );
}

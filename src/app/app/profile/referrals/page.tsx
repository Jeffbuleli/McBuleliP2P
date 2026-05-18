import { ProfileReferralsView } from "@/components/profile/profile-referrals-view";
import { ProfileSubpageHeader } from "@/components/profile/profile-subpage-header";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { getReferralSnapshot } from "@/lib/referral-service";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export default async function ProfileReferralsPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const sessionUser = await getSessionUser();
  const referral = sessionUser
    ? await getReferralSnapshot(sessionUser.id).catch(() => null)
    : null;

  const origin =
    typeof process.env.NEXT_PUBLIC_APP_URL === "string"
      ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
      : "";
  const inviteLinkFull = referral
    ? origin
      ? `${origin}${referral.linkPath}`
      : referral.linkPath
    : "";

  return (
    <>
      <ProfileSubpageHeader
        title={d.profile_referral_title}
        subtitle={d.profile_tile_invite_sub}
      />
      {referral ? (
        <ProfileReferralsView
          referral={{
            code: referral.code,
            linkPath: referral.linkPath,
            inviteLinkFull,
            referralBalanceUsdt: referral.referralBalanceUsdt,
            inviteCount: referral.inviteCount,
            totalEarnedUsdt: referral.totalEarnedUsdt,
          }}
          locale={locale}
          labels={{
            balance: d.profile_referral_balance,
            invited: d.profile_referral_invited,
            earned: d.profile_referral_earned,
            code: d.profile_referral_code,
            link: d.profile_referral_link,
            note: d.profile_referral_note_short,
            copy: d.profile_id_copy,
            copied: d.profile_id_copied,
            shareHint: d.profile_referral_share_hint,
          }}
        />
      ) : (
        <p className="text-sm text-[var(--fd-muted)]">—</p>
      )}
    </>
  );
}

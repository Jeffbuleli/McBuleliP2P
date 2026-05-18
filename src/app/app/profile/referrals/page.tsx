import { CopyValueButton } from "@/components/profile/profile-id-copy";
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
        <div className="space-y-3">
          <div className="fd-card grid grid-cols-2 gap-px overflow-hidden p-0">
            <div className="bg-white p-4 text-center">
              <p className="text-[10px] font-semibold uppercase text-[var(--fd-muted)]">
                {d.profile_referral_balance}
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-[var(--fd-primary)]">
                {referral.referralBalanceUsdt.toLocaleString(
                  locale === "fr" ? "fr-FR" : "en-US",
                  { maximumFractionDigits: 2 },
                )}{" "}
                USDT
              </p>
            </div>
            <div className="bg-white p-4 text-center">
              <p className="text-[10px] font-semibold uppercase text-[var(--fd-muted)]">
                {d.profile_referral_invited}
              </p>
              <p className="mt-1 text-lg font-bold">{referral.inviteCount}</p>
            </div>
          </div>

          <div className="fd-card flex items-center justify-between gap-2 p-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase text-[var(--fd-muted)]">
                {d.profile_referral_code}
              </p>
              <p className="truncate font-mono text-sm font-bold text-[var(--fd-primary)]">
                {referral.code}
              </p>
            </div>
            <CopyValueButton
              value={referral.code}
              copyLabel={d.profile_id_copy}
              copiedLabel={d.profile_id_copied}
              variant="light"
            />
          </div>

          <div className="fd-card flex items-center justify-between gap-2 p-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase text-[var(--fd-muted)]">
                {d.profile_referral_link}
              </p>
              <p className="truncate text-[11px] text-[var(--fd-muted)]" title={inviteLinkFull}>
                {inviteLinkFull || referral.linkPath}
              </p>
            </div>
            <CopyValueButton
              value={inviteLinkFull || referral.linkPath}
              copyLabel={d.profile_id_copy}
              copiedLabel={d.profile_id_copied}
              variant="light"
            />
          </div>

          <p className="text-[11px] leading-relaxed text-[var(--fd-muted)]">
            {d.profile_referral_note_short}
          </p>
        </div>
      ) : (
        <p className="text-sm text-[var(--fd-muted)]">—</p>
      )}
    </>
  );
}

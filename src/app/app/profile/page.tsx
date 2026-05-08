import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { LangSwitch } from "@/components/lang-switch";
import { CopyValueButton, ProfileIdCopy } from "@/components/profile/profile-id-copy";
import { ProfileAvatarEditor } from "@/components/profile/profile-avatar-editor";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { countryLabel } from "@/lib/country-label";
import { getReferralSnapshot } from "@/lib/referral-service";
import { getProfileDashboard } from "@/lib/profile-stats";
import { getSessionUser } from "@/lib/session-user";
import { PiAdsSection } from "@/components/pi/pi-ads";
import { P2pPaymentMethodsSection } from "@/components/p2p/p2p-payment-methods-section";
import { PiLinkSection } from "@/components/pi/pi-link-section";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const sessionUser = await getSessionUser();
  const dash = sessionUser
    ? await getProfileDashboard(sessionUser.id, locale)
    : null;

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

  const staff =
    sessionUser?.role === "agent" || sessionUser?.role === "super_admin";

  const memberSince = dash?.createdAt
    ? new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
        month: "short",
        year: "numeric",
      }).format(dash.createdAt)
    : "—";

  return (
    <div className="flex flex-col gap-5 pb-6">
      <section className="rounded-2xl border border-stone-700/50 bg-gradient-to-br from-stone-900 to-stone-950 p-5 shadow-lg shadow-black/25">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {dash ? (
            <ProfileAvatarEditor
              email={dash.email}
              initialAvatarUrl={dash.avatarUrl}
            />
          ) : null}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              {d.profile_header_member}
            </p>
            <h1 className="mt-1 truncate text-xl font-bold text-stone-50">
              {dash?.email ?? "—"}
            </h1>
            <p className="mt-1 text-sm text-stone-400">
              {dash?.countryCode
                ? countryLabel(locale, dash.countryCode)
                : d.profile_header_country_val}
            </p>
            {dash ? (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <div className="flex min-w-0 max-w-full items-center gap-2 rounded-lg border border-stone-600/80 bg-stone-950/50 px-2 py-1 font-mono text-[10px] text-stone-300">
                  <span className="truncate" title={dash.id}>
                    {d.profile_id_label}: {dash.id}
                  </span>
                  <ProfileIdCopy
                    id={dash.id}
                    copyLabel={d.profile_id_copy}
                    copiedLabel={d.profile_id_copied}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-700/50 bg-stone-900/40 p-4">
        <h2 className="text-sm font-bold text-stone-200">{d.profile_stats_heading}</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-stone-950/50 p-3">
            <dt className="text-[10px] font-medium uppercase text-stone-500">
              {d.profile_stat_trades}
            </dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-stone-100">
              {dash?.totalCompletedTrades ?? 0}
            </dd>
          </div>
          <div className="rounded-xl bg-stone-950/50 p-3">
            <dt className="text-[10px] font-medium uppercase text-stone-500">
              {d.profile_stat_completion}
            </dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-stone-100">
              {dash?.completionPct != null ? `${dash.completionPct}%` : "—"}
            </dd>
          </div>
          <div className="rounded-xl bg-stone-950/50 p-3">
            <dt className="text-[10px] font-medium uppercase text-stone-500">
              {d.profile_stat_reputation}
            </dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-amber-300/90">
              {dash && dash.reputationScore > 0
                ? `${dash.reputationScore.toFixed(1)} / 5`
                : "—"}
            </dd>
          </div>
          <div className="rounded-xl bg-stone-950/50 p-3">
            <dt className="text-[10px] font-medium uppercase text-stone-500">
              {d.profile_stat_age}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-stone-200">{memberSince}</dd>
          </div>
        </dl>
      </section>

      {referral ? (
        <section className="rounded-2xl border border-emerald-900/25 bg-gradient-to-br from-emerald-950/40 to-stone-900/40 p-4">
          <h2 className="text-sm font-bold text-emerald-100/95">{d.profile_referral_title}</h2>
          <p className="mt-2 text-xs leading-relaxed text-stone-400">{d.profile_referral_sub}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-stone-950/60 p-3">
              <dt className="text-[10px] font-medium uppercase text-stone-500">
                {d.profile_referral_balance}
              </dt>
              <dd className="mt-1 font-mono text-lg font-bold tabular-nums text-emerald-300">
                {referral.referralBalanceUsdt.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
                  maximumFractionDigits: 2,
                })}{" "}
                USDT
              </dd>
            </div>
            <div className="rounded-xl bg-stone-950/60 p-3">
              <dt className="text-[10px] font-medium uppercase text-stone-500">
                {d.profile_referral_invited}
              </dt>
              <dd className="mt-1 text-lg font-bold tabular-nums text-stone-100">
                {referral.inviteCount}
              </dd>
            </div>
            <div className="col-span-2 rounded-xl bg-stone-950/60 p-3">
              <dt className="text-[10px] font-medium uppercase text-stone-500">
                {d.profile_referral_earned}
              </dt>
              <dd className="mt-1 font-mono text-lg font-bold tabular-nums text-stone-100">
                {referral.totalEarnedUsdt.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
                  maximumFractionDigits: 2,
                })}
              </dd>
            </div>
          </dl>
          <div className="mt-4 space-y-2">
            <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-stone-700 bg-stone-950/50 px-3 py-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase text-stone-500">
                  {d.profile_referral_code}
                </p>
                <p className="truncate font-mono text-sm font-bold text-emerald-200">{referral.code}</p>
              </div>
              <CopyValueButton
                value={referral.code}
                copyLabel={d.profile_id_copy}
                copiedLabel={d.profile_id_copied}
              />
            </div>
            <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-stone-700 bg-stone-950/50 px-3 py-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase text-stone-500">
                  {d.profile_referral_link}
                </p>
                <p className="truncate text-[11px] text-stone-300" title={inviteLinkFull}>
                  {inviteLinkFull || referral.linkPath}
                </p>
              </div>
              <CopyValueButton
                value={inviteLinkFull || referral.linkPath}
                copyLabel={d.profile_id_copy}
                copiedLabel={d.profile_id_copied}
              />
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-stone-500">{d.profile_referral_note}</p>
          {!origin ? (
            <p className="mt-2 text-[10px] text-amber-200/80">{d.profile_referral_url_env_hint}</p>
          ) : null}
        </section>
      ) : null}

      <Link
        href="/app/wallet"
        className="flex min-h-[52px] items-center justify-center rounded-2xl border border-emerald-800/35 bg-emerald-950/25 py-3.5 text-base font-semibold text-emerald-100 active:scale-[0.99]"
      >
        {d.wallet_see_all}
      </Link>

      <section className="rounded-2xl border border-stone-700/50 bg-stone-900/40 p-4">
        <h2 className="text-sm font-bold text-stone-200">{d.profile_security_heading}</h2>
        <ul className="mt-3 space-y-2 text-sm text-stone-300">
          <li className="flex justify-between gap-2">
            <span>{d.profile_sec_email}</span>
            <span className="text-emerald-400/90">{d.profile_sec_email_ok}</span>
          </li>
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-stone-500">{d.profile_secure_cta}</p>
      </section>

      <P2pPaymentMethodsSection />

      <PiAdsSection />

      <PiLinkSection />

      <section className="rounded-2xl border border-stone-700/50 bg-stone-900/40 p-4">
        <h2 className="text-sm font-bold text-stone-200">{d.profile_settings_heading}</h2>
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-stone-400">{d.profile_lang}</p>
          <LangSwitch />
        </div>
      </section>

      {staff ? (
        <Link
          href="/admin"
          className="flex min-h-[52px] items-center justify-center rounded-2xl border border-amber-600/40 bg-amber-950/40 py-3 text-lg font-semibold text-amber-100 active:scale-[0.99]"
        >
          {d.ops}
        </Link>
      ) : null}

      <LogoutButton className="min-h-[52px] w-full rounded-2xl border border-rose-900/35 bg-stone-950 py-3.5 text-lg font-semibold text-rose-200 disabled:opacity-60" />
    </div>
  );
}

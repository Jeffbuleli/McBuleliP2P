import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { LangSwitch } from "@/components/lang-switch";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { getProfileDashboard } from "@/lib/profile-stats";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

function initialFromEmail(email: string) {
  const c = email.trim().charAt(0).toUpperCase();
  return /[A-Z0-9]/.test(c) ? c : "?";
}

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

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl border border-stone-700/50 bg-gradient-to-br from-stone-900 to-stone-950 p-5 shadow-lg shadow-black/25">
        <div className="flex items-start gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl font-bold text-emerald-400 ring-2 ring-emerald-500/20"
            aria-hidden
          >
            {dash ? initialFromEmail(dash.email) : "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              {d.profile_header_member}
            </p>
            <h1 className="truncate text-xl font-bold text-stone-50">
              {dash?.email ?? "—"}
            </h1>
            <p className="mt-1 text-sm text-stone-400">
              {d.profile_header_country}: {d.profile_header_country_val}
            </p>
            <span className="mt-2 inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-200/90">
              {d.profile_kyc_pending}
            </span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="rounded-2xl border border-stone-700/50 bg-stone-900/40 p-4">
        <h2 className="text-sm font-bold text-stone-200">
          {d.profile_stats_heading}
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-2">
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
                ? `${dash.reputationScore.toFixed(1)} ★`
                : "—"}
            </dd>
          </div>
          <div className="rounded-xl bg-stone-950/50 p-3">
            <dt className="text-[10px] font-medium uppercase text-stone-500">
              {d.profile_stat_age}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-stone-200">
              {memberSince}
            </dd>
          </div>
        </dl>
      </section>

      {/* Wallet */}
      {dash?.portfolio ? (
        <section className="rounded-2xl border border-emerald-900/30 bg-stone-900/40 p-4">
          <h2 className="text-sm font-bold text-emerald-100/90">
            {d.profile_wallet_heading}
          </h2>
          <p className="mt-2 text-2xl font-bold tabular-nums text-stone-50">
            {dash.portfolio.totalEquivDisplay}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-stone-400">
            <li className="flex justify-between gap-2">
              <span>USDT</span>
              <span className="font-mono text-stone-200">
                {dash.portfolio.usdtDisplay}
              </span>
            </li>
            <li className="flex justify-between gap-2">
              <span>Pi</span>
              <span className="font-mono text-stone-200">
                {dash.portfolio.piDisplay}
              </span>
            </li>
          </ul>
          <Link
            href="/app/wallet"
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-emerald-700/40 bg-emerald-950/30 text-sm font-semibold text-emerald-300 active:scale-[0.99]"
          >
            {d.wallet_see_all}
          </Link>
        </section>
      ) : null}

      {/* Security */}
      <section className="rounded-2xl border border-stone-700/50 bg-stone-900/40 p-4">
        <h2 className="text-sm font-bold text-stone-200">
          {d.profile_security_heading}
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex justify-between gap-2 text-stone-300">
            <span>{d.profile_sec_email}</span>
            <span className="text-emerald-400/90">{d.profile_sec_email_ok}</span>
          </li>
          <li className="flex justify-between gap-2 text-stone-300">
            <span>{d.profile_sec_phone}</span>
            <span className="text-stone-500">{d.profile_sec_phone_na}</span>
          </li>
          <li className="flex justify-between gap-2 text-stone-300">
            <span>{d.profile_sec_2fa}</span>
            <span className="text-stone-500">{d.profile_sec_2fa_na}</span>
          </li>
        </ul>
        <p className="mt-3 rounded-xl bg-stone-950/60 px-3 py-2 text-xs text-stone-400">
          {d.profile_secure_cta}
        </p>
      </section>

      {/* Payment methods (placeholder) */}
      <section className="rounded-2xl border border-stone-700/50 bg-stone-900/40 p-4">
        <h2 className="text-sm font-bold text-stone-200">
          {d.profile_payments_heading}
        </h2>
        <p className="mt-2 text-sm text-stone-500">{d.profile_payments_sub}</p>
      </section>

      {/* Settings */}
      <section className="rounded-2xl border border-stone-700/50 bg-stone-900/40 p-4">
        <h2 className="text-sm font-bold text-stone-200">
          {d.profile_settings_heading}
        </h2>
        <p className="mt-2 text-sm text-stone-400">{d.profile_link_password}</p>
        <div className="mt-4 rounded-xl border border-stone-700 bg-stone-950/40 p-3">
          <p className="text-xs font-medium text-stone-300">{d.profile_theme}</p>
          <p className="mt-1 text-xs text-stone-500">{d.profile_theme_fixed}</p>
        </div>
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-stone-400">
            {d.profile_lang}
          </p>
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

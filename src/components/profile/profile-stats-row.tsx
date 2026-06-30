import type { Locale } from "@/i18n/locale";
import { ProfileIconStar } from "@/components/icons/profile-icons";
import { getDictionary } from "@/i18n/messages";
import type { ProfileDashboard } from "@/lib/profile-stats";

export function ProfileStatsRow({
  dash,
  locale,
  memberSince,
}: {
  dash: ProfileDashboard;
  locale: Locale;
  memberSince: string;
}) {
  const d = getDictionary(locale);

  const items = [
    {
      label: d.profile_stat_trades_short,
      value: String(dash.totalCompletedTrades),
    },
    {
      label: d.profile_stat_reputation_short,
      value:
        dash.reputationScore > 0 ? (
          <span className="inline-flex items-center justify-center gap-0.5">
            {dash.reputationScore.toFixed(1)}
            <ProfileIconStar className="h-3.5 w-3.5 text-amber-500" />
          </span>
        ) : (
          "—"
        ),
    },
    {
      label: d.profile_stat_completion_short,
      value: dash.completionPct != null ? `${dash.completionPct}%` : "—",
    },
    {
      label: d.profile_stat_age_short,
      value: memberSince,
    },
  ];

  return (
    <section className="fd-stat-bar grid grid-cols-4 divide-x divide-[rgba(74,103,79,0.12)]">
      {items.map((item) => (
        <div key={item.label} className="px-2 py-3 text-center">
          <p className="text-[9px] font-bold uppercase leading-tight tracking-wide text-[var(--fd-muted)]">
            {item.label}
          </p>
          <div className="mt-1 flex justify-center text-sm font-bold tabular-nums tracking-tight text-[#1c1917]">
            {item.value}
          </div>
        </div>
      ))}
    </section>
  );
}

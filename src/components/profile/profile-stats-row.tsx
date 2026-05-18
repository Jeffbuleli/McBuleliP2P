import type { Locale } from "@/i18n/locale";
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
        dash.reputationScore > 0
          ? `${dash.reputationScore.toFixed(1)}★`
          : "—",
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
    <section className="fd-card grid grid-cols-4 divide-x divide-[var(--fd-border)] p-0 overflow-hidden">
      {items.map((item) => (
        <div key={item.label} className="px-2 py-3 text-center">
          <p className="text-[9px] font-semibold uppercase leading-tight text-[var(--fd-muted)]">
            {item.label}
          </p>
          <p className="mt-1 text-sm font-bold tabular-nums text-[var(--fd-text)]">
            {item.value}
          </p>
        </div>
      ))}
    </section>
  );
}

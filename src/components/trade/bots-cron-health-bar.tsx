"use client";

import type { Messages } from "@/i18n/messages";

export type CronHealthSnapshot = {
  configured: boolean;
  inlineEnabled: boolean;
  intervalMinutes: number;
  recommendedIntervalMinutes?: number;
  cronNeedsFasterTick?: boolean;
  lastRunAt: string | null;
  lastRunExecuted: number | null;
  lastRunInstances: number | null;
  stale: boolean;
  minutesSinceLastRun?: number | null;
  staleAfterMinutes?: number;
};

function formatCronTime(iso: string, locale?: string) {
  return new Date(iso).toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BotsCronHealthBar({
  health,
  t,
}: {
  health: CronHealthSnapshot;
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string;
}) {
  if (!health.configured) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-900">
        {t("bots_cron_not_configured")}
      </p>
    );
  }

  const timeLabel = health.lastRunAt ? formatCronTime(health.lastRunAt) : null;
  let status: string;
  let warn = false;

  if (!health.lastRunAt) {
    status = t("bots_cron_health_never", { minutes: String(health.intervalMinutes) });
    warn = true;
  } else if (health.stale) {
    const ago =
      health.minutesSinceLastRun != null
        ? String(health.minutesSinceLastRun)
        : "?";
    status = t("bots_cron_health_stale", { time: timeLabel!, ago });
    warn = true;
  } else {
    status = t("bots_cron_health_ok", {
      time: timeLabel!,
      executed: String(health.lastRunExecuted ?? 0),
      instances: String(health.lastRunInstances ?? 0),
    });
  }

  return (
    <div className="space-y-2">
      <p
        className={`flex flex-wrap items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-medium ${
          warn
            ? "border border-amber-200 bg-amber-50 text-amber-900"
            : "border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/50 text-[color:var(--fd-primary)]"
        }`}
      >
        <span className="font-bold uppercase tracking-wide">{t("bots_cron_label")}</span>
        <span className="min-w-0 flex-1">{status}</span>
        {health.inlineEnabled ? (
          <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-bold uppercase">
            {t("bots_cron_inline_badge")}
          </span>
        ) : null}
      </p>
    </div>
  );
}

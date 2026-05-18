"use client";

import type { Messages } from "@/i18n/messages";
import { UiInfoTip } from "@/components/ui/ui-info-tip";

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
  isSuperAdmin = false,
  t,
}: {
  health: CronHealthSnapshot;
  isSuperAdmin?: boolean;
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string;
}) {
  const tip = t("bots_cron_health_tip");

  if (!health.configured) {
    return (
      <div
        className="flex items-center gap-2 rounded-lg border border-amber-400/70 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-100"
        role="status"
      >
        <span className="text-[10px] font-bold uppercase tracking-wide text-amber-800/80 dark:text-amber-200/80">
          {t("bots_cron_label")}
        </span>
        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
        <span className="min-w-0 truncate">{t("bots_cron_not_configured")}</span>
        <UiInfoTip tip={tip} variant="warn" />
      </div>
    );
  }

  const timeLabel = health.lastRunAt
    ? formatCronTime(health.lastRunAt)
    : null;

  let status: string;
  let tone: "ok" | "warn" = "ok";

  if (!health.lastRunAt) {
    status = t("bots_cron_health_never", {
      minutes: String(health.intervalMinutes),
    });
    tone = "warn";
  } else if (health.stale) {
    status = t("bots_cron_health_stale", { time: timeLabel! });
    tone = "warn";
  } else {
    status = t("bots_cron_health_ok", {
      time: timeLabel!,
      executed: String(health.lastRunExecuted ?? 0),
      instances: String(health.lastRunInstances ?? 0),
    });
  }

  const border =
    tone === "ok"
      ? "border-emerald-400/50 bg-emerald-50/70 dark:border-emerald-700/40 dark:bg-emerald-950/25"
      : "border-amber-400/60 bg-amber-50/70 dark:border-amber-700/45 dark:bg-amber-950/30";

  const needsFaster =
    health.cronNeedsFasterTick &&
    health.recommendedIntervalMinutes != null &&
    health.intervalMinutes > health.recommendedIntervalMinutes;

  return (
    <div className="space-y-1.5">
      <div
        className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${border}`}
        role="status"
      >
        <span className="text-[10px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          {t("bots_cron_label")}
        </span>
        <span
          className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
            tone === "ok" ? "bg-emerald-500" : "bg-amber-500"
          }`}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-stone-800 dark:text-stone-100">
          {status}
        </span>
        {health.inlineEnabled ? (
          <span className="shrink-0 rounded bg-stone-800/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-stone-500 dark:bg-white/10 dark:text-stone-400">
            {t("bots_cron_inline_badge")}
          </span>
        ) : null}
        <UiInfoTip tip={tip} />
      </div>
      {needsFaster && isSuperAdmin ? (
        <div
          className="flex items-center gap-2 rounded-lg border border-sky-400/60 bg-sky-50/80 px-2.5 py-1.5 text-xs font-medium text-sky-950 dark:border-sky-700/50 dark:bg-sky-950/35 dark:text-sky-100"
          role="status"
        >
          <span className="min-w-0 flex-1">
            {t("bots_cron_scalp_fast_tick", {
              current: String(health.intervalMinutes),
              recommended: String(health.recommendedIntervalMinutes),
            })}
          </span>
          <UiInfoTip tip={t("bots_cron_scalp_fast_tick_tip")} />
        </div>
      ) : null}
    </div>
  );
}

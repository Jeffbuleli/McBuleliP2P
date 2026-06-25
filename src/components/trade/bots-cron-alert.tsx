"use client";

import type { Messages } from "@/i18n/messages";
import type { CronHealthSnapshot } from "@/components/trade/bots-cron-health-bar";
import { IconCron } from "@/components/trade/bot-visual-icons";

export function BotsCronAlert({
  health,
  t,
}: {
  health: CronHealthSnapshot | undefined;
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string;
}) {
  if (!health) return null;

  const blocked = !health.configured || !health.lastRunAt || health.stale;
  if (!blocked) return null;

  let message: string;
  if (!health.configured) {
    message = t("bots_cron_blocked_off");
  } else if (!health.lastRunAt) {
    message = t("bots_cron_blocked_never", { minutes: String(health.intervalMinutes) });
  } else {
    const ago =
      health.minutesSinceLastRun != null ? String(health.minutesSinceLastRun) : "?";
    message = t("bots_cron_blocked_stale", { ago });
  }

  return (
    <div
      className="flex items-start gap-3 rounded-2xl border-2 border-amber-300/80 bg-gradient-to-r from-amber-50 to-orange-50 px-3.5 py-3 shadow-sm"
      role="alert"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-200/80 text-amber-900">
        <IconCron size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold text-amber-950">{t("bots_cron_blocked_title")}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-amber-900/90">{message}</p>
      </div>
    </div>
  );
}

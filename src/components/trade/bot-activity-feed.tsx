"use client";

import type { Messages } from "@/i18n/messages";
import {
  buildBotTradeHistoryRow,
} from "@/lib/bots-trade-display";
import { botTickSkipLabel, type BotLogRow } from "@/lib/bots-ui-helpers";

function tickReason(log: BotLogRow): string {
  const d = log.detail as { reason?: string } | null | undefined;
  return typeof d?.reason === "string" ? d.reason : "";
}

function formatLogTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type ActionVisual = {
  badgeKey: keyof Messages;
  icon: string;
  rail: string;
  iconBg: string;
};

const ACTION_VIS: Record<string, ActionVisual> = {
  futures_open: {
    badgeKey: "bots_feed_badge_open",
    icon: "▲",
    rail: "border-l-emerald-500",
    iconBg: "bg-emerald-600 text-white",
  },
  futures_sl_close: {
    badgeKey: "bots_feed_badge_close",
    icon: "■",
    rail: "border-l-stone-400",
    iconBg: "bg-stone-600 text-white",
  },
  futures_tp_close: {
    badgeKey: "bots_feed_badge_close",
    icon: "■",
    rail: "border-l-emerald-500",
    iconBg: "bg-emerald-700 text-white",
  },
  futures_smart_close: {
    badgeKey: "bots_feed_badge_smart_exit",
    icon: "◆",
    rail: "border-l-teal-500",
    iconBg: "bg-teal-600 text-white",
  },
  smart_exit_hold: {
    badgeKey: "bots_feed_badge_smart_exit_watch",
    icon: "◇",
    rail: "border-l-teal-400/80",
    iconBg: "bg-teal-800/90 text-white",
  },
  dca_buy: {
    badgeKey: "bots_feed_badge_buy",
    icon: "+",
    rail: "border-l-emerald-500",
    iconBg: "bg-emerald-600 text-white",
  },
  grid_refresh: {
    badgeKey: "bots_feed_badge_grid",
    icon: "▦",
    rail: "border-l-violet-500",
    iconBg: "bg-violet-600 text-white",
  },
  smart_skip: {
    badgeKey: "bots_feed_badge_skip",
    icon: "◇",
    rail: "border-l-sky-500",
    iconBg: "bg-sky-700 text-white",
  },
  tick_skip: {
    badgeKey: "bots_feed_badge_cron",
    icon: "◎",
    rail: "border-l-amber-500",
    iconBg: "bg-amber-700/90 text-white",
  },
  error: {
    badgeKey: "bots_feed_badge_error",
    icon: "!",
    rail: "border-l-rose-500",
    iconBg: "bg-rose-600 text-white",
  },
};

function visualFor(action: string, isErr: boolean): ActionVisual {
  if (isErr) return ACTION_VIS.error;
  return (
    ACTION_VIS[action] ?? {
      badgeKey: "bots_feed_badge_event" as keyof Messages,
      icon: "•",
      rail: "border-l-stone-400",
      iconBg: "bg-stone-600 text-white",
    }
  );
}

export type FeedViewModel = {
  events: BotLogRow[];
  cronSummary: { log: BotLogRow; count: number } | null;
};

export function buildFeedViewModel(
  logs: BotLogRow[],
  opts: { hidePositionOpenSkips: boolean },
): FeedViewModel {
  const ticks: BotLogRow[] = [];
  const events: BotLogRow[] = [];

  let holdKept = false;
  for (const log of logs) {
    if (log.action === "tick_skip") {
      if (opts.hidePositionOpenSkips && tickReason(log) === "position_open") {
        continue;
      }
      ticks.push(log);
    } else if (log.action === "smart_exit_hold") {
      if (!holdKept) {
        events.push(log);
        holdKept = true;
      }
    } else {
      events.push(log);
    }
  }

  let cronSummary: FeedViewModel["cronSummary"] = null;
  if (ticks.length > 0) {
    cronSummary = { log: ticks[0], count: ticks.length };
  }

  return { events, cronSummary };
}

function CronSummaryLine({
  summary,
  t,
}: {
  summary: { log: BotLogRow; count: number };
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string;
}) {
  const title = botTickSkipLabel(t, tickReason(summary.log));
  return (
    <li className="flex items-center gap-2.5 rounded-lg border border-stone-700/60 bg-stone-900/40 px-3 py-2 dark:border-stone-600/50">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-800/80 text-[11px] font-bold text-amber-100"
        aria-hidden
      >
        ◎
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-snug text-stone-400">{title}</p>
        <p className="mt-0.5 text-[10px] text-stone-500">
          {summary.count > 1
            ? t("bots_feed_cron_repeat", { count: String(summary.count) })
            : t("bots_feed_cron_once")}
          {" · "}
          <time dateTime={summary.log.createdAt} className="tabular-nums">
            {formatLogTime(summary.log.createdAt)}
          </time>
        </p>
      </div>
    </li>
  );
}

function ActivityEventLine({
  log,
  t,
}: {
  log: BotLogRow;
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string;
}) {
  const row = buildBotTradeHistoryRow(log, t);
  const isErr = log.action === "error";
  const vis = visualFor(log.action, isErr);
  const badgeLabel = t(vis.badgeKey);
  const title =
    log.action === "tick_skip"
      ? botTickSkipLabel(t, tickReason(log))
      : row.title;

  return (
    <li
      className={`flex gap-3 rounded-xl border border-stone-700/40 border-l-[3px] bg-stone-900/30 py-2.5 pl-2 pr-3 dark:border-stone-600/40 dark:bg-stone-950/50 ${vis.rail}`}
    >
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${vis.iconBg}`}
        aria-hidden
      >
        {vis.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
          <span className="rounded-md bg-stone-800/80 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-300">
            {badgeLabel}
          </span>
          <time
            dateTime={log.createdAt}
            className="shrink-0 text-[11px] font-medium tabular-nums text-stone-500"
          >
            {formatLogTime(log.createdAt)}
          </time>
        </div>
        <p
          className={`mt-1.5 text-sm font-medium leading-snug ${
            isErr
              ? "text-rose-300"
              : "text-stone-100 dark:text-stone-100"
          }`}
        >
          {title}
        </p>
        {row.chips.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {row.chips.slice(0, 5).map((c, i) => (
              <span
                key={`${c.icon}-${i}`}
                className="rounded-md border border-stone-600/50 bg-stone-800/60 px-1.5 py-0.5 text-[10px] font-medium text-stone-300"
              >
                {c.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}

export function BotActivityFeed({
  logs,
  hidePositionOpenSkips,
  emptyLabel,
  t,
}: {
  logs: BotLogRow[];
  hidePositionOpenSkips?: boolean;
  emptyLabel: string;
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string;
}) {
  const { events, cronSummary } = buildFeedViewModel(logs, {
    hidePositionOpenSkips: Boolean(hidePositionOpenSkips),
  });
  const hasContent = events.length > 0 || cronSummary !== null;

  if (!hasContent) {
    return (
      <p className="mt-2 rounded-lg border border-dashed border-stone-600/50 px-3 py-4 text-center text-xs text-stone-500">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className="mt-2 max-h-80 space-y-2 overflow-y-auto overscroll-contain pr-0.5">
      {cronSummary ? <CronSummaryLine summary={cronSummary} t={t} /> : null}
      {events.map((log) => (
        <ActivityEventLine key={log.id} log={log} t={t} />
      ))}
    </ul>
  );
}

"use client";

import type { Messages } from "@/i18n/messages";
import { BotChipIcon, BotFeedActionIcon } from "@/components/trade/bot-feed-icons";
import {
  CronPulseIcon,
  DecisionSkipCard,
} from "@/components/trade/bot-decision-visual";
import { buildBotTradeHistoryRow } from "@/lib/bots-trade-display";
import {
  botLogDetailMessage,
  botTickSkipLabel,
  decisionCategoryClass,
  type BotLogRow,
} from "@/lib/bots-ui-helpers";

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

const FEED_ICON_BG: Record<string, string> = {
  futures_open: "bg-emerald-600 text-white",
  futures_sl_close: "bg-stone-500 text-white",
  futures_tp_close: "bg-emerald-700 text-white",
  futures_smart_close: "bg-teal-600 text-white",
  smart_exit_hold: "bg-teal-700/90 text-white",
  futures_breakeven_armed: "bg-sky-600 text-white",
  futures_trailing_close: "bg-sky-500 text-white",
  dca_buy: "bg-emerald-600 text-white",
  grid_refresh: "bg-violet-600 text-white",
  smart_skip: "bg-stone-600 text-white",
  ai_skip: "bg-violet-700 text-white",
  decision_skip: "bg-stone-700 text-white",
  tick_skip: "bg-amber-700/90 text-white",
  error: "bg-rose-600 text-white",
};

function iconBg(action: string, isErr: boolean): string {
  if (isErr) return FEED_ICON_BG.error;
  return FEED_ICON_BG[action] ?? "bg-stone-500 text-white";
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
    } else if (log.action === "futures_trailing_peak") {
      continue;
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
  const trace = (summary.log.detail as { trace?: { reason_code?: string } } | null)
    ?.trace;
  const code = trace?.reason_code ?? tickReason(summary.log);

  return (
    <li className="bot-data-row flex items-center gap-2.5">
      <CronPulseIcon />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[11px] font-semibold text-[color:var(--fd-text)]">
          {code ? code.replace(/_/g, " ") : t("bots_feed_badge_cron")}
        </p>
        <p className="mt-0.5 text-[10px] tabular-nums text-[color:var(--fd-muted)]">
          {summary.count > 1 ? `×${summary.count} · ` : null}
          <time dateTime={summary.log.createdAt}>{formatLogTime(summary.log.createdAt)}</time>
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
  const detail = log.detail as Record<string, unknown> | null;
  const trace = detail?.trace as
    | {
        reason_code?: string;
        category?: string;
        score?: number;
      }
    | undefined;
  const technical = detail?.technical as { confidence?: number } | undefined;
  const ai = detail?.ai as
    | { confidence?: number; warning_level?: string }
    | undefined;
  const categoryRail =
    log.action === "decision_skip" && trace?.category
      ? decisionCategoryClass(trace.category)
      : "border-l-[color:var(--fd-border)]";
  const isSkip =
    log.action === "smart_skip" ||
    log.action === "ai_skip" ||
    log.action === "decision_skip";

  const badgeKey =
    log.action === "decision_skip"
      ? "bots_feed_badge_skip"
      : log.action === "ai_skip"
        ? "bots_feed_badge_skip"
        : log.action === "smart_skip"
          ? "bots_feed_badge_skip"
          : (
              {
                futures_open: "bots_feed_badge_open",
                futures_sl_close: "bots_feed_badge_close",
                futures_tp_close: "bots_feed_badge_close",
                futures_smart_close: "bots_feed_badge_smart_exit",
                smart_exit_hold: "bots_feed_badge_smart_exit_watch",
                futures_breakeven_armed: "bots_feed_badge_breakeven",
                futures_trailing_close: "bots_feed_badge_trailing",
                dca_buy: "bots_feed_badge_buy",
                grid_refresh: "bots_feed_badge_grid",
                tick_skip: "bots_feed_badge_cron",
                error: "bots_feed_badge_error",
              } as Record<string, keyof Messages>
            )[log.action] ?? "bots_feed_badge_event";

  return (
    <li className={`bot-data-row border-l-2 pl-2 ${categoryRail}`}>
      <div className="flex gap-2.5">
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg(log.action, isErr)}`}
        >
          <BotFeedActionIcon action={log.action} size={15} />
        </span>
        <div className="min-w-0 flex-1 pb-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--fd-muted)]">
              {t(badgeKey)}
            </span>
            <time
              dateTime={log.createdAt}
              className="shrink-0 text-[10px] tabular-nums text-[color:var(--fd-muted)]"
            >
              {formatLogTime(log.createdAt)}
            </time>
          </div>

          {isSkip && trace?.reason_code ? (
            <DecisionSkipCard
              reasonCode={trace.reason_code}
              category={trace.category}
              score={typeof trace.score === "number" ? trace.score : undefined}
              confidence={ai?.confidence ?? technical?.confidence}
              warningLevel={ai?.warning_level}
            />
          ) : (
            <p
              className={`mt-0.5 text-sm font-medium leading-snug ${
                isErr ? "text-rose-700" : "text-[color:var(--fd-text)]"
              }`}
            >
              {isSkip
                ? botLogDetailMessage(log, t) ?? row.title
                : row.title}
            </p>
          )}

          {!isSkip && row.chips.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {row.chips.map((c, i) => (
                <span key={`${c.kind}-${i}`} className="bot-chip">
                  <BotChipIcon kind={c.kind} />
                  <span>{c.label}</span>
                </span>
              ))}
            </div>
          ) : null}
        </div>
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
      <p className="py-6 text-center text-xs text-[color:var(--fd-muted)]">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className="bot-data-list mt-1 max-h-80 overflow-y-auto overscroll-contain">
      {cronSummary ? <CronSummaryLine summary={cronSummary} t={t} /> : null}
      {events.map((log) => (
        <ActivityEventLine key={log.id} log={log} t={t} />
      ))}
    </ul>
  );
}

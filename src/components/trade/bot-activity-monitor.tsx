"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import type { Messages } from "@/i18n/messages";
import type {
  BotActivityLevel,
  BotLiveActivity,
  BotLiveStatus,
} from "@/lib/bot-activity-mock";

const POLL_MS = 4_000;
const MAX_LOGS = 50;

const BADGE_CLASS: Record<BotActivityLevel, string> = {
  INFO: "bg-sky-900/80 text-sky-200 border-sky-700",
  SUCCESS: "bg-emerald-900/80 text-emerald-200 border-emerald-700",
  WARNING: "bg-amber-900/80 text-amber-200 border-amber-700",
  ERROR: "bg-rose-900/80 text-rose-200 border-rose-700",
};

const STATUS_CLASS: Record<BotLiveStatus, string> = {
  ACTIVE: "bg-emerald-600 text-white",
  ANALYZING: "bg-sky-600 text-white",
  WAITING: "bg-stone-600 text-stone-100",
  TRADING: "bg-violet-600 text-white",
};

const STATUS_KEY: Record<BotLiveStatus, keyof Messages> = {
  ACTIVE: "bots_live_status_active",
  ANALYZING: "bots_live_status_analyzing",
  WAITING: "bots_live_status_waiting",
  TRADING: "bots_live_status_trading",
};

function mergeActivities(
  prev: BotLiveActivity[],
  incoming: BotLiveActivity[],
): BotLiveActivity[] {
  const map = new Map<string, BotLiveActivity>();
  for (const a of [...incoming, ...prev]) {
    map.set(a.id, a);
  }
  return [...map.values()]
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, MAX_LOGS);
}

export function BotActivityMonitor() {
  const { t } = useI18n();
  const [status, setStatus] = useState<BotLiveStatus>("ACTIVE");
  const [logs, setLogs] = useState<BotLiveActivity[]>([]);
  const [live, setLive] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/trade/bots/activity-live", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = await res.json();
      if (typeof json.status === "string") {
        setStatus(json.status as BotLiveStatus);
      }
      if (Array.isArray(json.activities)) {
        setLogs((prev) =>
          mergeActivities(prev, json.activities as BotLiveActivity[]),
        );
      }
      setLive(true);
    } catch {
      setLive(false);
    }
  }, []);

  useEffect(() => {
    void poll();
    const id = window.setInterval(() => void poll(), POLL_MS);
    return () => window.clearInterval(id);
  }, [poll]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = 0;
  }, [logs]);

  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-950/90 p-4 text-stone-100 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold tracking-wide text-stone-100">
            {t("bots_activity_monitor_title")}
          </h2>
          <p className="mt-0.5 text-xs text-stone-500">
            {t("bots_activity_monitor_hint")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_CLASS[status]}`}
          >
            {t(STATUS_KEY[status])}
          </span>
          <span
            className={`h-2 w-2 rounded-full ${live ? "bg-emerald-400" : "bg-stone-600"}`}
            title={live ? "Live" : "Offline"}
          />
        </div>
      </div>

      <div
        ref={listRef}
        className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-stone-800 bg-stone-900/80"
      >
        {logs.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-stone-500">
            {t("bots_activity_monitor_empty")}
          </p>
        ) : (
          <ul className="divide-y divide-stone-800/80">
            {logs.map((row) => (
              <li
                key={row.id}
                className="flex items-start gap-2 px-3 py-2 text-xs"
              >
                <span className="shrink-0 font-mono text-stone-500">{row.time}</span>
                <span
                  className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${BADGE_CLASS[row.type]}`}
                >
                  {row.type}
                </span>
                <span className="text-stone-200">{row.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

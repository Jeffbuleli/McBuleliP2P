"use client";

import { useCallback, useEffect, useState } from "react";
import type { Messages } from "@/i18n/messages";

type AiStatusPayload = {
  enabled: boolean;
  fresh?: boolean;
  ageMs?: number | null;
  maxAgeMs?: number;
  action?: "LONG" | "SHORT" | "HOLD" | null;
  confidence?: number | null;
  receivedAt?: string | null;
};

function formatAgeSeconds(
  ageMs: number,
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string,
): string {
  const sec = Math.max(0, Math.round(ageMs / 1000));
  if (sec < 60) {
    return t("bots_ai_status_age_seconds", { n: sec });
  }
  const min = Math.round(sec / 60);
  return t("bots_ai_status_age_minutes", { n: min });
}

function actionLabel(
  action: "LONG" | "SHORT" | "HOLD",
  t: (key: keyof Messages) => string,
): string {
  if (action === "LONG") return t("bots_ai_action_long");
  if (action === "SHORT") return t("bots_ai_action_short");
  return t("bots_ai_action_hold");
}

export function AiAssistStatusBadge({
  instanceId,
  enabled,
  pollMs = 20_000,
  t,
}: {
  instanceId?: string | null;
  enabled: boolean;
  pollMs?: number;
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string;
}) {
  const [status, setStatus] = useState<AiStatusPayload | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !instanceId) {
      setStatus(null);
      return;
    }
    try {
      const res = await fetch(
        `/api/trade/bots/ai-status?instanceId=${encodeURIComponent(instanceId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const json = (await res.json()) as AiStatusPayload;
      setStatus(json);
    } catch {
      /* ignore transient network errors */
    }
  }, [enabled, instanceId]);

  useEffect(() => {
    void load();
    if (!enabled || !instanceId) return;
    const id = window.setInterval(() => void load(), pollMs);
    return () => window.clearInterval(id);
  }, [enabled, instanceId, load, pollMs]);

  if (!enabled) return null;

  if (!instanceId) {
    return (
      <p className="mt-1.5 text-[10px] text-[color:var(--fd-muted)]">
        {t("bots_ai_status_save_first")}
      </p>
    );
  }

  if (!status?.enabled) {
    return (
      <p className="mt-1.5 text-[10px] text-[color:var(--fd-muted)]">
        {t("bots_ai_status_waiting")}
      </p>
    );
  }

  const action = status.action;
  const conf =
    typeof status.confidence === "number" ? Math.round(status.confidence) : null;

  if (!action || status.receivedAt == null) {
    return (
      <div
        className="mt-1.5 flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-900"
        role="status"
      >
        <span
          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
          aria-hidden
        />
        <span>{t("bots_ai_status_waiting")}</span>
      </div>
    );
  }

  const ageMs = status.ageMs ?? 0;
  const ageLabel = formatAgeSeconds(ageMs, t);
  const fresh = Boolean(status.fresh);

  if (!fresh) {
    return (
      <div
        className="mt-1.5 flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-900"
        role="status"
      >
        <span
          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
          aria-hidden
        />
        <span>{t("bots_ai_status_stale")}</span>
      </div>
    );
  }

  const tone =
    action === "HOLD"
      ? "border-[color:var(--fd-border)] bg-white text-[color:var(--fd-muted)]"
      : action === "LONG"
        ? "border-[color:var(--fd-primary)]/30 bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]"
        : "border-rose-200 bg-rose-50 text-rose-900";

  const dot =
    action === "HOLD"
      ? "bg-stone-400"
      : action === "LONG"
        ? "bg-emerald-500"
        : "bg-rose-500";

  return (
    <div
      className={`mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded border px-2 py-1 text-[10px] font-medium ${tone}`}
      role="status"
    >
      <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden />
      <span>
        {t("bots_ai_status_fresh", {
          action: actionLabel(action, t),
          confidence: String(conf ?? "—"),
          age: ageLabel,
        })}
      </span>
    </div>
  );
}

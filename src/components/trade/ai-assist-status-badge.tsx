"use client";

import { useCallback, useEffect, useState } from "react";
import type { Messages } from "@/i18n/messages";
import {
  ActionIcon,
  IconClock,
  IconSpinner,
  IconStatusWarn,
  IconXLogo,
  parseXSentiment,
  SentimentIcon,
} from "@/components/trade/bot-visual-icons";

type AiStatusPayload = {
  enabled: boolean;
  fresh?: boolean;
  ageMs?: number | null;
  action?: "LONG" | "SHORT" | "HOLD" | null;
  confidence?: number | null;
  receivedAt?: string | null;
  xInsight?: string | null;
};

function compactAge(ageMs: number): string {
  const sec = Math.max(0, Math.round(ageMs / 1000));
  if (sec < 60) return `${sec}s`;
  return `${Math.round(sec / 60)}m`;
}

/** Icon-only AI signal row (futures coordination). */
export function AiAssistSignalStrip({
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
      setStatus((await res.json()) as AiStatusPayload);
    } catch {
      /* ignore */
    }
  }, [enabled, instanceId]);

  useEffect(() => {
    void load();
    if (!enabled || !instanceId) return;
    const id = window.setInterval(() => void load(), pollMs);
    return () => window.clearInterval(id);
  }, [enabled, instanceId, load, pollMs]);

  if (!enabled || !instanceId) return null;

  if (!status?.enabled || !status.action || status.receivedAt == null) {
    return (
      <div
        className="bot-ai-strip bot-ai-strip--wait"
        role="status"
        aria-label={t("bots_ai_aria_waiting")}
        title={t("bots_ai_aria_waiting")}
      >
        <IconSpinner className="text-amber-600" />
      </div>
    );
  }

  const action = status.action;
  const conf =
    typeof status.confidence === "number" ? Math.round(status.confidence) : null;
  const fresh = Boolean(status.fresh);
  const ageMs = status.ageMs ?? 0;
  const xKind = status.xInsight ? parseXSentiment(status.xInsight) : null;

  if (!fresh) {
    return (
      <div
        className="bot-ai-strip bot-ai-strip--stale"
        role="status"
        aria-label={t("bots_ai_aria_stale")}
        title={t("bots_ai_aria_stale")}
      >
        <IconStatusWarn className="text-amber-600" />
        <IconClock className="opacity-60" />
        <span className="bot-ai-strip__mono">{compactAge(ageMs)}</span>
      </div>
    );
  }

  const tone =
    action === "LONG"
      ? "bot-ai-strip--long"
      : action === "SHORT"
        ? "bot-ai-strip--short"
        : "bot-ai-strip--hold";

  return (
    <div
      className={`bot-ai-strip ${tone}`}
      role="status"
      aria-label={t("bots_ai_aria_signal", {
        action,
        confidence: String(conf ?? 0),
        age: compactAge(ageMs),
      })}
      title={status.xInsight ?? undefined}
    >
      <ActionIcon action={action} size={18} />
      {conf != null ? (
        <span className="bot-ai-strip__conf" aria-hidden>
          {conf}
        </span>
      ) : null}
      <span className="bot-ai-strip__sep" aria-hidden />
      <IconClock size={14} className="opacity-70" />
      <span className="bot-ai-strip__mono">{compactAge(ageMs)}</span>
      {xKind ? (
        <>
          <span className="bot-ai-strip__sep" aria-hidden />
          <IconXLogo size={12} className="opacity-50" />
          <SentimentIcon kind={xKind} size={16} />
        </>
      ) : null}
    </div>
  );
}

/** @deprecated Use AiAssistSignalStrip — kept for futures-trader-profile-panel */
export function AiAssistStatusBadge(props: {
  instanceId?: string | null;
  enabled: boolean;
  pollMs?: number;
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string;
}) {
  return <AiAssistSignalStrip {...props} />;
}

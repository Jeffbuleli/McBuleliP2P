"use client";

import { useCallback, useEffect, useState } from "react";
import type { Messages } from "@/i18n/messages";
import { BotFlowCategory } from "@/components/trade/bots-flow-ui";
import type { CronHealthSnapshot } from "@/components/trade/bots-cron-health-bar";

type StepState = "ok" | "warn" | "off";

function CoordTile({
  label,
  stateLabel,
  tone,
  glyph,
}: {
  label: string;
  stateLabel: string;
  tone: StepState;
  glyph: string;
}) {
  return (
    <div className={`bot-coord-tile bot-coord-tile--${tone}`}>
      <span className="bot-coord-tile__icon" aria-hidden>
        {glyph}
      </span>
      <span className="bot-coord-tile__label">{label}</span>
      <span className="bot-coord-tile__state">{stateLabel}</span>
    </div>
  );
}

export function BotCoordinationRail({
  cronHealth,
  coordinated = true,
  aiAssistMode = true,
  botStatus,
  instanceId,
  t,
}: {
  cronHealth?: CronHealthSnapshot | null;
  /** When true, TA + AI are shown as one “Analysis” step (default product UX). */
  coordinated?: boolean;
  aiAssistMode?: boolean;
  botStatus: "active" | "paused" | "none";
  instanceId?: string | null;
  t: (key: keyof Messages) => string;
}) {
  const [aiFresh, setAiFresh] = useState(false);
  const [aiHasSignal, setAiHasSignal] = useState(false);

  const loadAi = useCallback(async () => {
    if (!aiAssistMode || !instanceId) {
      setAiFresh(false);
      setAiHasSignal(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/trade/bots/ai-status?instanceId=${encodeURIComponent(instanceId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const json = (await res.json()) as {
        fresh?: boolean;
        action?: string | null;
        receivedAt?: string | null;
      };
      setAiFresh(Boolean(json.fresh));
      setAiHasSignal(Boolean(json.receivedAt && json.action));
    } catch {
      /* ignore */
    }
  }, [aiAssistMode, instanceId]);

  useEffect(() => {
    void loadAi();
    if (!aiAssistMode || !instanceId) return;
    const id = window.setInterval(() => void loadAi(), 20_000);
    return () => window.clearInterval(id);
  }, [aiAssistMode, instanceId, loadAi]);

  let cronTone: StepState = "off";
  let cronLabel = t("bots_coord_off");
  if (cronHealth?.configured) {
    if (!cronHealth.lastRunAt || cronHealth.stale) {
      cronTone = "warn";
      cronLabel = t("bots_coord_warn");
    } else {
      cronTone = "ok";
      cronLabel = t("bots_coord_ok");
    }
  }

  let analysisTone: StepState = coordinated ? "ok" : "off";
  let analysisLabel = coordinated ? t("bots_coord_ok") : t("bots_coord_off");
  if (coordinated && aiAssistMode && instanceId) {
    if (aiFresh && aiHasSignal) {
      analysisTone = "ok";
      analysisLabel = t("bots_coord_ok");
    } else if (botStatus === "active") {
      analysisTone = "warn";
      analysisLabel = t("bots_coord_warn");
    }
  }

  let botTone: StepState = "off";
  let botLabel = t("bots_coord_stopped");
  if (botStatus === "active") {
    botTone = "ok";
    botLabel = t("bots_coord_running");
  } else if (botStatus === "paused") {
    botTone = "warn";
    botLabel = t("bots_coord_paused");
  }

  const steps = coordinated
    ? [
        {
          key: "cron",
          label: t("bots_coord_cron"),
          state: cronLabel,
          tone: cronTone,
          glyph: "⏱",
        },
        {
          key: "analysis",
          label: t("bots_coord_analysis"),
          state: analysisLabel,
          tone: analysisTone,
          glyph: "✦",
        },
        {
          key: "bot",
          label: t("bots_coord_bot"),
          state: botLabel,
          tone: botTone,
          glyph: "⚡",
        },
      ]
    : [
        {
          key: "cron",
          label: t("bots_coord_cron"),
          state: cronLabel,
          tone: cronTone,
          glyph: "⏱",
        },
        {
          key: "bot",
          label: t("bots_coord_bot"),
          state: botLabel,
          tone: botTone,
          glyph: "⚡",
        },
      ];

  return (
    <BotFlowCategory
      title={t("bots_coord_title")}
      icon={
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 12h4l2-5 4 10 2-5h4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      }
      className="mt-3"
    >
      <div className="flex items-center gap-1">
        {steps.map((step, i) => (
          <span key={step.key} className="flex min-w-0 flex-1 items-center gap-1">
            {i > 0 ? <span className="bot-coord-arrow" aria-hidden>→</span> : null}
            <CoordTile
              label={step.label}
              stateLabel={step.state}
              tone={step.tone}
              glyph={step.glyph}
            />
          </span>
        ))}
      </div>
    </BotFlowCategory>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import type { Messages } from "@/i18n/messages";
import { AiAssistSignalStrip } from "@/components/trade/ai-assist-status-badge";
import {
  IconAnalysis,
  IconBot,
  IconChevronRight,
  IconCron,
  IconPause,
  IconPlay,
  IconStatusOff,
  IconStatusOk,
  IconStatusWarn,
} from "@/components/trade/bot-visual-icons";
import type { CronHealthSnapshot } from "@/components/trade/bots-cron-health-bar";

type StepState = "ok" | "warn" | "off";

type StepIcon = typeof IconCron;

function stepStatusIcon(state: StepState, botRunning?: boolean, botPaused?: boolean) {
  if (botRunning) {
    return (
      <span className="bot-coord-tile__status bot-coord-tile__status--ok" aria-hidden>
        <IconPlay size={14} />
      </span>
    );
  }
  if (botPaused) {
    return (
      <span className="bot-coord-tile__status bot-coord-tile__status--warn" aria-hidden>
        <IconPause size={14} />
      </span>
    );
  }
  if (state === "ok") {
    return (
      <span className="bot-coord-tile__status bot-coord-tile__status--ok" aria-hidden>
        <IconStatusOk />
      </span>
    );
  }
  if (state === "warn") {
    return (
      <span className="bot-coord-tile__status bot-coord-tile__status--warn" aria-hidden>
        <IconStatusWarn />
      </span>
    );
  }
  return (
    <span className="bot-coord-tile__status bot-coord-tile__status--off" aria-hidden>
      <IconStatusOff />
    </span>
  );
}

function CoordTile({
  ariaLabel,
  tone,
  Icon,
  state,
  botRunning,
  botPaused,
}: {
  ariaLabel: string;
  tone: StepState;
  Icon: StepIcon;
  state: StepState;
  botRunning?: boolean;
  botPaused?: boolean;
}) {
  return (
    <div
      className={`bot-coord-tile bot-coord-tile--${tone}`}
      title={ariaLabel}
      role="img"
      aria-label={ariaLabel}
    >
      <div className="bot-coord-tile__icon-wrap">
        <Icon size={22} className="bot-coord-tile__glyph" />
        {stepStatusIcon(state, botRunning, botPaused)}
      </div>
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
  let cronAria = t("bots_coord_aria_cron_off");
  if (cronHealth?.configured) {
    if (!cronHealth.lastRunAt || cronHealth.stale) {
      cronTone = "warn";
      cronAria = t("bots_coord_aria_cron_wait");
    } else {
      cronTone = "ok";
      cronAria = t("bots_coord_aria_cron_ok");
    }
  }

  let analysisTone: StepState = coordinated ? "ok" : "off";
  let analysisAria = coordinated
    ? t("bots_coord_aria_analysis_ok")
    : t("bots_coord_aria_analysis_off");
  if (coordinated && aiAssistMode && instanceId) {
    if (aiFresh && aiHasSignal) {
      analysisTone = "ok";
      analysisAria = t("bots_coord_aria_analysis_ok");
    } else if (botStatus === "active") {
      analysisTone = "warn";
      analysisAria = t("bots_coord_aria_analysis_wait");
    }
  }

  let botTone: StepState = "off";
  let botAria = t("bots_coord_aria_bot_off");
  const botRunning = botStatus === "active";
  const botPaused = botStatus === "paused";
  if (botRunning) {
    botTone = "ok";
    botAria = t("bots_coord_aria_bot_on");
  } else if (botPaused) {
    botTone = "warn";
    botAria = t("bots_coord_aria_bot_pause");
  }

  const steps = coordinated
    ? [
        {
          key: "cron",
          aria: cronAria,
          tone: cronTone,
          Icon: IconCron,
          state: cronTone,
        },
        {
          key: "analysis",
          aria: analysisAria,
          tone: analysisTone,
          Icon: IconAnalysis,
          state: analysisTone,
        },
        {
          key: "bot",
          aria: botAria,
          tone: botTone,
          Icon: IconBot,
          state: botTone,
          botRunning,
          botPaused,
        },
      ]
    : [
        {
          key: "cron",
          aria: cronAria,
          tone: cronTone,
          Icon: IconCron,
          state: cronTone,
        },
        {
          key: "bot",
          aria: botAria,
          tone: botTone,
          Icon: IconBot,
          state: botTone,
          botRunning,
          botPaused,
        },
      ];

  return (
    <div className="bot-coord-rail">
      <div className="flex items-center gap-1">
        {steps.map((step, i) => (
          <span key={step.key} className="flex min-w-0 flex-1 items-center gap-1">
            {i > 0 ? (
              <span className="bot-coord-arrow" aria-hidden>
                <IconChevronRight />
              </span>
            ) : null}
            <CoordTile
              ariaLabel={step.aria}
              tone={step.tone}
              Icon={step.Icon}
              state={step.state}
              botRunning={step.botRunning}
              botPaused={step.botPaused}
            />
          </span>
        ))}
      </div>
      {coordinated && aiAssistMode && instanceId ? (
        <AiAssistSignalStrip instanceId={instanceId} enabled t={t} />
      ) : null}
    </div>
  );
}

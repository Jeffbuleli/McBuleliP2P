"use client";

import { BotFlowBtn } from "@/components/trade/bots-flow-ui";

type Variant = "emerald" | "violet" | "amber";

export function BotRunControls({
  status,
  busy,
  monitoringOpen,
  monitoringLabel,
  startLabel,
  pauseLabel,
  runningLabel = "Running",
  stoppedLabel = "Stopped",
  onStart,
  onPause,
  variant = "emerald",
}: {
  status: "active" | "paused" | "none";
  busy: boolean;
  monitoringOpen?: boolean;
  monitoringLabel?: string;
  startLabel: string;
  pauseLabel: string;
  runningLabel?: string;
  stoppedLabel?: string;
  onStart: () => void;
  onPause: () => void;
  variant?: Variant;
}) {
  const active = status === "active";
  const btnVariant =
    variant === "violet" ? "violet" : variant === "amber" ? "amber" : "primary";

  return (
    <div className="mt-2 space-y-2">
      <div
        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${
          active
            ? "border border-[color:var(--fd-primary)]/25 bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]"
            : "border border-[color:var(--fd-border)] bg-white text-[color:var(--fd-muted)]"
        }`}
      >
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            active ? "animate-pulse bg-[color:var(--fd-primary)]" : "bg-stone-300"
          }`}
          aria-hidden
        />
        {active
          ? monitoringOpen && monitoringLabel
            ? monitoringLabel
            : runningLabel
          : status === "paused"
            ? pauseLabel
            : stoppedLabel}
      </div>
      {!active ? (
        <BotFlowBtn variant={btnVariant} disabled={busy} onClick={onStart}>
          {startLabel}
        </BotFlowBtn>
      ) : (
        <BotFlowBtn variant="ghost" disabled={busy} onClick={onPause}>
          {pauseLabel}
        </BotFlowBtn>
      )}
    </div>
  );
}

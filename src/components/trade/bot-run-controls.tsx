"use client";

import { BotFlowBtn } from "@/components/trade/bots-flow-ui";

type Variant = "emerald" | "violet" | "amber";

function PlayIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
    </svg>
  );
}

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

  const statusText = active
    ? monitoringOpen && monitoringLabel
      ? monitoringLabel
      : runningLabel
    : status === "paused"
      ? pauseLabel
      : stoppedLabel;

  return (
    <div className="mt-2 space-y-2">
      <div
        className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${
          active
            ? "border border-[color:var(--fd-primary)]/30 bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]"
            : status === "paused"
              ? "border border-amber-200 bg-amber-50 text-amber-900"
              : "border border-[color:var(--fd-border)] bg-white text-[color:var(--fd-muted)]"
        }`}
      >
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            active
              ? "animate-pulse bg-[color:var(--fd-primary)]"
              : status === "paused"
                ? "bg-amber-500"
                : "bg-stone-300"
          }`}
          aria-hidden
        />
        <span className="truncate">{statusText}</span>
      </div>

      {!active ? (
        <BotFlowBtn
          variant={btnVariant}
          disabled={busy}
          onClick={onStart}
          className="!flex gap-2"
        >
          <PlayIcon />
          <span>{startLabel}</span>
        </BotFlowBtn>
      ) : (
        <BotFlowBtn
          variant="danger"
          disabled={busy}
          onClick={onPause}
          className="!flex gap-2"
        >
          <PauseIcon />
          <span>{pauseLabel}</span>
        </BotFlowBtn>
      )}
    </div>
  );
}

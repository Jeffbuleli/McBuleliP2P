"use client";

import { useI18n } from "@/components/i18n-provider";
import { IconCheck, IconClock, IconSpinner, IconX } from "@/components/icons/flow-icons";
import { HUD_PANEL_LG, HudFrame } from "@/components/ui/hud-frame";
import type { StepState, TxStep } from "@/lib/transaction-steps";
import { progressPercent } from "@/lib/transaction-steps";

function StepDot({ state }: { state: StepState }) {
  const base =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all";
  if (state === "done") {
    return (
      <span className={`${base} border-emerald-400 bg-emerald-500/25 text-emerald-300`}>
        <IconCheck className="h-4 w-4" />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className={`${base} border-cyan-400 bg-cyan-500/15 text-cyan-300`}>
        <IconSpinner className="h-4 w-4" />
      </span>
    );
  }
  if (state === "failed") {
    return (
      <span className={`${base} border-rose-400 bg-rose-500/20 text-rose-300`}>
        <IconX className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className={`${base} border-white/12 bg-[#0a1018]/80 text-[color:var(--fd-muted)]`}>
      <IconClock className="h-4 w-4 opacity-50" />
    </span>
  );
}

export function TransactionStepper({
  steps,
  compact,
}: {
  steps: TxStep[];
  compact?: boolean;
}) {
  const { t } = useI18n();
  const pct = progressPercent(steps);

  return (
    <HudFrame accent="cyan" className={`${HUD_PANEL_LG} overflow-hidden`}>
      <div className="p-4">
        {!compact ? (
          <div className="mb-3 flex items-center justify-between text-xs font-semibold text-[color:var(--fd-muted)]">
            <span>{t("tx_progress")}</span>
            <span className="tabular-nums text-cyan-300">{pct}%</span>
          </div>
        ) : null}
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <ol className="flex justify-between gap-1">
          {steps.map((step) => (
            <li key={step.id} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <StepDot state={step.state} />
              <span
                className={`max-w-[4.5rem] text-center text-[9px] font-semibold leading-tight ${
                  step.state === "active"
                    ? "text-cyan-300"
                    : step.state === "done"
                      ? "text-emerald-300"
                      : step.state === "failed"
                        ? "text-rose-400"
                        : "text-[color:var(--fd-muted)]"
                }`}
              >
                {t(step.labelKey)}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </HudFrame>
  );
}

export function StatusOutcomeBanner({
  variant,
  title,
  detail,
}: {
  variant: "success" | "failed" | "pending";
  title: string;
  detail?: string;
}) {
  const accent = variant === "success" ? "green" : variant === "failed" ? "magenta" : "amber";
  const styles =
    variant === "success"
      ? "border-emerald-400/30 bg-emerald-500/10 tx-outcome-success"
      : variant === "failed"
        ? "border-rose-400/30 bg-rose-500/10 tx-outcome-failed"
        : "border-amber-400/30 bg-amber-500/10";

  return (
    <HudFrame accent={accent} className={`${HUD_PANEL_LG} ${styles}`}>
      <div className="flex items-center gap-3 p-4" role="status">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            variant === "success"
              ? "border border-emerald-400/35 bg-emerald-500/20 text-emerald-300"
              : variant === "failed"
                ? "border border-rose-400/35 bg-rose-500/20 text-rose-300"
                : "border border-amber-400/35 bg-amber-500/20 text-amber-300"
          }`}
        >
          {variant === "success" ? (
            <IconCheck className="h-6 w-6" />
          ) : variant === "failed" ? (
            <IconX className="h-6 w-6" />
          ) : (
            <IconClock className="h-6 w-6" />
          )}
        </span>
        <div className="min-w-0">
          <p className="font-bold text-[color:var(--fd-text)]">{title}</p>
          {detail ? (
            <p className="mt-0.5 text-sm tabular-nums text-[color:var(--fd-muted)]">{detail}</p>
          ) : null}
        </div>
      </div>
    </HudFrame>
  );
}

export function StatusPill({
  variant,
  label,
}: {
  variant: "success" | "failed" | "pending" | "processing";
  label: string;
}) {
  const cls =
    variant === "success"
      ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
      : variant === "failed"
        ? "border border-rose-400/30 bg-rose-500/15 text-rose-300"
        : variant === "processing"
          ? "border border-cyan-400/30 bg-cyan-500/15 text-cyan-300"
          : "border border-amber-400/30 bg-amber-500/15 text-amber-300";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>
      {variant === "success" ? (
        <IconCheck className="h-3 w-3" />
      ) : variant === "failed" ? (
        <IconX className="h-3 w-3" />
      ) : (
        <IconClock className="h-3 w-3" />
      )}
      {label}
    </span>
  );
}

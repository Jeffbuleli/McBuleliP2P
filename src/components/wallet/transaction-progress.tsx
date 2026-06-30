"use client";

import { useI18n } from "@/components/i18n-provider";
import { IconCheck, IconClock, IconSpinner, IconX } from "@/components/icons/flow-icons";
import type { StepState, TxStep } from "@/lib/transaction-steps";
import { progressPercent } from "@/lib/transaction-steps";

function StepDot({ state }: { state: StepState }) {
  const base =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all";
  if (state === "done") {
    return (
      <span className={`${base} border-[color:var(--fd-primary)] bg-[color:var(--fd-primary)] text-white`}>
        <IconCheck className="h-4 w-4" />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className={`${base} border-[color:var(--fd-primary)] bg-white text-[color:var(--fd-primary)]`}>
        <IconSpinner className="h-4 w-4" />
      </span>
    );
  }
  if (state === "failed") {
    return (
      <span className={`${base} border-rose-500 bg-rose-500 text-white`}>
        <IconX className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className={`${base} border-[color:var(--fd-border)] bg-stone-50 text-[color:var(--fd-muted)]`}>
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
    <div className="fd-card overflow-hidden p-4">
      {!compact ? (
        <div className="mb-3 flex items-center justify-between text-xs font-semibold text-[color:var(--fd-muted)]">
          <span>{t("tx_progress")}</span>
          <span className="tabular-nums text-[color:var(--fd-primary)]">{pct}%</span>
        </div>
      ) : null}
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[color:var(--fd-border)]">
        <div
          className="h-full rounded-full bg-[color:var(--fd-primary)] transition-all duration-500"
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
                  ? "text-[color:var(--fd-primary)]"
                  : step.state === "done"
                    ? "text-[color:var(--fd-text)]"
                    : step.state === "failed"
                      ? "text-rose-700"
                      : "text-[color:var(--fd-muted)]"
              }`}
            >
              {t(step.labelKey)}
            </span>
          </li>
        ))}
      </ol>
    </div>
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
  const styles =
    variant === "success"
      ? "border-emerald-200 bg-emerald-50 tx-outcome-success"
      : variant === "failed"
        ? "border-rose-200 bg-rose-50 tx-outcome-failed"
        : "border-amber-200 bg-amber-50";

  return (
    <div
      className={`fd-card flex items-center gap-3 border p-4 ${styles}`}
      role="status"
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
          variant === "success"
            ? "bg-emerald-600 text-white"
            : variant === "failed"
              ? "bg-rose-600 text-white"
              : "bg-amber-500 text-white"
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
      ? "bg-emerald-100 text-emerald-900"
      : variant === "failed"
        ? "bg-rose-100 text-rose-900"
        : variant === "processing"
          ? "bg-sky-100 text-sky-900"
          : "bg-amber-100 text-amber-900";
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

"use client";

import { useI18n } from "@/components/i18n-provider";
import type { Messages } from "@/i18n/messages";

type StepDef = { key: keyof Messages; icon: "doc" | "lock" | "clock" | "check" | "hand" | "flag" };

const STEP_DEFS: StepDef[] = [
  { key: "p2p_step_order_created", icon: "doc" },
  { key: "p2p_step_escrow_locked", icon: "lock" },
  { key: "p2p_step_await_fiat", icon: "clock" },
  { key: "p2p_step_fiat_marked", icon: "check" },
  { key: "p2p_step_settlement", icon: "hand" },
  { key: "p2p_step_finished", icon: "flag" },
];

function StepIcon({ icon }: { icon: StepDef["icon"] }) {
  const c = "h-5 w-5";
  switch (icon) {
    case "lock":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm-3 8V7a3 3 0 016 0v3H9z" />
        </svg>
      );
    case "clock":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <path d="M12 7v5l3 2" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "check":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" />
        </svg>
      );
    case "hand":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path
            d="M7 11V8a2 2 0 012-2h6l3 3v5a2 2 0 01-2 2h-2M7 11h6m-6 0v5a2 2 0 002 2h1"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "flag":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path d="M5 21V4m0 0l14 4-14 4" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            strokeWidth="2"
          />
        </svg>
      );
  }
}

function stepMeta(status: string): {
  /** step indices that are fully completed (green) */
  doneIdx: number;
  /** highlighted step index */
  activeIdx: number;
  variant: "flow" | "dispute" | "cancelled" | "refunded";
} {
  switch (status) {
    case "awaiting_payment":
      return { doneIdx: 1, activeIdx: 2, variant: "flow" };
    case "paid":
      return { doneIdx: 3, activeIdx: 4, variant: "flow" };
    case "disputed":
      return { doneIdx: 3, activeIdx: 4, variant: "dispute" };
    case "released":
      return { doneIdx: 5, activeIdx: 5, variant: "flow" };
    case "refunded":
      return { doneIdx: 5, activeIdx: 5, variant: "refunded" };
    case "cancelled":
    case "expired":
      return { doneIdx: 1, activeIdx: 2, variant: "cancelled" };
    default:
      return { doneIdx: 0, activeIdx: 0, variant: "flow" };
  }
}

export function P2pOrderTimeline({ status }: { status: string }) {
  const { t } = useI18n();
  const { doneIdx, activeIdx, variant } = stepMeta(status);

  return (
    <section
      className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900"
      aria-label={t("p2p_timeline_aria")}
    >
      <h2 className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
        {t("p2p_timeline_title")}
      </h2>
      <ol className="relative mt-4">
        {STEP_DEFS.map((def, i) => {
          const isLast = i === STEP_DEFS.length - 1;
          const isDone = i <= doneIdx && variant !== "cancelled";
          const isActive = i === activeIdx && status !== "released" && status !== "refunded";
          const cancelledStale = variant === "cancelled" && i >= 2;

          let dotClass =
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-stone-400 border-stone-200 bg-white dark:border-stone-600 dark:bg-stone-900";
          if (cancelledStale) {
            dotClass =
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-stone-200 bg-stone-50 text-stone-300 line-through dark:border-stone-700 dark:bg-stone-800";
          } else if (isDone) {
            dotClass =
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-950/50 dark:text-emerald-300";
          }
          if (isActive && variant === "dispute") {
            dotClass =
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-400/50 dark:bg-rose-950/40 dark:text-rose-200";
          } else if (isActive && variant === "flow") {
            dotClass +=
              " ring-2 ring-emerald-400/60 ring-offset-2 ring-offset-white dark:ring-offset-stone-900";
          }
          if (variant === "refunded" && i === 5 && status === "refunded") {
            dotClass =
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-violet-500 bg-violet-50 text-violet-800 dark:border-violet-400 dark:bg-violet-950/40 dark:text-violet-200";
          }

          const lineClass =
            !isLast && !cancelledStale && i < doneIdx
              ? "bg-emerald-400"
              : !isLast && cancelledStale
                ? "bg-stone-200 dark:bg-stone-700"
                : "bg-stone-200 dark:bg-stone-700";

          let subtitle = "";
          if (variant === "cancelled" && i === 2) subtitle = ` — ${t("p2p_step_cancelled_hint")}`;
          if (variant === "dispute" && i === 4) subtitle = ` — ${t("p2p_step_dispute_hint")}`;
          if (variant === "refunded" && i === 5) subtitle = ` (${t("p2p_order_status_refunded")})`;

          return (
            <li key={def.key} className="relative flex gap-3 pb-8 last:pb-0">
              {!isLast ? (
                <span
                  className={`absolute left-[19px] top-10 block w-0.5 ${lineClass}`}
                  style={{ height: "calc(100% - 0.5rem)" }}
                  aria-hidden
                />
              ) : null}
              <div className={dotClass}>
                <StepIcon icon={def.icon} />
              </div>
              <div className="min-w-0 pt-1.5">
                <p
                  className={`text-sm font-semibold leading-snug ${
                    isActive ? "text-emerald-900 dark:text-emerald-100" : "text-stone-800 dark:text-stone-200"
                  } ${cancelledStale ? "opacity-50" : ""}`}
                >
                  {t(def.key)}
                  {subtitle ? (
                    <span className="font-normal text-stone-600 dark:text-stone-400">{subtitle}</span>
                  ) : null}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

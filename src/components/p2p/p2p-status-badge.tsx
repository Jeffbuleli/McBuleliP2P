"use client";

import type { Messages } from "@/i18n/messages";

export function p2pStatusLabelKey(status: string): keyof Messages {
  const m: Record<string, keyof Messages> = {
    awaiting_payment: "p2p_order_status_awaiting_payment",
    paid: "p2p_order_status_paid",
    disputed: "p2p_order_status_disputed",
    released: "p2p_order_status_released",
    cancelled: "p2p_order_status_cancelled",
    expired: "p2p_order_status_expired",
    refunded: "p2p_order_status_refunded",
  };
  return m[status] ?? "p2p_order_status_awaiting_payment";
}

export function p2pStatusBadgeClasses(status: string): string {
  switch (status) {
    case "awaiting_payment":
      return "bg-amber-100 text-amber-950 ring-amber-400/40 dark:bg-amber-950/60 dark:text-amber-100 dark:ring-amber-600/40";
    case "paid":
      return "bg-sky-100 text-sky-950 ring-sky-400/40 dark:bg-sky-950/60 dark:text-sky-100 dark:ring-sky-600/40";
    case "released":
      return "bg-emerald-100 text-emerald-950 ring-emerald-400/40 dark:bg-emerald-950/60 dark:text-emerald-100 dark:ring-emerald-600/40";
    case "cancelled":
    case "expired":
      return "bg-stone-200 text-stone-800 ring-stone-400/30 dark:bg-stone-700 dark:text-stone-100 dark:ring-stone-500/30";
    case "disputed":
      return "bg-rose-100 text-rose-950 ring-rose-400/40 dark:bg-rose-950/60 dark:text-rose-100 dark:ring-rose-600/40";
    case "refunded":
      return "bg-violet-100 text-violet-950 ring-violet-400/40 dark:bg-violet-950/50 dark:text-violet-100 dark:ring-violet-600/40";
    default:
      return "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200";
  }
}

export function P2pStatusIcon({ status }: { status: string }) {
  const common = "h-4 w-4 shrink-0";
  switch (status) {
    case "awaiting_payment":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "paid":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3v3M6 9h12M5 21h14a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      );
    case "released":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "disputed":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
  }
}

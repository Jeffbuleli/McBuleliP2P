"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Messages } from "@/i18n/messages";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";

type PiPayStatus = "INITIATED" | "APPROVED" | "COMPLETED" | "FAILED" | "CANCELLED";

export function PiPaymentStatusClient({
  paymentId,
  dict,
}: {
  paymentId: string;
  dict: Messages;
}) {
  const [status, setStatus] = useState<PiPayStatus>("INITIATED");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const done = status === "COMPLETED" || status === "FAILED" || status === "CANCELLED";

  const statusLabel = useMemo(() => {
    switch (status) {
      case "APPROVED":
        return dict.pi_status_approved;
      case "COMPLETED":
        return dict.pi_status_completed;
      case "FAILED":
        return dict.pi_status_failed;
      case "CANCELLED":
        return dict.pi_status_cancelled;
      default:
        return dict.pi_status_initiated;
    }
  }, [dict, status]);

  async function refresh() {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetchWithDeadline(
        `/api/payments/pi/status/${encodeURIComponent(paymentId)}`,
        { cache: "no-store" },
        20_000,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(
          typeof data === "object" &&
            data !== null &&
            "message" in data &&
            typeof (data as { message: unknown }).message === "string"
            ? (data as { message: string }).message
            : "refresh_failed",
        );
        return;
      }
      const st =
        typeof data === "object" && data !== null && "status" in data
          ? (data as { status?: PiPayStatus }).status
          : null;
      if (st) setStatus(st);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  useEffect(() => {
    if (done) return;
    const t = window.setInterval(() => {
      void refresh();
    }, 3000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, paymentId]);

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-10 pt-1">
      <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">
        {dict.pi_status_title}
      </h1>
      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
        <p className="text-sm text-stone-600 dark:text-stone-400">{dict.pi_status_id_label}</p>
        <p className="mt-1 break-all font-mono text-xs text-stone-900 dark:text-stone-50">
          {paymentId}
        </p>
        <p className="mt-3 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
          {statusLabel}
        </p>
        {err ? (
          <p className="mt-2 rounded-xl border border-rose-900/40 bg-rose-950/35 px-3 py-2 text-xs text-rose-50">
            {err}
          </p>
        ) : null}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void refresh()}
            className="min-h-[44px] flex-1 rounded-xl border border-stone-300 bg-white text-sm font-semibold text-stone-900 disabled:opacity-60 dark:border-stone-700 dark:bg-stone-950/40 dark:text-stone-50"
          >
            {busy ? dict.pi_status_refreshing : dict.pi_status_refresh}
          </button>
          <Link
            href="/app/profile"
            className="min-h-[44px] flex-1 rounded-xl border border-emerald-700/40 bg-emerald-950/30 text-center text-sm font-semibold text-emerald-200 leading-[44px]"
          >
            {dict.pi_status_back}
          </Link>
        </div>
      </div>
    </div>
  );
}


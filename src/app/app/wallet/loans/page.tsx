"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import { clientErrorText } from "@/lib/client-error-text";

type Snapshot =
  | {
      ok: true;
      asset: "USDT";
      poolPrincipalUsdt: number;
      poolEligibleUsdt: number;
      ltv: number;
      borrowLimitUsdt: number;
      outstandingUsdt: number;
      openLoanId: string | null;
      openAprAnnual: number | null;
      loansNewEnabled?: boolean;
    }
  | { ok: false; message: string };

type LoanRow = {
  id: string;
  principalUsdt: number;
  outstandingUsdt: number;
  aprAnnual: number;
  createdAt: string;
};

function fmt(n: number) {
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
}

export default function WalletLoansPage() {
  const { t, locale } = useI18n();

  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [rows, setRows] = useState<LoanRow[]>([]);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>("");

  async function refresh() {
    setErr("");
    const [s, l] = await Promise.all([
      fetch("/api/loans/snapshot", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/loans/list", { cache: "no-store" }).then((r) => r.json()),
    ]);
    setSnap(s);
    setRows(l?.ok ? (l.loans as LoanRow[]) : []);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const limit = snap && snap.ok ? snap.borrowLimitUsdt : 0;
  const outstanding = snap && snap.ok ? snap.outstandingUsdt : 0;
  const openLoanId = snap && snap.ok ? snap.openLoanId : null;

  const loansNewEnabled = snap && snap.ok ? snap.loansNewEnabled !== false : false;
  const canBorrow = loansNewEnabled && (snap?.ok ?? false) && !openLoanId && limit > 0;
  const canRepay = (snap?.ok ?? false) && !!openLoanId && outstanding > 0;

  async function onBorrow() {
    if (!canBorrow) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/loans/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsdt: amount }),
      }).then((r) => r.json());
      if (!res?.ok) {
        setErr(clientErrorText(t, res?.message ?? "loan_apply_failed"));
        return;
      }
      setAmount("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function onRepay() {
    if (!canRepay || !openLoanId) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/loans/repay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId: openLoanId, amountUsdt: amount }),
      }).then((r) => r.json());
      if (!res?.ok) {
        setErr(clientErrorText(t, res?.message ?? "loan_repay_failed"));
        return;
      }
      setAmount("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pb-10">
      <WalletSubpageHeader title={t("loans_page_title")} subtitle={t("loans_note")} />

      {snap?.ok && snap.loansNewEnabled === false ? (
        <div className="mt-3 rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 dark:border-amber-800/40 dark:bg-amber-950/30">
          <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">{t("loan_new_disabled_title")}</p>
          <p className="mt-1 text-xs text-amber-900/90 dark:text-amber-100/90">{t("loan_new_disabled_body")}</p>
        </div>
      ) : null}

      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="fd-card p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            {t("loans_kpi_limit")}
          </p>
          <p className="mt-1 text-base font-bold tabular-nums text-emerald-950 dark:text-emerald-100">
            {snap && snap.ok ? `${fmt(limit)} USDT` : "—"}
          </p>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-500">
            {snap && snap.ok ? `LTV ${Math.round(snap.ltv * 100)}%` : ""}
          </p>
        </div>
        <div className="fd-card p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            {t("loans_kpi_outstanding")}
          </p>
          <p className="mt-1 text-base font-bold tabular-nums text-amber-950 dark:text-amber-100">
            {snap && snap.ok ? `${fmt(outstanding)} USDT` : "—"}
          </p>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-500">
            {snap && snap.ok && snap.openAprAnnual != null
              ? `APR ${Math.round(snap.openAprAnnual * 100)}%`
              : ""}
          </p>
        </div>
      </div>

      <div className="fd-card mt-3 p-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-stone-800 dark:text-stone-200">
          {t("loans_form_amount")}
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0"
            className="rounded-2xl border border-stone-200 bg-white px-3 py-3 text-base outline-none ring-emerald-700/30 focus:ring-2 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-50"
          />
        </label>

        {err ? (
          <p className="mt-2 text-xs font-semibold text-rose-700 dark:text-rose-300">{err}</p>
        ) : null}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onBorrow}
            disabled={!canBorrow || busy}
            className="min-h-[48px] rounded-2xl bg-emerald-700 px-3 text-sm font-bold text-white shadow-sm disabled:opacity-40 dark:bg-emerald-600"
          >
            {t("loans_apply_btn")}
          </button>
          <button
            type="button"
            onClick={onRepay}
            disabled={!canRepay || busy}
            className="min-h-[48px] rounded-2xl border border-amber-800/25 bg-amber-50 px-3 text-sm font-bold text-amber-950 shadow-sm disabled:opacity-40 dark:border-amber-700/30 dark:bg-amber-950/30 dark:text-amber-100"
          >
            {t("loans_repay_btn")}
          </button>
        </div>

        {snap && snap.ok && !snap.poolPrincipalUsdt ? (
          <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">{t("loans_none")}</p>
        ) : null}
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          {t("loans_open_loan")}
        </p>
        <div className="mt-2 overflow-hidden rounded-2xl border border-stone-200 bg-white/90 dark:border-stone-700 dark:bg-stone-900/90">
          {rows.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-stone-500 dark:text-stone-400">
              {t("loans_none")}
            </div>
          ) : (
            <ul className="divide-y divide-stone-100 dark:divide-stone-800">
              {rows.map((r) => (
                <li key={r.id} className="px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                        {fmt(r.outstandingUsdt)} USDT
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                        {new Date(r.createdAt).toLocaleDateString()} · APR{" "}
                        {Math.round(r.aprAnnual * 100)}%
                      </p>
                    </div>
                    <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                      {fmt(r.principalUsdt)} USDT
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}


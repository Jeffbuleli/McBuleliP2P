"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";

type PositionRow = {
  id: string;
  amount: string;
  lockMonths: number;
  sizeTier: string;
  lockTier: string;
  shares: string;
  startedAt: string;
  endsAt: string;
  status: string;
  rewardsAvailableUsdt: string;
  rewardsEarnedUsdt: string;
  nextPayoutAt: string | null;
};

type Snapshot = {
  positions: PositionRow[];
  balance: { availableUsdt: number; totalEarnedUsdt: number };
  today: { dayStartAt: string; dayEndAt: string; accruedUsdt: number };
};

type Estimate = {
  dailyEstimateUsdt: { avg7d: number; avg30d: number };
  totalAtMaturityUsdt: { avg7d: number; avg30d: number };
};

function fmt(n: number, locale: string) {
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  return n.toLocaleString(loc, { maximumFractionDigits: 8 });
}

function safeWindowTs(v: string): string {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 16).replace("T", " ");
}

function nextPayoutDateUtc(now: Date): Date {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const h = now.getUTCHours();
  const cutoffReached = h >= 1;
  const lastDay = new Date(Date.UTC(y, m + 1, 0, 1, 0, 0, 0));

  const payout15 = new Date(Date.UTC(y, m, 15, 1, 0, 0, 0));
  if (d < 15 || (d === 15 && !cutoffReached)) return payout15;
  if (d === 15 && cutoffReached) return lastDay;
  if (d < lastDay.getUTCDate() || (d === lastDay.getUTCDate() && !cutoffReached)) {
    return lastDay;
  }
  // Next month 15th
  return new Date(Date.UTC(y, m + 1, 15, 1, 0, 0, 0));
}

function isPayoutWindowNowUtc(now: Date): boolean {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const h = now.getUTCHours();
  if (h < 1) return false;
  if (d === 15) return true;
  const lastDay = new Date(Date.UTC(y, m + 1, 0, 1, 0, 0, 0)).getUTCDate();
  return d === lastDay;
}

export default function WalletPoolPage() {
  const { t, locale } = useI18n();
  const [data, setData] = useState<Snapshot | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);

  const [amountUsdt, setAmountUsdt] = useState("");
  const [lockMonths, setLockMonths] = useState<1 | 3 | 6>(1);

  async function refresh() {
    setErr(null);
    const res = await fetch("/api/pool/positions", { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(j.message ?? "…");
      setData({ positions: [], balance: { availableUsdt: 0, totalEarnedUsdt: 0 }, today: { dayStartAt: "", dayEndAt: "", accruedUsdt: 0 } });
      return;
    }
    setData(j as Snapshot);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const payoutDate = useMemo(() => nextPayoutDateUtc(new Date()), []);
  const payoutOpenNow = useMemo(() => isPayoutWindowNowUtc(new Date()), []);

  const parsedAmount = useMemo(() => {
    const s = amountUsdt.trim().replace(",", ".");
    if (!s) return { ok: false as const, value: 0, kind: "empty" as const };
    const v = Number(s);
    if (!Number.isFinite(v) || v <= 0) return { ok: false as const, value: 0, kind: "format" as const };
    if (v + 1e-12 < 50) return { ok: false as const, value: v, kind: "min" as const };
    return { ok: true as const, value: v, kind: "ok" as const };
  }, [amountUsdt]);

  const presets = [50, 100, 500, 1000, 2000] as const;

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!parsedAmount.ok) {
        setEstimate(null);
        return;
      }
      const sp = new URLSearchParams();
      sp.set("amountUsdt", String(parsedAmount.value));
      sp.set("lockMonths", String(lockMonths));
      const res = await fetch(`/api/pool/estimate?${sp.toString()}`, { cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (!res.ok) {
        setEstimate(null);
        return;
      }
      setEstimate(j as Estimate);
    };
    const id = window.setTimeout(() => void run(), 250);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [parsedAmount.ok, parsedAmount.value, lockMonths]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedAmount.ok) {
      setErr(
        parsedAmount.kind === "format"
          ? t("pool_amount_invalid_format")
          : t("pool_amount_invalid"),
      );
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/pool/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsdt, lockMonths }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j.message ?? "…");
        return;
      }
      setAmountUsdt("");
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const onWithdraw = async (positionId: string) => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/pool/rewards/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j.message ?? t("pool_withdraw_blocked"));
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-[color:var(--mb-text)] dark:text-stone-50">
              {t("pool_title")}
            </h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                payoutOpenNow
                  ? "border border-emerald-700/25 bg-emerald-50 text-emerald-900 dark:border-emerald-600/30 dark:bg-emerald-950/40 dark:text-emerald-200"
                  : "border border-stone-200 bg-stone-50 text-stone-700 dark:border-stone-700 dark:bg-stone-800/40 dark:text-stone-200"
              }`}
            >
              {payoutOpenNow ? t("pool_withdraw_open_badge") : t("pool_withdraw_closed_badge")}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[color:var(--mb-muted)] dark:text-stone-400">
            {t("pool_tagline")}
          </p>
        </div>
        <Link
          href="/app/wallet"
          className="shrink-0 rounded-xl border border-emerald-800/15 bg-white px-3 py-2 text-xs font-bold text-emerald-800 shadow-sm active:scale-95 dark:border-emerald-600/25 dark:bg-stone-800 dark:text-emerald-300"
        >
          ← {t("nav_wallet")}
        </Link>
      </div>

      {err ? (
        <p className="mt-3 rounded-2xl border border-rose-900/20 bg-rose-50/80 px-3 py-2 text-sm text-rose-900 dark:border-rose-700/30 dark:bg-rose-950/30 dark:text-rose-100">
          {err}
        </p>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-800/20 bg-gradient-to-br from-emerald-50/95 to-white p-4 shadow-sm ring-1 ring-emerald-900/10 dark:border-emerald-700/30 dark:from-emerald-950/40 dark:to-stone-900/80 dark:ring-emerald-500/10">
          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
            {t("pool_rewards_available")}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-950 dark:text-emerald-100">
            {data ? fmt(data.balance.availableUsdt, locale) : "…"} USDT
          </p>
          <p className="mt-2 text-[11px] text-stone-600 dark:text-stone-400">
            {t("pool_withdraw_blocked")}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-sm ring-1 ring-stone-900/[0.04] dark:border-stone-700 dark:bg-stone-900/90 dark:ring-white/[0.06]">
          <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            {t("pool_rewards_today")}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-stone-900 dark:text-stone-100">
            {data ? fmt(data.today.accruedUsdt, locale) : "…"} USDT
          </p>
          <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-2 text-xs text-stone-700 dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-200">
            <p className="font-semibold text-stone-500 dark:text-stone-400">{t("pool_rewards_window")}</p>
            <p className="mt-1 font-mono text-[11px] text-stone-600 dark:text-stone-300">
              {data ? safeWindowTs(data.today.dayStartAt) : "…"} →{" "}
              {data ? safeWindowTs(data.today.dayEndAt) : "…"} (UTC)
            </p>
          </div>
          <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
            {t("pool_next_payout")}:{" "}
            <span className="font-semibold text-stone-700 dark:text-stone-200">
              {payoutDate.toISOString().slice(0, 10)}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-stone-200 bg-white/90 p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900/90">
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50">{t("pool_create_title")}</h2>
        <form onSubmit={onCreate} className="mt-3 grid gap-2">
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">
              {t("pool_amount_label")}
            </span>
            <input
              value={amountUsdt}
              onChange={(e) => setAmountUsdt(e.target.value)}
              inputMode="decimal"
              placeholder={t("pool_amount_hint")}
              className={`rounded-2xl border bg-white px-3 py-3 text-sm font-semibold text-stone-900 outline-none ring-emerald-700/30 focus:ring-2 dark:bg-stone-950 dark:text-stone-100 ${
                !amountUsdt.trim() || parsedAmount.ok
                  ? "border-stone-200 dark:border-stone-700"
                  : "border-rose-400/80 dark:border-rose-700/60"
              }`}
            />
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                {t("pool_amount_presets")}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmountUsdt(String(p))}
                    className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-bold text-stone-700 shadow-sm active:scale-95 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            {!amountUsdt.trim() ? null : parsedAmount.ok ? null : (
              <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-200">
                {parsedAmount.kind === "format"
                  ? t("pool_amount_invalid_format")
                  : t("pool_amount_invalid")}
              </p>
            )}
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">
              {t("pool_lock_label")}
            </span>
            <select
              value={lockMonths}
              onChange={(e) => setLockMonths(Number(e.target.value) as 1 | 3 | 6)}
              className="rounded-2xl border border-stone-200 bg-white px-3 py-3 text-sm font-semibold text-stone-900 outline-none ring-emerald-700/30 focus:ring-2 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
            >
              <option value={1}>{t("pool_lock_1m")}</option>
              <option value={3}>{t("pool_lock_3m")}</option>
              <option value={6}>{t("pool_lock_6m")}</option>
            </select>
          </label>

          {estimate ? (
            <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3 text-xs text-stone-700 dark:border-stone-700 dark:bg-stone-800/40 dark:text-stone-200">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                    {t("pool_estimate_title")}
                  </p>
                  <p className="mt-1 text-[11px] text-stone-600 dark:text-stone-400">
                    {t("pool_estimate_hint")}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-stone-200 bg-white/80 p-2 dark:border-stone-700 dark:bg-stone-900/60">
                  <p className="text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400">
                    {t("pool_estimate_daily")}
                  </p>
                  <p className="mt-1 font-mono text-[12px] font-semibold tabular-nums">
                    {t("pool_estimate_avg7")}: {fmt(estimate.dailyEstimateUsdt.avg7d, locale)} USDT
                  </p>
                  <p className="mt-1 font-mono text-[12px] font-semibold tabular-nums">
                    {t("pool_estimate_avg30")}: {fmt(estimate.dailyEstimateUsdt.avg30d, locale)} USDT
                  </p>
                </div>
                <div className="rounded-xl border border-stone-200 bg-white/80 p-2 dark:border-stone-700 dark:bg-stone-900/60">
                  <p className="text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400">
                    {t("pool_estimate_maturity")}
                  </p>
                  <p className="mt-1 font-mono text-[12px] font-semibold tabular-nums">
                    {t("pool_estimate_avg7")}: {fmt(estimate.totalAtMaturityUsdt.avg7d, locale)} USDT
                  </p>
                  <p className="mt-1 font-mono text-[12px] font-semibold tabular-nums">
                    {t("pool_estimate_avg30")}: {fmt(estimate.totalAtMaturityUsdt.avg30d, locale)} USDT
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy || !parsedAmount.ok}
            className="mt-1 min-h-[48px] rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-900/20 disabled:opacity-60 active:scale-[0.99] dark:bg-emerald-600"
          >
            {busy ? "…" : t("pool_create_btn")}
          </button>
        </form>
      </div>

      <div className="mt-4 rounded-3xl border border-stone-200 bg-white/90 p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900/90">
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50">{t("pool_positions_title")}</h2>

        {!data ? (
          <p className="mt-3 text-sm text-stone-500">…</p>
        ) : data.positions.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">—</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.positions.map((p) => {
              const active = p.status === "active";
              const ends = new Date(p.endsAt);
              const nextPayout = p.nextPayoutAt ? new Date(p.nextPayoutAt) : null;
              const canWithdraw =
                nextPayout != null &&
                new Date().getUTCHours() >= 1 &&
                Date.now() >= nextPayout.getTime() &&
                Number(p.rewardsAvailableUsdt) > 0;
              return (
                <li key={p.id} className="rounded-2xl border border-stone-200 bg-stone-50/70 p-3 dark:border-stone-700 dark:bg-stone-800/40">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-stone-900 dark:text-stone-50">
                        {p.amount} USDT · {p.lockMonths}m
                      </p>
                      <p className="mt-1 text-[11px] text-stone-600 dark:text-stone-300">
                        {active ? t("pool_position_active") : t("pool_position_ended")} ·{" "}
                        {t("pool_unlocks_at")}:{" "}
                        <span className="font-mono">{ends.toISOString().slice(0, 10)}</span>
                      </p>
                      <p className="mt-2 text-[11px] text-stone-600 dark:text-stone-300">
                        {t("pool_rewards_available")}:{" "}
                        <span className="font-mono font-semibold">{p.rewardsAvailableUsdt}</span> USDT ·{" "}
                        {t("pool_next_payout")}:{" "}
                        <span className="font-mono">
                          {nextPayout ? nextPayout.toISOString().slice(0, 10) : "—"}
                        </span>
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      active ? "bg-emerald-700 text-white dark:bg-emerald-600" : "bg-stone-300 text-stone-900 dark:bg-stone-700 dark:text-stone-100"
                    }`}>
                      {p.sizeTier.toUpperCase()} · {p.lockTier.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onWithdraw(p.id)}
                      disabled={busy || !canWithdraw}
                      className="rounded-xl bg-emerald-700 px-3 py-2 text-[12px] font-bold text-white shadow-sm disabled:opacity-60 active:scale-95 dark:bg-emerald-600"
                    >
                      {t("pool_withdraw_rewards")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}


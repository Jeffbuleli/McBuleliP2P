"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  TRADE_FEE_RATE,
  TRADE_LEVERAGES,
  TRADE_MIN_MARGIN_USDT,
  TRADE_SYMBOLS,
  tradeMaxMarginUsdt,
} from "@/lib/trade-config";
import {
  feeOnNotional,
  liquidationPrice,
  notionalUsdt,
  positionQtyBase,
  unrealizedPnlUsdt,
} from "@/lib/trade-math";
import type { TradeTf } from "@/components/trade/trade-mini-chart";

const TradeMiniChart = dynamic(
  () =>
    import("@/components/trade/trade-mini-chart").then((m) => m.TradeMiniChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-800" />
    ),
  },
);

type PositionRow = {
  id: string;
  symbol: string;
  side: string;
  leverage: number;
  marginUsdt: string;
  entryPrice: string;
  liquidationPrice: string;
  unrealizedPnlUsdt: number;
  markPrice: number;
};

export function FuturesTradingClient() {
  const { t } = useI18n();
  const [symbol, setSymbol] = useState<(typeof TRADE_SYMBOLS)[number]>("BTCUSDT");
  const [tf, setTf] = useState<TradeTf>("1h");
  const [ticker, setTicker] = useState<{
    lastPrice: number;
    changePct24h: number;
  } | null>(null);
  const [side, setSide] = useState<"long" | "short">("long");
  const [leverage, setLeverage] = useState<2 | 5 | 10>(5);
  const [marginStr, setMarginStr] = useState("50");
  const [stopStr, setStopStr] = useState("");
  const [usdtBal, setUsdtBal] = useState<number | null>(null);
  const [maxLev, setMaxLev] = useState(10);
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const margin = Number(marginStr.replace(",", "."));
  const stopLoss =
    stopStr.trim() === "" ? null : Number(stopStr.replace(",", "."));

  const mark = ticker?.lastPrice ?? 0;

  const preview = useMemo(() => {
    if (!Number.isFinite(margin) || margin <= 0 || !Number.isFinite(mark) || mark <= 0) {
      return null;
    }
    const lev = leverage;
    const liq = liquidationPrice({
      entry: mark,
      side,
      leverage: lev,
    });
    const notional = notionalUsdt(margin, lev);
    const feeOpen = feeOnNotional(notional);
    const qty = positionQtyBase(margin, lev, mark);
    const up1 = unrealizedPnlUsdt({
      side,
      qtyBase: qty,
      entry: mark,
      mark: mark * 1.01,
    });
    const down1 = unrealizedPnlUsdt({
      side,
      qtyBase: qty,
      entry: mark,
      mark: mark * 0.99,
    });
    return { liq, feeOpen, notional, qty, up1, down1 };
  }, [margin, mark, side, leverage]);

  const pollTicker = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/trade/ticker?symbol=${encodeURIComponent(symbol)}`,
        { cache: "no-store" },
      );
      const j = (await res.json()) as {
        lastPrice: number;
        changePct24h: number;
      };
      if (res.ok) setTicker(j);
    } catch {
      /* ignore */
    }
  }, [symbol]);

  const pollPositions = useCallback(async () => {
    try {
      const res = await fetch("/api/trade/futures/positions", {
        cache: "no-store",
      });
      const j = (await res.json()) as {
        positions: PositionRow[];
        maxLeverage: number;
      };
      if (res.ok) {
        setPositions(j.positions ?? []);
        setMaxLev(j.maxLeverage ?? 10);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (leverage > maxLev) {
      setLeverage((maxLev >= 5 ? 5 : 2) as 2 | 5 | 10);
    }
  }, [maxLev, leverage]);

  const pollWallet = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet/summary", { cache: "no-store" });
      const j = (await res.json()) as {
        lines?: { asset: string; balanceNum: number }[];
      };
      if (!res.ok) return;
      const usdt = j.lines?.find((l) => l.asset === "USDT")?.balanceNum;
      if (typeof usdt === "number") setUsdtBal(usdt);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void pollTicker();
    const id = window.setInterval(() => void pollTicker(), 5000);
    return () => window.clearInterval(id);
  }, [pollTicker]);

  useEffect(() => {
    void pollPositions();
    const id = window.setInterval(() => void pollPositions(), 8000);
    return () => window.clearInterval(id);
  }, [pollPositions]);

  useEffect(() => {
    void pollWallet();
  }, [pollWallet]);

  async function submitOpen() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/trade/futures/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          side,
          leverage,
          marginUsdt: margin,
          stopLossPrice:
            stopLoss != null && Number.isFinite(stopLoss) ? stopLoss : null,
        }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMsg(j.error ?? "error");
        return;
      }
      setConfirmOpen(false);
      setMarginStr("50");
      setStopStr("");
      await pollPositions();
      await pollWallet();
    } finally {
      setBusy(false);
    }
  }

  async function submitClose(id: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/trade/futures/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionId: id }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) setMsg(j.error ?? "error");
      await pollPositions();
      await pollWallet();
    } finally {
      setBusy(false);
    }
  }

  const changeStr =
    ticker != null
      ? `${ticker.changePct24h >= 0 ? "+" : ""}${ticker.changePct24h.toFixed(2)}%`
      : "—";

  return (
    <div className="space-y-4 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-stone-600 dark:text-stone-400">
          {t("trade_ui_pair")}
          <select
            value={symbol}
            onChange={(e) =>
              setSymbol(e.target.value as (typeof TRADE_SYMBOLS)[number])
            }
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-50"
          >
            {TRADE_SYMBOLS.map((s) => (
              <option key={s} value={s}>
                {s.replace("USDT", "")}/USDT
              </option>
            ))}
          </select>
        </label>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase text-stone-500">
            {t("trade_ui_live")}
          </p>
          <p className="font-mono text-lg font-bold tabular-nums text-stone-900 dark:text-stone-50">
            {mark > 0 ? mark.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
          </p>
          <p
            className={`text-xs font-semibold tabular-nums ${
              (ticker?.changePct24h ?? 0) >= 0
                ? "text-emerald-600"
                : "text-rose-600"
            }`}
          >
            24h {changeStr}
          </p>
        </div>
      </div>

      <TradeMiniChart symbol={symbol} tf={tf} onTfChange={setTf} />

      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
        <p className="mb-2 text-xs font-semibold text-stone-500">
          {t("trade_ui_usdt_balance")}:{" "}
          <span className="text-stone-900 dark:text-stone-100">
            {usdtBal != null
              ? usdtBal.toLocaleString(undefined, { maximumFractionDigits: 2 })
              : "—"}
          </span>
        </p>
        {maxLev < 10 && (
          <p className="mb-3 rounded-lg bg-amber-50 px-2 py-1.5 text-[11px] text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
            {t("trade_ui_beginner_cap").replace("{max}", String(maxLev))}
          </p>
        )}

        <div className="mb-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSide("long")}
            className={`rounded-xl py-3 text-sm font-bold ${
              side === "long"
                ? "bg-emerald-600 text-white"
                : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
            }`}
          >
            {t("trade_ui_long")}
          </button>
          <button
            type="button"
            onClick={() => setSide("short")}
            className={`rounded-xl py-3 text-sm font-bold ${
              side === "short"
                ? "bg-rose-600 text-white"
                : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
            }`}
          >
            {t("trade_ui_short")}
          </button>
        </div>

        <p className="mb-1 text-xs font-semibold text-stone-600 dark:text-stone-400">
          {t("trade_ui_leverage")}
        </p>
        <div className="mb-3 flex gap-2">
          {TRADE_LEVERAGES.map((lv) => (
            <button
              key={lv}
              type="button"
              disabled={lv > maxLev}
              onClick={() => setLeverage(lv)}
              className={`flex-1 rounded-xl py-2 text-xs font-bold disabled:opacity-40 ${
                leverage === lv
                  ? "bg-emerald-600 text-white"
                  : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
              }`}
            >
              {lv}×
            </button>
          ))}
        </div>

        <label className="mb-2 block text-xs font-semibold text-stone-600 dark:text-stone-400">
          {t("trade_ui_margin")}
          <input
            type="text"
            inputMode="decimal"
            value={marginStr}
            onChange={(e) => setMarginStr(e.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 font-mono text-sm dark:border-stone-600 dark:bg-stone-950"
          />
        </label>

        <label className="mb-3 block text-xs font-semibold text-stone-600 dark:text-stone-400">
          {t("trade_ui_stop_loss")}
          <input
            type="text"
            inputMode="decimal"
            placeholder="—"
            value={stopStr}
            onChange={(e) => setStopStr(e.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 font-mono text-sm dark:border-stone-600 dark:bg-stone-950"
          />
        </label>

        {preview && (
          <div className="mb-3 space-y-1 rounded-xl bg-stone-50 p-3 text-xs dark:bg-stone-950">
            <div className="flex justify-between gap-2">
              <span className="text-stone-500">{t("trade_ui_notional")}</span>
              <span className="font-mono tabular-nums">
                {preview.notional.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}{" "}
                USDT
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-stone-500">{t("trade_ui_est_liq")}</span>
              <span className="font-mono tabular-nums text-rose-600">
                {preview.liq.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-stone-500">{t("trade_ui_est_open_fee")}</span>
              <span className="font-mono tabular-nums">
                {preview.feeOpen.toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })}{" "}
                USDT
              </span>
            </div>
            <p className="pt-1 text-[10px] text-stone-500">
              ±1% move →{" "}
              <span className="text-emerald-600 tabular-nums">
                {preview.up1.toFixed(2)}
              </span>{" "}
              /{" "}
              <span className="text-rose-600 tabular-nums">
                {preview.down1.toFixed(2)}
              </span>{" "}
              USDT (excl. fees)
            </p>
          </div>
        )}

        <p className="mb-2 text-[11px] leading-snug text-stone-500">
          {t("trade_ui_min_max_margin")
            .replace("{min}", String(TRADE_MIN_MARGIN_USDT))
            .replace("{max}", String(tradeMaxMarginUsdt()))}{" "}
          · {TRADE_FEE_RATE * 100}% {t("trade_ui_fee_notional")}
        </p>

        {msg && (
          <p className="mb-2 rounded-lg bg-rose-50 px-2 py-1.5 text-xs text-rose-800 dark:bg-rose-950/50 dark:text-rose-200">
            {msg}
          </p>
        )}

        <button
          type="button"
          disabled={
            busy ||
            !Number.isFinite(margin) ||
            margin < TRADE_MIN_MARGIN_USDT ||
            margin > tradeMaxMarginUsdt()
          }
          onClick={() => setConfirmOpen(true)}
          className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-50"
        >
          {t("trade_ui_place_order")}
        </button>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold text-stone-900 dark:text-stone-50">
          {t("trade_ui_positions")}
        </h3>
        {positions.length === 0 ? (
          <p className="text-sm text-stone-500">{t("trade_ui_no_positions")}</p>
        ) : (
          <ul className="space-y-2">
            {positions.map((p) => (
              <li
                key={p.id}
                className="rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-700 dark:bg-stone-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">
                      {p.symbol.replace("USDT", "")}/USDT ·{" "}
                      <span
                        className={
                          p.side === "long"
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }
                      >
                        {p.side.toUpperCase()}
                      </span>{" "}
                      {p.leverage}×
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-stone-600 dark:text-stone-400">
                      Entry {Number(p.entryPrice).toFixed(2)} · Liq{" "}
                      {Number(p.liquidationPrice).toFixed(2)} · Mark{" "}
                      {p.markPrice.toFixed(2)}
                    </p>
                    <p
                      className={`mt-1 text-sm font-semibold tabular-nums ${
                        p.unrealizedPnlUsdt >= 0
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      uPnL {p.unrealizedPnlUsdt >= 0 ? "+" : ""}
                      {p.unrealizedPnlUsdt.toFixed(2)} USDT
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void submitClose(p.id)}
                    className="shrink-0 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold dark:border-stone-600"
                  >
                    {t("trade_ui_close")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-center">
        <Link
          href="/app/trade/futures/guide"
          className="text-xs font-semibold text-emerald-700 underline dark:text-emerald-400"
        >
          {t("trade_ui_learn_futures")}
        </Link>
      </p>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-stone-900">
            <h4 className="text-lg font-bold text-stone-900 dark:text-stone-50">
              {t("trade_ui_confirm_title")}
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
              {t("trade_ui_confirm_body")}
            </p>
            <div className="mt-4 space-y-2 rounded-xl bg-stone-50 p-3 text-xs dark:bg-stone-950">
              <p>
                {symbol} · {side.toUpperCase()} · {leverage}× · {margin} USDT
              </p>
              {preview && (
                <p className="font-mono text-stone-700 dark:text-stone-200">
                  Liq ≈ {preview.liq.toFixed(2)}
                </p>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-stone-300 py-3 text-sm font-semibold dark:border-stone-600"
                onClick={() => setConfirmOpen(false)}
              >
                {t("trade_ui_cancel")}
              </button>
              <button
                type="button"
                disabled={busy}
                className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white disabled:opacity-50"
                onClick={() => void submitOpen()}
              >
                {t("trade_ui_submit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

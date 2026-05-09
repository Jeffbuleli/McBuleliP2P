"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  TRADE_OPTIONS_DURATIONS_SEC,
  TRADE_OPTIONS_FEE_RATE,
  TRADE_OPTIONS_PAYOUT_PCT,
  TRADE_SYMBOLS,
  tradeMaxOptionsStakeUsdt,
} from "@/lib/trade-config";
import type { TradeTf } from "@/components/trade/trade-mini-chart";
import {
  TradeModeBar,
  type TradeAppMode,
} from "@/components/trade/trade-mode-bar";
import type { Messages } from "@/i18n/messages";

function expiryLabelKey(sec: number): keyof Messages {
  switch (sec) {
    case 60:
      return "trade_ui_expiry_1m";
    case 300:
      return "trade_ui_expiry_5m";
    case 900:
      return "trade_ui_expiry_15m";
    case 3600:
      return "trade_ui_expiry_1h";
    default:
      return "trade_ui_expiry_5m";
  }
}

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

type OrderRow = {
  id: string;
  symbol: string;
  direction: string;
  stakeUsdt: string;
  payoutPct: string;
  durationSec: number;
  expiryAt: string;
  entryPrice: string;
  status: string;
  outcome: string | null;
  settlementPrice?: string | null;
  createdAt?: string;
};

export function OptionsTradingClient() {
  const { t } = useI18n();
  const [symbol, setSymbol] = useState<(typeof TRADE_SYMBOLS)[number]>("BTCUSDT");
  const [tf, setTf] = useState<TradeTf>("1h");
  const [ticker, setTicker] = useState<{ lastPrice: number } | null>(null);
  const [direction, setDirection] = useState<"call" | "put">("call");
  const [durationSec, setDurationSec] = useState<number>(300);
  const [stakeStr, setStakeStr] = useState("25");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [tradeMode, setTradeMode] = useState<TradeAppMode>("demo");
  const [tradeLiveEnabled, setTradeLiveEnabled] = useState(false);
  const [demoUsdt, setDemoUsdt] = useState(10000);
  const [demoEffectiveUsdt, setDemoEffectiveUsdt] = useState(10000);
  const [demoPiTestUsd, setDemoPiTestUsd] = useState(0);
  const [piTestAmt, setPiTestAmt] = useState(0);
  const [walletUsdt, setWalletUsdt] = useState<number | null>(null);
  const [enableBusy, setEnableBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const stake = Number(stakeStr.replace(",", "."));
  const fee = Number.isFinite(stake) ? stake * TRADE_OPTIONS_FEE_RATE : 0;
  const maxPay = Number.isFinite(stake)
    ? stake + (stake * TRADE_OPTIONS_PAYOUT_PCT) / 100
    : 0;

  const pollTicker = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/trade/ticker?symbol=${encodeURIComponent(symbol)}`,
        { cache: "no-store" },
      );
      const j = (await res.json()) as { lastPrice: number };
      if (res.ok) setTicker(j);
    } catch {
      /* ignore */
    }
  }, [symbol]);

  const loadTradeMode = useCallback(async () => {
    try {
      const res = await fetch("/api/trade/mode", { cache: "no-store" });
      const j = (await res.json()) as {
        demoUsdt?: string;
        demoEffectiveUsdt?: string;
        demoPiTestUsd?: string;
        piTest?: string;
        tradeLiveEnabled?: boolean;
      };
      if (res.ok) {
        const pure = Number(j.demoUsdt ?? "0");
        const eff = Number(j.demoEffectiveUsdt ?? j.demoUsdt ?? "0");
        if (Number.isFinite(pure)) setDemoUsdt(pure);
        setDemoEffectiveUsdt(Number.isFinite(eff) ? eff : pure);
        setDemoPiTestUsd(Number(j.demoPiTestUsd ?? "0"));
        setPiTestAmt(Number(j.piTest ?? "0"));
        setTradeLiveEnabled(Boolean(j.tradeLiveEnabled));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const pollWallet = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet/summary", { cache: "no-store" });
      const j = (await res.json()) as {
        lines?: { asset: string; balanceNum: number }[];
      };
      if (!res.ok) return;
      const usdt = j.lines?.find((l) => l.asset === "USDT")?.balanceNum;
      if (typeof usdt === "number") setWalletUsdt(usdt);
    } catch {
      /* ignore */
    }
  }, []);

  const pollOrders = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/trade/options/list?mode=${encodeURIComponent(tradeMode)}`,
        { cache: "no-store" },
      );
      const j = (await res.json()) as { orders?: OrderRow[] };
      if (res.ok) setOrders(j.orders ?? []);
    } catch {
      /* ignore */
    }
  }, [tradeMode]);

  useEffect(() => {
    void pollTicker();
    const id = window.setInterval(() => void pollTicker(), 5000);
    return () => window.clearInterval(id);
  }, [pollTicker]);

  useEffect(() => {
    void pollOrders();
    const id = window.setInterval(() => void pollOrders(), 6000);
    return () => window.clearInterval(id);
  }, [pollOrders]);

  useEffect(() => {
    void pollWallet();
  }, [pollWallet]);

  useEffect(() => {
    void loadTradeMode();
  }, [tradeMode, loadTradeMode]);

  const mark = ticker?.lastPrice ?? 0;

  async function submitOpen() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/trade/options/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: tradeMode,
          symbol,
          direction,
          stakeUsdt: stake,
          durationSec,
        }),
      });
      const j = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setMsg(
          j.error === "trade_live_not_enabled"
            ? t("trade_error_live_not_enabled")
            : j.error === "trade_pi_price_unavailable"
              ? t("trade_pi_price_unavailable")
            : j.error === "trade_insufficient_usdt"
              ? t("trade_error_insufficient_practice")
              : (j.message ?? j.error ?? "error"),
        );
        return;
      }
      setConfirmOpen(false);
      await pollOrders();
      await loadTradeMode();
    } finally {
      setBusy(false);
    }
  }

  const pending = useMemo(
    () => orders.filter((o) => o.status === "pending"),
    [orders],
  );

  const history = useMemo(() => {
    const settled = orders.filter((o) => o.status !== "pending");
    return settled.slice(0, 25);
  }, [orders]);

  async function enableLive() {
    setEnableBusy(true);
    try {
      const res = await fetch("/api/trade/live-enable", { method: "POST" });
      if (res.ok) await loadTradeMode();
    } finally {
      setEnableBusy(false);
    }
  }

  const availStake =
    tradeMode === "demo"
      ? demoEffectiveUsdt
      : walletUsdt != null
        ? walletUsdt
        : null;

  return (
    <div className="space-y-4 pb-8">
      <TradeModeBar
        mode={tradeMode}
        onModeChange={setTradeMode}
        tradeLiveEnabled={tradeLiveEnabled}
        demoUsdt={demoUsdt}
        demoEffectiveUsdt={demoEffectiveUsdt}
        demoPiTestUsd={demoPiTestUsd}
        piTest={piTestAmt}
        onEnableLive={enableLive}
        enableBusy={enableBusy}
        onDemoRefilled={async () => {
          await loadTradeMode();
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-stone-600 dark:text-stone-400">
          {t("trade_ui_pair")}
          <select
            value={symbol}
            onChange={(e) =>
              setSymbol(e.target.value as (typeof TRADE_SYMBOLS)[number])
            }
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold dark:border-stone-600 dark:bg-stone-900"
          >
            {TRADE_SYMBOLS.map((s) => (
              <option key={s} value={s}>
                {s.replace("USDT", "")}/USDT
              </option>
            ))}
          </select>
        </label>
        <div className="text-right">
          <p className="font-mono text-lg font-bold tabular-nums">
            {mark > 0 ? mark.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
          </p>
        </div>
      </div>

      <TradeMiniChart symbol={symbol} tf={tf} onTfChange={setTf} />

      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
        <p className="mb-2 text-xs font-semibold text-stone-500 dark:text-stone-400">
          {tradeMode === "demo"
            ? t("trade_ui_demo_balance")
            : t("trade_ui_usdt_balance")}
          :{" "}
          <span className="font-mono text-stone-900 dark:text-stone-100">
            {availStake != null
              ? availStake.toLocaleString(undefined, { maximumFractionDigits: 2 })
              : "—"}
          </span>
        </p>
        <p className="mb-3 text-xs leading-relaxed text-stone-600 dark:text-stone-300">
          {t("trade_ui_options_simple")}
        </p>

        <div className="mb-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDirection("call")}
            className={`rounded-xl py-3 text-sm font-bold ${
              direction === "call"
                ? "bg-emerald-600 text-white"
                : "bg-stone-100 text-stone-600 dark:bg-stone-800"
            }`}
          >
            {t("trade_ui_call")}
          </button>
          <button
            type="button"
            onClick={() => setDirection("put")}
            className={`rounded-xl py-3 text-sm font-bold ${
              direction === "put"
                ? "bg-rose-600 text-white"
                : "bg-stone-100 text-stone-600 dark:bg-stone-800"
            }`}
          >
            {t("trade_ui_put")}
          </button>
        </div>

        <p className="mb-1 text-xs font-semibold text-stone-600">{t("trade_ui_expiry")}</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {(TRADE_OPTIONS_DURATIONS_SEC as readonly number[]).map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setDurationSec(sec)}
              className={`rounded-lg px-3 py-2 text-xs font-bold ${
                durationSec === sec
                  ? "bg-amber-500 text-white"
                  : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
              }`}
            >
              {t(expiryLabelKey(sec))}
            </button>
          ))}
        </div>

        <label className="mb-2 block text-xs font-semibold text-stone-600">
          {t("trade_ui_stake")}
          <input
            type="text"
            inputMode="decimal"
            value={stakeStr}
            onChange={(e) => setStakeStr(e.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 font-mono text-sm dark:border-stone-600 dark:bg-stone-950"
          />
        </label>

        <div className="mb-3 rounded-xl bg-amber-50 p-3 text-xs dark:bg-amber-950/30">
          <p className="text-amber-950 dark:text-amber-100">
            {t("trade_ui_payout_info").replace(
              "{pct}",
              String(TRADE_OPTIONS_PAYOUT_PCT),
            )}
          </p>
          <p className="mt-1 text-stone-600 dark:text-stone-400">
            {t("trade_ui_max_loss")} · {t("trade_ui_fee_line").replace("{pct}", String(TRADE_OPTIONS_FEE_RATE * 100))}
          </p>
          {Number.isFinite(stake) && stake > 0 && (
            <p className="mt-1 font-mono text-stone-800 dark:text-stone-200">
              {t("trade_ui_if_win")}: ~{maxPay.toFixed(2)} USDT
            </p>
          )}
        </div>

        <p className="mb-2 text-[11px] text-stone-500">
          {t("trade_ui_stake_cap").replace(
            "{max}",
            String(tradeMaxOptionsStakeUsdt()),
          )}
        </p>

        {msg && (
          <p className="mb-2 rounded-lg bg-rose-50 px-2 py-1.5 text-xs text-rose-800 dark:bg-rose-950/50">
            {msg}
          </p>
        )}

        <button
          type="button"
          disabled={
            busy ||
            (tradeMode === "live" && !tradeLiveEnabled) ||
            !Number.isFinite(stake) ||
            stake <= 0 ||
            stake > tradeMaxOptionsStakeUsdt()
          }
          onClick={() => setConfirmOpen(true)}
          className="w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-50"
        >
          {t("trade_ui_place_binary")}
        </button>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold">{t("trade_ui_active_contracts")}</h3>
        {pending.length === 0 ? (
          <p className="text-sm text-stone-500">{t("trade_ui_no_pending_options")}</p>
        ) : (
          <ul className="space-y-2">
            {pending.map((o) => (
              <li
                key={o.id}
                className="rounded-xl border border-stone-700/50 bg-stone-950/65 p-3 text-xs shadow-lg shadow-black/30 backdrop-blur-md"
              >
                <p className="font-bold">
                  {o.symbol} · {o.direction.toUpperCase()} ·{" "}
                  {t(expiryLabelKey(o.durationSec))}
                </p>
                <p className="mt-1 font-mono text-stone-400">
                  Entry {Number(o.entryPrice).toFixed(2)} · ends{" "}
                  {new Date(o.expiryAt).toLocaleTimeString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold">{t("trade_ui_options_history")}</h3>
        {history.length === 0 ? (
          <p className="text-sm text-stone-400">{t("trade_ui_no_options_history")}</p>
        ) : (
          <ul className="space-y-2">
            {history.map((o) => {
              const out = (o.outcome ?? "").toLowerCase();
              const won = out === "won";
              const lost = out === "lost";
              return (
                <li
                  key={o.id}
                  className="rounded-xl border border-stone-700/50 bg-stone-950/65 p-3 text-xs shadow-lg shadow-black/30 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-stone-50">
                      {o.symbol} · {String(o.direction).toUpperCase()}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        won
                          ? "border border-emerald-700/35 bg-emerald-950/40 text-emerald-200"
                          : lost
                            ? "border border-rose-700/35 bg-rose-950/35 text-rose-100"
                            : "border border-stone-700/50 bg-stone-900/50 text-stone-200"
                      }`}
                    >
                      {o.status === "settled"
                        ? won
                          ? "WON"
                          : lost
                            ? "LOST"
                            : "SETTLED"
                        : o.status}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-stone-400">
                    Stake {Number(o.stakeUsdt).toFixed(2)} · Entry{" "}
                    {Number(o.entryPrice).toFixed(2)}
                    {o.settlementPrice
                      ? ` · Close ${Number(o.settlementPrice).toFixed(2)}`
                      : ""}
                  </p>
                  <p className="mt-0.5 text-stone-500">
                    {o.createdAt
                      ? new Date(o.createdAt).toLocaleString()
                      : new Date(o.expiryAt).toLocaleString()}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-center">
        <Link
          href="/app/trade/options/guide"
          className="text-xs font-semibold text-amber-700 underline dark:text-amber-400"
        >
          {t("trade_ui_learn_options")}
        </Link>
      </p>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-[1.75rem] border border-stone-700/60 bg-stone-950/85 p-5 shadow-2xl shadow-black/60 backdrop-blur-xl">
            <h4 className="text-lg font-bold text-stone-50">{t("trade_ui_confirm_title")}</h4>
            <p className="mt-2 text-sm text-stone-300">
              {t("trade_ui_options_confirm_body")}
            </p>
            <p className="mt-3 rounded-xl border border-stone-700/60 bg-stone-900/40 p-3 text-xs text-stone-200">
              {symbol} · {direction.toUpperCase()} · {stake} USDT + ~{fee.toFixed(4)} fee
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-stone-700/60 bg-stone-900/40 py-3 text-sm font-semibold text-stone-100 hover:bg-stone-900/55"
                onClick={() => setConfirmOpen(false)}
              >
                {t("trade_ui_cancel")}
              </button>
              <button
                type="button"
                disabled={busy}
                className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-bold text-white disabled:opacity-50"
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

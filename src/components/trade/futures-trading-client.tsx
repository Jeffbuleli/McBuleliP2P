"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import {
  TRADE_FEE_RATE,
  TRADE_LEVERAGES,
  TRADE_MIN_MARGIN_USDT,
  TRADE_SYMBOLS,
  isTradeSymbol,
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
import {
  TradeModeBar,
  type TradeAppMode,
} from "@/components/trade/trade-mode-bar";
import {
  TradeFlowCard,
  TradeFlowField,
  TradeFlowInput,
  TradeFlowSelect,
  TradeFlowSectionTitle,
  TradeHistoryPager,
  TradeLeverageChip,
  TradePrimaryBtn,
  TradeSideBtn,
  TradeStatRow,
  tradeFieldCls,
} from "@/components/trade/trade-flow-ui";
import { FuturesTradeHistoryCard } from "@/components/trade/futures-trade-history-card";
import { TradeIconAlert, TradeIconBadge, TradeIconShield } from "@/components/trade/trade-icons";
import type { TradeLiveGovernanceSnapshot } from "@/lib/trade-live-governance";
import { futuresApiMessage, liveEnableMessage } from "@/lib/trade-futures-ui-helpers";
import {
  TradeGraduationCard,
  TradeLiveGovernanceStrip,
} from "@/components/trade/trade-live-governance-ui";
import { TradeCommunityBridge } from "@/components/trade/trade-community-bridge";

const TradeMiniChart = dynamic(
  () =>
    import("@/components/trade/trade-mini-chart").then((m) => m.TradeMiniChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] animate-pulse rounded-2xl bg-[color:var(--fd-mint)]" />
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
  stopLossPrice?: string | null;
  takeProfitPrice?: string | null;
  unrealizedPnlUsdt: number;
  markPrice: number;
};

type HistoryRow = {
  id: string;
  symbol: string;
  side: string;
  leverage: number;
  marginUsdt: string;
  entryPrice: string;
  closePrice: string;
  realizedPnlUsdt: string;
  feeOpenUsdt: string;
  feeCloseUsdt: string;
  stopLossPrice: string | null;
  takeProfitPrice: string | null;
  closeReason: string | null;
  openedAt: string;
  closedAt: string;
};

export function FuturesTradingClient({
  embedInMarketHub = false,
}: {
  embedInMarketHub?: boolean;
} = {}) {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const locTag = locale === "fr" ? "fr-FR" : "en-US";
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
  const [tpStr, setTpStr] = useState("");
  const [usdtBal, setUsdtBal] = useState<number | null>(null);
  const [tradeMode, setTradeMode] = useState<TradeAppMode>("demo");
  const [tradeLiveEnabled, setTradeLiveEnabled] = useState(false);
  const [governance, setGovernance] = useState<TradeLiveGovernanceSnapshot | null>(
    null,
  );
  const [demoUsdt, setDemoUsdt] = useState(10000);
  const [demoEffectiveUsdt, setDemoEffectiveUsdt] = useState(10000);
  const [demoPiTestUsd, setDemoPiTestUsd] = useState(0);
  const [piTestAmt, setPiTestAmt] = useState(0);
  const [enableBusy, setEnableBusy] = useState(false);
  const [maxLev, setMaxLev] = useState(10);
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [histPage, setHistPage] = useState(0);
  const [histPageSize, setHistPageSize] = useState<10 | 20 | 30>(10);
  const [histTotal, setHistTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editPosId, setEditPosId] = useState<string | null>(null);
  const [editSl, setEditSl] = useState("");
  const [editTp, setEditTp] = useState("");
  const [editBusy, setEditBusy] = useState(false);
  const [guided, setGuided] = useState(true);
  const [priceSource, setPriceSource] = useState<string>("binance_futures");

  const urlSymbol = searchParams.get("symbol");
  useEffect(() => {
    if (urlSymbol && isTradeSymbol(urlSymbol)) {
      setSymbol(urlSymbol);
    }
  }, [urlSymbol]);

  const liveMarginMax =
    tradeMode === "live" && governance
      ? governance.liveMarginCapUsdt
      : tradeMaxMarginUsdt();

  const margin = Number(marginStr.replace(",", "."));
  const stopLoss =
    stopStr.trim() === "" ? null : Number(stopStr.replace(",", "."));
  const takeProfit =
    tpStr.trim() === "" ? null : Number(tpStr.replace(",", "."));

  const mark = ticker?.lastPrice ?? 0;
  const availableUsdt =
    tradeMode === "demo"
      ? demoEffectiveUsdt
      : usdtBal != null
        ? usdtBal
        : null;

  const warnings = useMemo(() => {
    const out: string[] = [];
    if (guided) {
      if (availableUsdt != null && Number.isFinite(margin) && margin > 0) {
        const pct = margin / Math.max(1, availableUsdt);
        if (pct > 0.05) out.push(t("trade_ui_warn_size_high"));
        else if (pct > 0.02) out.push(t("trade_ui_warn_size_medium"));
      }
      if (leverage >= 10) out.push(t("trade_ui_warn_lev_high"));
      else if (leverage >= 5) out.push(t("trade_ui_warn_lev_medium"));
    }
    return out;
  }, [guided, availableUsdt, margin, leverage, t]);

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

  /** Net PnL at exit (aligned with server: uPnL capped at −margin, minus close fee). */
  const slTpEstimate = useMemo(() => {
    if (
      !Number.isFinite(margin) ||
      margin <= 0 ||
      !Number.isFinite(mark) ||
      mark <= 0
    ) {
      return { slNet: null as number | null, tpNet: null as number | null };
    }
    const qty = positionQtyBase(margin, leverage, mark);
    const feeRate = TRADE_FEE_RATE;

    let slNet: number | null = null;
    if (
      stopLoss != null &&
      Number.isFinite(stopLoss) &&
      stopLoss > 0 &&
      ((side === "long" && stopLoss < mark) ||
        (side === "short" && stopLoss > mark))
    ) {
      let unreal = unrealizedPnlUsdt({
        side,
        qtyBase: qty,
        entry: mark,
        mark: stopLoss,
      });
      const maxLoss = -margin;
      if (unreal < maxLoss) unreal = maxLoss;
      const feeClose = feeRate * qty * stopLoss;
      slNet = unreal - feeClose;
    }

    let tpNet: number | null = null;
    if (
      takeProfit != null &&
      Number.isFinite(takeProfit) &&
      takeProfit > 0 &&
      ((side === "long" && takeProfit > mark) ||
        (side === "short" && takeProfit < mark))
    ) {
      const unreal = unrealizedPnlUsdt({
        side,
        qtyBase: qty,
        entry: mark,
        mark: takeProfit,
      });
      const feeClose = feeRate * qty * takeProfit;
      tpNet = unreal - feeClose;
    }

    return { slNet, tpNet };
  }, [margin, mark, side, leverage, stopLoss, takeProfit]);

  const pollTicker = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/trade/ticker?symbol=${encodeURIComponent(symbol)}`,
        { cache: "no-store" },
      );
      const j = (await res.json()) as {
        lastPrice: number;
        changePct24h: number;
        source?: string;
      };
      if (res.ok) {
        setTicker(j);
        if (j.source) setPriceSource(j.source);
      }
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
        governance?: TradeLiveGovernanceSnapshot;
      };
      if (res.ok) {
        const pure = Number(j.demoUsdt ?? "0");
        const eff = Number(j.demoEffectiveUsdt ?? j.demoUsdt ?? "0");
        if (Number.isFinite(pure)) setDemoUsdt(pure);
        setDemoEffectiveUsdt(Number.isFinite(eff) ? eff : pure);
        setDemoPiTestUsd(Number(j.demoPiTestUsd ?? "0"));
        setPiTestAmt(Number(j.piTest ?? "0"));
        setTradeLiveEnabled(Boolean(j.tradeLiveEnabled));
        if (j.governance) setGovernance(j.governance);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const pollPositions = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/trade/futures/positions?mode=${encodeURIComponent(tradeMode)}`,
        { cache: "no-store" },
      );
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
  }, [tradeMode]);

  const pollHistory = useCallback(async () => {
    try {
      const offset = histPage * histPageSize;
      const res = await fetch(
        `/api/trade/futures/history?mode=${encodeURIComponent(tradeMode)}&limit=${histPageSize}&offset=${offset}`,
        { cache: "no-store" },
      );
      const j = (await res.json()) as { trades?: HistoryRow[]; total?: number };
      if (res.ok) {
        setHistory(j.trades ?? []);
        setHistTotal(typeof j.total === "number" ? j.total : 0);
      }
    } catch {
      /* ignore */
    }
  }, [tradeMode, histPage, histPageSize]);

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
    setHistPage(0);
  }, [tradeMode, histPageSize]);

  useEffect(() => {
    void pollHistory();
    const id = window.setInterval(() => void pollHistory(), 15000);
    return () => window.clearInterval(id);
  }, [pollHistory]);

  useEffect(() => {
    void pollWallet();
  }, [pollWallet]);

  useEffect(() => {
    void loadTradeMode();
  }, [tradeMode, loadTradeMode]);

  async function submitOpen() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/trade/futures/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: tradeMode,
          symbol,
          side,
          leverage,
          marginUsdt: margin,
          stopLossPrice:
            stopLoss != null && Number.isFinite(stopLoss) ? stopLoss : null,
          takeProfitPrice:
            takeProfit != null && Number.isFinite(takeProfit)
              ? takeProfit
              : null,
        }),
      });
      const j = (await res.json()) as {
        error?: string;
        message?: string;
        meta?: Record<string, unknown>;
      };
      if (!res.ok) {
        setMsg(
          futuresApiMessage(j.error ?? j.message, locale, {
            ...j.meta,
            cap: governance?.liveMarginCapUsdt,
            max: maxLev,
          }),
        );
        return;
      }
      setConfirmOpen(false);
      setMarginStr("50");
      setStopStr("");
      setTpStr("");
      await pollPositions();
      await pollWallet();
      await loadTradeMode();
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
      if (!res.ok) {
        setMsg(futuresApiMessage(j.error, locale));
        return;
      }
      await pollPositions();
      await pollHistory();
      await pollWallet();
      await loadTradeMode();
    } finally {
      setBusy(false);
    }
  }

  async function submitUpdateSlTp(positionId: string) {
    setEditBusy(true);
    setMsg(null);
    try {
      const sl =
        editSl.trim() === "" ? null : Number(editSl.replace(",", "."));
      const tp =
        editTp.trim() === "" ? null : Number(editTp.replace(",", "."));
      const res = await fetch("/api/trade/futures/positions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positionId,
          stopLossPrice: sl != null && Number.isFinite(sl) ? sl : null,
          takeProfitPrice: tp != null && Number.isFinite(tp) ? tp : null,
        }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMsg(
          j.error === "trade_invalid_stop"
            ? t("trade_invalid_stop")
            : j.error === "trade_invalid_tp"
              ? t("trade_invalid_tp")
              : (j.error ?? "error"),
        );
        return;
      }
      setEditPosId(null);
      await pollPositions();
      await pollHistory();
    } finally {
      setEditBusy(false);
    }
  }

  function reasonLabel(r: string | null) {
    if (r === "stop_loss") return t("trade_ui_reason_stop_loss");
    if (r === "take_profit") return t("trade_ui_reason_take_profit");
    if (r === "liquidated") return t("trade_ui_reason_liquidated");
    if (r === "manual") return t("trade_ui_reason_manual");
    if (r === "tt_max_age") return t("trade_ui_reason_tt_max_age");
    return r && r.length ? r : "—";
  }

  async function enableLive(): Promise<{ ok: boolean; error?: string }> {
    setEnableBusy(true);
    try {
      const res = await fetch("/api/trade/live-enable", { method: "POST" });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        meta?: Record<string, unknown>;
      };
      if (!res.ok) {
        return {
          ok: false,
          error: liveEnableMessage(j.error, locale, j.meta),
        };
      }
      await loadTradeMode();
      return { ok: true };
    } finally {
      setEnableBusy(false);
    }
  }

  const changeStr =
    ticker != null
      ? `${ticker.changePct24h >= 0 ? "+" : ""}${ticker.changePct24h.toFixed(2)}%`
      : "—";

  const displayBal =
    tradeMode === "demo"
      ? demoEffectiveUsdt
      : usdtBal != null
        ? usdtBal
        : null;

  return (
    <div className="space-y-4 pb-8">
      <TradeModeBar
        mode={tradeMode}
        onModeChange={setTradeMode}
        tradeLiveEnabled={tradeLiveEnabled}
        governance={governance}
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

      {tradeMode === "live" && tradeLiveEnabled && governance ? (
        <TradeLiveGovernanceStrip governance={governance} />
      ) : null}

      {tradeMode === "live" && !tradeLiveEnabled && governance ? (
        <TradeGraduationCard governance={governance} />
      ) : null}

      <TradeCommunityBridge mode={tradeMode} />

      <TradeFlowCard className="!py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TradeIconBadge tone="mint">
              <TradeIconShield className="h-4 w-4" />
            </TradeIconBadge>
            <span className="text-xs font-extrabold text-[color:var(--fd-text)]">
              {guided ? t("trade_ui_guided_on") : t("trade_ui_guided_off")}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setGuided((v) => !v)}
            className="rounded-xl border-2 border-[color:var(--fd-primary)] bg-white px-2.5 py-1 text-[10px] font-extrabold text-[color:var(--fd-primary)]"
          >
            {guided ? t("trade_ui_guided_off") : t("trade_ui_guided_on")}
          </button>
        </div>
        {warnings.length > 0 ? (
          <div className="mt-2 flex gap-2 rounded-xl border-2 border-amber-400/50 bg-amber-50 px-2 py-1.5">
            <TradeIconAlert className="h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-[10px] font-semibold leading-snug text-amber-900">
              {warnings.slice(0, 2).join(" · ")}
            </p>
          </div>
        ) : null}
      </TradeFlowCard>

      <TradeFlowCard>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="min-w-[8rem] flex-1">
            <span className="text-[10px] font-bold text-[color:var(--fd-muted)]">
              {t("trade_ui_pair")}
            </span>
            <TradeFlowSelect
              value={symbol}
              onChange={(e) =>
                setSymbol(e.target.value as (typeof TRADE_SYMBOLS)[number])
              }
              className="mt-1"
            >
              {TRADE_SYMBOLS.map((s) => (
                <option key={s} value={s}>
                  {s.replace("USDT", "")}/USDT
                </option>
              ))}
            </TradeFlowSelect>
          </label>
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
              {t("trade_ui_live")}
            </p>
            <p className="font-mono text-lg font-bold tabular-nums text-[color:var(--fd-text)]">
              {mark > 0 ? mark.toLocaleString(locTag, { maximumFractionDigits: 2 }) : "—"}
            </p>
            <p
              className={`text-xs font-semibold tabular-nums ${
                (ticker?.changePct24h ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {t("trade_ui_24h")} {changeStr}
            </p>
          </div>
        </div>
      </TradeFlowCard>

      {!embedInMarketHub ? (
        <TradeMiniChart symbol={symbol} tf={tf} onTfChange={setTf} />
      ) : null}

      <TradeFlowCard>
        <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl bg-[color:var(--fd-mint)] px-3 py-2">
          <span className="text-[11px] font-bold text-[color:var(--fd-muted)]">
            {tradeMode === "demo" ? t("trade_ui_demo_balance") : t("trade_ui_usdt_balance")}
          </span>
          <span className="font-mono text-sm font-extrabold tabular-nums text-[color:var(--fd-text)]">
            {displayBal != null
              ? displayBal.toLocaleString(locTag, { maximumFractionDigits: 2 })
              : "—"}{" "}
            USDT
          </span>
        </div>
        {maxLev < 10 ? (
          <p className="mb-3 text-[10px] font-bold text-amber-700">
            {t("trade_ui_beginner_cap").replace("{max}", String(maxLev))}
          </p>
        ) : null}

        <div className="mb-3 grid grid-cols-2 gap-2">
          <TradeSideBtn
            active={side === "long"}
            side="long"
            onClick={() => setSide("long")}
            label={t("trade_ui_long")}
          />
          <TradeSideBtn
            active={side === "short"}
            side="short"
            onClick={() => setSide("short")}
            label={t("trade_ui_short")}
          />
        </div>

        <p className="mb-1.5 text-[11px] font-bold text-[color:var(--fd-muted)]">{t("trade_ui_leverage")}</p>
        <div className="mb-3 flex gap-2">
          {TRADE_LEVERAGES.map((lv) => (
            <TradeLeverageChip
              key={lv}
              lv={lv}
              active={leverage === lv}
              disabled={lv > maxLev}
              onClick={() => setLeverage(lv)}
            />
          ))}
        </div>

        <TradeFlowField label={t("trade_ui_margin")}>
          <TradeFlowInput
            type="text"
            inputMode="decimal"
            value={marginStr}
            onChange={(e) => setMarginStr(e.target.value)}
            className="font-mono"
          />
        </TradeFlowField>

        <div className="grid grid-cols-2 gap-2">
          <TradeFlowField label={t("trade_ui_sl_short")}>
            <TradeFlowInput
              type="text"
              inputMode="decimal"
              placeholder="—"
              value={stopStr}
              onChange={(e) => setStopStr(e.target.value)}
              className="font-mono"
            />
          </TradeFlowField>
          <TradeFlowField label={t("trade_ui_tp_short")}>
            <TradeFlowInput
              type="text"
              inputMode="decimal"
              placeholder="—"
              value={tpStr}
              onChange={(e) => setTpStr(e.target.value)}
              className="font-mono"
            />
          </TradeFlowField>
        </div>

        {preview ? (
          <div className="trade-summary-panel mb-3 space-y-0.5">
            <TradeStatRow
              label={t("trade_ui_notional")}
              value={`${preview.notional.toLocaleString(locTag, { maximumFractionDigits: 2 })} USDT`}
            />
            <TradeStatRow
              label={t("trade_ui_est_liq")}
              value={preview.liq.toLocaleString(locTag, { maximumFractionDigits: 2 })}
              valueClassName="text-rose-600"
            />
            <TradeStatRow
              label={t("trade_ui_est_open_fee")}
              value={`${preview.feeOpen.toLocaleString(locTag, { maximumFractionDigits: 4 })} USDT`}
            />
            <TradeStatRow
              label={t("trade_ui_est_max_loss")}
              value={`-${Math.max(0, margin).toLocaleString(locTag, { maximumFractionDigits: 2 })} USDT`}
              valueClassName="text-rose-600"
            />
            {slTpEstimate.slNet != null ? (
              <TradeStatRow
                label={t("trade_ui_est_sl_net")}
                value={`${slTpEstimate.slNet >= 0 ? "+" : ""}${slTpEstimate.slNet.toFixed(2)} USDT`}
                valueClassName="text-rose-600"
              />
            ) : null}
            {slTpEstimate.tpNet != null ? (
              <TradeStatRow
                label={t("trade_ui_est_tp_net")}
                value={`${slTpEstimate.tpNet >= 0 ? "+" : ""}${slTpEstimate.tpNet.toFixed(2)} USDT`}
                valueClassName="text-emerald-700"
              />
            ) : null}
          </div>
        ) : null}

        {msg ? (
          <p className="mb-2 rounded-xl border-2 border-rose-300 bg-rose-50 px-2 py-1.5 text-xs font-semibold text-rose-800">
            {msg}
          </p>
        ) : null}

        <TradePrimaryBtn
          disabled={
            busy ||
            (tradeMode === "live" && !tradeLiveEnabled) ||
            !Number.isFinite(margin) ||
            margin < TRADE_MIN_MARGIN_USDT ||
            margin > liveMarginMax
          }
          onClick={() => setConfirmOpen(true)}
        >
          {t("trade_ui_place_order")}
        </TradePrimaryBtn>
      </TradeFlowCard>
      <TradeFlowCard>
        <TradeFlowSectionTitle>{t("trade_ui_positions")}</TradeFlowSectionTitle>
        {positions.length === 0 ? (
          <p className="text-sm text-[color:var(--fd-muted)]">{t("trade_ui_no_positions")}</p>
        ) : (
          <ul className="space-y-2">
            {positions.map((p) => (
              (() => {
                const marginNum = Number(p.marginUsdt);
                const roe =
                  Number.isFinite(marginNum) && marginNum > 0
                    ? (p.unrealizedPnlUsdt / marginNum) * 100
                    : 0;
                const liq = Number(p.liquidationPrice);
                const markNow = p.markPrice;
                const dist =
                  Number.isFinite(liq) && Number.isFinite(markNow) && markNow > 0
                    ? ((markNow - liq) / markNow) * (p.side === "long" ? 1 : -1) * 100
                    : 0;
                return (
              <li
                key={p.id}
                className="rounded-2xl border-2 border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/50 p-3"
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
                    <p className="mt-1 font-mono text-[11px] text-[color:var(--fd-muted)]">
                      Entry {Number(p.entryPrice).toFixed(2)} · Liq{" "}
                      {Number(p.liquidationPrice).toFixed(2)} · Mark{" "}
                      {p.markPrice.toFixed(2)}
                      {p.stopLossPrice != null && p.stopLossPrice !== ""
                        ? ` · SL ${Number(p.stopLossPrice).toFixed(2)}`
                        : ""}
                      {p.takeProfitPrice != null && p.takeProfitPrice !== ""
                        ? ` · TP ${Number(p.takeProfitPrice).toFixed(2)}`
                        : ""}
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
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[color:var(--fd-muted)]">
                      <span>
                        ROE{" "}
                        <span
                          className={
                            roe >= 0 ? "text-emerald-600" : "text-rose-600"
                          }
                        >
                          {roe >= 0 ? "+" : ""}
                          {roe.toFixed(1)}%
                        </span>
                      </span>
                      <span>
                        {t("trade_ui_liq_distance")}{" "}
                        <span
                          className={
                            dist >= 5
                              ? "text-emerald-600"
                              : dist >= 2
                                ? "text-amber-600"
                                : "text-rose-600"
                          }
                        >
                          {dist.toFixed(2)}%
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <button
                      type="button"
                      disabled={busy || editBusy}
                      onClick={() => {
                        if (editPosId === p.id) {
                          setEditPosId(null);
                          return;
                        }
                        setEditPosId(p.id);
                        setEditSl(
                          p.stopLossPrice != null && p.stopLossPrice !== ""
                            ? String(Number(p.stopLossPrice).toFixed(2))
                            : "",
                        );
                        setEditTp(
                          p.takeProfitPrice != null && p.takeProfitPrice !== ""
                            ? String(Number(p.takeProfitPrice).toFixed(2))
                            : "",
                        );
                      }}
                      className="rounded-xl border-2 border-[color:var(--fd-border)] bg-white px-3 py-1.5 text-xs font-bold text-[color:var(--fd-text)]"
                    >
                      {t("trade_ui_edit_sl_tp")}
                    </button>
                    <button
                      type="button"
                      disabled={busy || editBusy}
                      onClick={() => void submitClose(p.id)}
                      className="rounded-xl border-2 border-rose-500/40 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700"
                    >
                      {t("trade_ui_close")}
                    </button>
                  </div>
                </div>
                {editPosId === p.id ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1 text-[11px] font-bold text-[color:var(--fd-muted)]">
                      {t("trade_ui_sl_short")}
                      <input
                        value={editSl}
                        onChange={(e) => setEditSl(e.target.value)}
                        inputMode="decimal"
                        placeholder="—"
                        className={tradeFieldCls}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-[11px] font-bold text-[color:var(--fd-muted)]">
                      {t("trade_ui_tp_short")}
                      <input
                        value={editTp}
                        onChange={(e) => setEditTp(e.target.value)}
                        inputMode="decimal"
                        placeholder="—"
                        className={tradeFieldCls}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={editBusy}
                      onClick={() => void submitUpdateSlTp(p.id)}
                      className="trade-btn-primary col-span-2 rounded-2xl py-2.5 text-sm font-extrabold disabled:opacity-50"
                    >
                      {t("trade_ui_save_sl_tp")}
                    </button>
                    <p className="col-span-2 text-[11px] leading-snug text-[color:var(--fd-muted)]">
                      {t("trade_ui_sl_tp_note")}
                    </p>
                  </div>
                ) : null}
              </li>
                );
              })()
            ))}
          </ul>
        )}
      </TradeFlowCard>

      <TradeFlowCard>
        <TradeFlowSectionTitle>{t("trade_ui_history")}</TradeFlowSectionTitle>
        {history.length === 0 ? (
          <p className="text-sm text-[color:var(--fd-muted)]">{t("trade_ui_history_empty")}</p>
        ) : (
          <>
            <ul className="space-y-2">
              {history.map((x) => (
                <li key={x.id}>
                  <FuturesTradeHistoryCard
                    row={x}
                    fr={locale === "fr"}
                    reasonLabelFn={reasonLabel}
                  />
                </li>
              ))}
            </ul>
            <TradeHistoryPager
              page={histPage}
              pageSize={histPageSize}
              total={histTotal}
              onPageChange={setHistPage}
              onPageSizeChange={(n) => {
                setHistPageSize(n);
                setHistPage(0);
              }}
            />
          </>
        )}
      </TradeFlowCard>
      <p className="text-center">
        <Link
          href="/app/trade/futures/guide"
          className="text-xs font-bold text-[color:var(--fd-primary)] underline"
        >
          {t("trade_ui_learn_futures")}
        </Link>
      </p>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <TradeFlowCard className="max-h-[90vh] w-full max-w-md overflow-y-auto">
            <h4 className="text-lg font-extrabold text-[color:var(--fd-text)]">
              {t("trade_ui_confirm_title")}
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--fd-muted)]">
              {t("trade_ui_confirm_body")}
            </p>
            <p className="mt-2 rounded-xl bg-[color:var(--fd-mint)] px-3 py-2 text-xs font-semibold text-[color:var(--fd-text)]">
              {t("trade_ui_confirm_custodial")}
            </p>
            {msg ? (
              <p className="mt-3 rounded-2xl border-2 border-rose-500/30 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                {msg}
              </p>
            ) : null}
            <div className="trade-summary-panel mt-4 space-y-2 p-3 text-xs">
              <p className="font-bold text-[color:var(--fd-text)]">
                {symbol} · {side.toUpperCase()} · {leverage}× · {margin} USDT
              </p>
              {preview && (
                <>
                  <p className="font-mono text-[color:var(--fd-muted)]">
                    Liq ≈ {preview.liq.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-[color:var(--fd-muted)]">
                    {t("trade_ui_confirm_price_source")}: {priceSource}
                  </p>
                  <p className="text-[11px] font-bold text-rose-700">
                    {t("trade_ui_confirm_max_loss")}: −
                    {(margin + preview.feeOpen).toFixed(2)} USDT
                  </p>
                  <p className="text-[11px] text-[color:var(--fd-muted)]">
                    {t("trade_ui_confirm_open_fee")}: {preview.feeOpen.toFixed(4)} USDT
                  </p>
                </>
              )}
              {stopLoss != null && Number.isFinite(stopLoss) ? (
                <p className="font-mono font-bold text-rose-600">
                  SL {stopLoss.toFixed(2)}
                </p>
              ) : null}
              {takeProfit != null && Number.isFinite(takeProfit) ? (
                <p className="font-mono font-bold text-emerald-600">
                  TP {takeProfit.toFixed(2)}
                </p>
              ) : null}
              {slTpEstimate.slNet != null ? (
                <p className="text-[11px] text-rose-700">
                  {t("trade_ui_est_sl_net")}:{" "}
                  <span className="font-mono font-semibold">
                    {slTpEstimate.slNet >= 0 ? "+" : ""}
                    {slTpEstimate.slNet.toFixed(2)} USDT
                  </span>
                </p>
              ) : null}
              {slTpEstimate.tpNet != null ? (
                <p className="text-[11px] text-emerald-700">
                  {t("trade_ui_est_tp_net")}:{" "}
                  <span className="font-mono font-semibold">
                    {slTpEstimate.tpNet >= 0 ? "+" : ""}
                    {slTpEstimate.tpNet.toFixed(2)} USDT
                  </span>
                </p>
              ) : null}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-2xl border-2 border-[color:var(--fd-border)] py-3 text-sm font-bold text-[color:var(--fd-text)]"
                onClick={() => setConfirmOpen(false)}
              >
                {t("trade_ui_cancel")}
              </button>
              <button
                type="button"
                disabled={busy}
                className="trade-btn-primary flex-1 rounded-2xl py-3 text-sm font-extrabold disabled:opacity-50"
                onClick={() => void submitOpen()}
              >
                {busy ? "…" : t("trade_ui_submit")}
              </button>
            </div>
          </TradeFlowCard>
        </div>
      )}
    </div>
  );
}

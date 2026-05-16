"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import type { BotPlanId } from "@/lib/bot-config";
import type { Messages } from "@/i18n/messages";
import {
  BOT_PLAN_DESC_KEY,
  formatBotRuntimeError,
  type BotLogRow,
} from "@/lib/bots-ui-helpers";
import { BotPositionsPanel } from "@/components/trade/bot-positions-panel";
import {
  BotPlanIcon,
  BotStrategyTabBar,
} from "@/components/trade/bot-strategy-icons";

type Plan = {
  id: BotPlanId;
  livePriceUsdt: number;
  demoPriceUsdt: number;
  requiresSpot: boolean;
  requiresFutures: boolean;
};

type Credential = {
  environment: "demo" | "live";
  apiKeyHint: string;
  spotOk: boolean;
  futuresOk: boolean;
  validatedAt: string | null;
  lastValidationError: string | null;
};

type Subscription = {
  id: string;
  planId: BotPlanId;
  billing: "demo" | "live";
  pricePaid: string;
  expiresAt: string;
};

type BotInstance = {
  id: string;
  planId: BotPlanId;
  billing: "demo" | "live";
  status: "active" | "paused";
  config: Record<string, unknown>;
  lastExecutedAt: string | null;
  lastError: string | null;
};

type Overview = {
  plans: Plan[];
  credentials: Credential[];
  subscriptions: Subscription[];
  instances: BotInstance[];
  dcaOptions: { symbols: string[]; intervalHours: number[] };
  gridOptions: { symbols: string[]; refreshHours: number[] };
  futuresOptions: {
    symbols: string[];
    intervalHours: number[];
    leverage: number[];
  };
  smartOptions: {
    timeframes: string[];
    minSignalScores: number[];
  };
  tradeMode: {
    demoUsdt: string;
    tradeLiveEnabled: boolean;
  } | null;
  keysEncryptionConfigured: boolean;
};

const PLAN_LABEL: Record<BotPlanId, string> = {
  dca_spot: "bots_plan_dca",
  grid_spot: "bots_plan_grid",
  futures_um: "bots_plan_futures",
};

function BotStatusBadge({
  status,
  lastExecutedAt,
  t,
}: {
  status: "active" | "paused" | "none";
  lastExecutedAt?: string | null;
  t: (k: keyof Messages) => string;
}) {
  if (status === "none") {
    return (
      <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-semibold text-stone-600 dark:bg-stone-700 dark:text-stone-300">
        {t("bots_status_not_started")}
      </span>
    );
  }
  if (status === "paused") {
    return (
      <span className="rounded-full bg-stone-400 px-2.5 py-0.5 text-xs font-semibold text-white dark:bg-stone-600">
        {t("bots_status_paused")}
      </span>
    );
  }
  if (!lastExecutedAt) {
    return (
      <span className="rounded-full bg-sky-600 px-2.5 py-0.5 text-xs font-semibold text-white">
        {t("bots_status_waiting")}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">
      {t("bots_status_active")}
    </span>
  );
}

function apiErrorMessage(
  code: string,
  t: (k: keyof Messages) => string,
): string {
  if (code.startsWith("bots_")) return t(code as keyof Messages);
  if (code.startsWith("smart_")) return formatBotRuntimeError(code, t);
  return formatBotRuntimeError(code, t);
}

type SmartUiState = {
  smartMode: boolean;
  minSignalScore: number;
  timeframe: "15m" | "1h" | "4h";
};

function loadSmartFromConfig(cfg: Record<string, unknown> | undefined): SmartUiState {
  const tf = cfg?.timeframe;
  return {
    smartMode: Boolean(cfg?.smartMode),
    minSignalScore: Number(cfg?.minSignalScore) || 35,
    timeframe: tf === "15m" || tf === "4h" ? tf : "1h",
  };
}

function SmartModePanel({
  planId,
  symbol,
  smart,
  setSmart,
  smartOptions,
  t,
}: {
  planId: BotPlanId;
  symbol: string;
  smart: SmartUiState;
  setSmart: (s: SmartUiState) => void;
  smartOptions: Overview["smartOptions"];
  t: (k: keyof Messages) => string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);

  async function loadPreview() {
    setPreviewBusy(true);
    setPreview(null);
    try {
      const q = new URLSearchParams({
        symbol,
        planId,
        timeframe: smart.timeframe,
      });
      const res = await fetch(`/api/trade/bots/signal?${q}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = typeof json.error === "string" ? json.error : "";
        setPreview(apiErrorMessage(err, t));
        return;
      }
      const score = typeof json.score === "number" ? json.score : "—";
      const bias = typeof json.bias === "string" ? json.bias : "";
      setPreview(`${bias} · ${t("bots_smart_score_label")} ${score}`);
    } finally {
      setPreviewBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 dark:border-indigo-800 dark:bg-indigo-950/30">
      <label className="flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          checked={smart.smartMode}
          onChange={(e) => setSmart({ ...smart, smartMode: e.target.checked })}
          className="mt-1"
        />
        <span>
          <span className="text-sm font-semibold text-indigo-950 dark:text-indigo-100">
            {t("bots_smart_mode")}
          </span>
          <span className="mt-0.5 block text-xs text-stone-600 dark:text-stone-400">
            {t("bots_smart_mode_hint")}
          </span>
        </span>
      </label>
      {smart.smartMode ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="block text-xs font-medium">
            {t("bots_smart_min_score")}
            <select
              value={smart.minSignalScore}
              onChange={(e) =>
                setSmart({ ...smart, minSignalScore: Number(e.target.value) })
              }
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 dark:border-stone-600 dark:bg-stone-900"
            >
              {(smartOptions?.minSignalScores ?? [35]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium">
            {t("bots_smart_timeframe")}
            <select
              value={smart.timeframe}
              onChange={(e) =>
                setSmart({
                  ...smart,
                  timeframe: e.target.value as SmartUiState["timeframe"],
                })
              }
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 dark:border-stone-600 dark:bg-stone-900"
            >
              {(smartOptions?.timeframes ?? ["1h"]).map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={previewBusy}
            onClick={() => void loadPreview()}
            className="sm:col-span-2 rounded-lg border border-indigo-400 px-3 py-1.5 text-xs font-semibold text-indigo-900 dark:border-indigo-600 dark:text-indigo-200"
          >
            {previewBusy ? t("bots_smart_loading") : t("bots_smart_preview")}
          </button>
          {preview ? (
            <p className="sm:col-span-2 text-xs font-medium text-indigo-900 dark:text-indigo-200">
              {preview}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function smartConfigFields(s: SmartUiState) {
  return {
    smartMode: s.smartMode,
    minSignalScore: s.minSignalScore,
    timeframe: s.timeframe,
  };
}

export function BotsTradingClient() {
  const { t } = useI18n();
  const [data, setData] = useState<Overview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [wizardPlan, setWizardPlan] = useState<BotPlanId | null>(null);
  const [wizardBilling, setWizardBilling] = useState<"demo" | "live">("demo");
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [connectMsg, setConnectMsg] = useState<string | null>(null);
  const [dcaSymbol, setDcaSymbol] = useState("BTCUSDT");
  const [dcaAmount, setDcaAmount] = useState("20");
  const [dcaInterval, setDcaInterval] = useState(24);
  const [dcaMsg, setDcaMsg] = useState<string | null>(null);
  const [gridSymbol, setGridSymbol] = useState("BTCUSDT");
  const [gridLow, setGridLow] = useState("90000");
  const [gridHigh, setGridHigh] = useState("100000");
  const [gridCount, setGridCount] = useState(5);
  const [gridQuote, setGridQuote] = useState("15");
  const [gridRefresh, setGridRefresh] = useState(12);
  const [gridMsg, setGridMsg] = useState<string | null>(null);
  const [futSymbol, setFutSymbol] = useState("BTCUSDT");
  const [futSide, setFutSide] = useState<"LONG" | "SHORT">("LONG");
  const [futLeverage, setFutLeverage] = useState(5);
  const [futMargin, setFutMargin] = useState("50");
  const [futInterval, setFutInterval] = useState(24);
  const [futSl, setFutSl] = useState(5);
  const [futTp, setFutTp] = useState(10);
  const [futMsg, setFutMsg] = useState<string | null>(null);
  const [dcaSmart, setDcaSmart] = useState<SmartUiState>({
    smartMode: false,
    minSignalScore: 35,
    timeframe: "1h",
  });
  const [gridSmart, setGridSmart] = useState<SmartUiState>({
    smartMode: false,
    minSignalScore: 35,
    timeframe: "1h",
  });
  const [futSmart, setFutSmart] = useState<SmartUiState>({
    smartMode: false,
    minSignalScore: 35,
    timeframe: "1h",
  });
  const [logs, setLogs] = useState<BotLogRow[]>([]);
  const [activeTab, setActiveTab] = useState<BotPlanId>("dca_spot");

  const loadLogs = useCallback(async (planId: BotPlanId) => {
    const logRes = await fetch(
      `/api/trade/bots/logs?planId=${planId}`,
      { cache: "no-store" },
    );
    const logJson = await logRes.json().catch(() => ({}));
    if (logRes.ok && Array.isArray(logJson.logs)) {
      setLogs(logJson.logs);
    }
  }, []);

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/trade/bots/overview", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(typeof json.error === "string" ? json.error : "—");
      setData(null);
      return;
    }
    setData(json as Overview);
  }, []);

  useEffect(() => {
    if (data) void loadLogs(activeTab);
  }, [data, activeTab, loadLogs]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const inst = data?.instances.find((i) => i.planId === "dca_spot");
    const cfg = inst?.config as {
      symbol?: string;
      quoteAmountUsdt?: string;
      intervalHours?: number;
    } | undefined;
    if (cfg?.symbol) setDcaSymbol(cfg.symbol);
    if (cfg?.quoteAmountUsdt) setDcaAmount(cfg.quoteAmountUsdt);
    if (cfg?.intervalHours) setDcaInterval(cfg.intervalHours);
    setDcaSmart(loadSmartFromConfig(inst?.config));

    const ginst = data?.instances.find((i) => i.planId === "grid_spot");
    const gcfg = ginst?.config as {
      symbol?: string;
      priceLow?: string;
      priceHigh?: string;
      gridCount?: number;
      quotePerGrid?: string;
      refreshHours?: number;
    } | undefined;
    if (gcfg?.symbol) setGridSymbol(gcfg.symbol);
    if (gcfg?.priceLow) setGridLow(gcfg.priceLow);
    if (gcfg?.priceHigh) setGridHigh(gcfg.priceHigh);
    if (gcfg?.gridCount) setGridCount(gcfg.gridCount);
    if (gcfg?.quotePerGrid) setGridQuote(gcfg.quotePerGrid);
    if (gcfg?.refreshHours) setGridRefresh(gcfg.refreshHours);
    setGridSmart(loadSmartFromConfig(ginst?.config));

    const finst = data?.instances.find((i) => i.planId === "futures_um");
    const fcfg = finst?.config as {
      symbol?: string;
      side?: "LONG" | "SHORT";
      leverage?: number;
      marginUsdt?: string;
      intervalHours?: number;
      stopLossPct?: number;
      takeProfitPct?: number;
    } | undefined;
    if (fcfg?.symbol) setFutSymbol(fcfg.symbol);
    if (fcfg?.side) setFutSide(fcfg.side);
    if (fcfg?.leverage) setFutLeverage(fcfg.leverage);
    if (fcfg?.marginUsdt) setFutMargin(fcfg.marginUsdt);
    if (fcfg?.intervalHours) setFutInterval(fcfg.intervalHours);
    if (fcfg?.stopLossPct) setFutSl(fcfg.stopLossPct);
    if (fcfg?.takeProfitPct) setFutTp(fcfg.takeProfitPct);
    setFutSmart(loadSmartFromConfig(finst?.config));
  }, [data?.instances]);

  async function subscribe(planId: BotPlanId, billing: "demo" | "live") {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/trade/bots/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billing }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof json.error === "string" ? json.error : "bots_subscribe_failed");
        return;
      }
      setWizardStep(3);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function connectKeys() {
    if (!wizardPlan) return;
    setBusy(true);
    setConnectMsg(null);
    try {
      const res = await fetch("/api/trade/bots/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          environment: wizardBilling,
          apiKey: apiKey.trim(),
          apiSecret: apiSecret.trim(),
          planId: wizardPlan,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code =
          typeof json.error === "string" ? json.error : "bots_error_binance_generic";
        setConnectMsg(
          code.startsWith("bots_error_")
            ? t(code as keyof Messages)
            : typeof json.detail === "string"
              ? json.detail
              : code,
        );
        return;
      }
      setConnectMsg(t("bots_keys_saved"));
      setApiKey("");
      setApiSecret("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  function startWizard(planId: BotPlanId) {
    setActiveTab(planId);
    setWizardPlan(planId);
    setWizardBilling("demo");
    setWizardStep(1);
    setConnectMsg(null);
    setApiKey("");
    setApiSecret("");
  }

  async function reloadAfterSave() {
    await load();
    await loadLogs(activeTab);
  }

  function activeSub(planId: BotPlanId) {
    return data?.subscriptions.find((s) => s.planId === planId);
  }

  function credFor(env: "demo" | "live") {
    return data?.credentials.find((c) => c.environment === env);
  }

  function instanceFor(planId: BotPlanId) {
    return data?.instances.find((i) => i.planId === planId);
  }

  async function saveDca(status: "active" | "paused") {
    const sub = activeSub("dca_spot");
    if (!sub) return;
    setBusy(true);
    setDcaMsg(null);
    try {
      const res = await fetch("/api/trade/bots/instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: "dca_spot",
          billing: sub.billing,
          status,
          config: {
            symbol: dcaSymbol,
            quoteAmountUsdt: dcaAmount.trim().replace(",", "."),
            intervalHours: dcaInterval,
            ...smartConfigFields(dcaSmart),
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = typeof json.error === "string" ? json.error : "";
        setDcaMsg(code ? apiErrorMessage(code, t) : t("bots_err_generic"));
        return;
      }
      setDcaMsg(status === "active" ? t("bots_dca_started") : t("bots_dca_paused"));
      await reloadAfterSave();
    } finally {
      setBusy(false);
    }
  }

  const dcaSub = activeSub("dca_spot");
  const dcaInst = instanceFor("dca_spot");
  const dcaKeysOk =
    dcaSub &&
    credFor(dcaSub.billing)?.spotOk &&
    credFor(dcaSub.billing)?.validatedAt;

  const gridSub = activeSub("grid_spot");
  const gridInst = instanceFor("grid_spot");
  const gridKeysOk =
    gridSub &&
    credFor(gridSub.billing)?.spotOk &&
    credFor(gridSub.billing)?.validatedAt;

  const futSub = activeSub("futures_um");
  const futInst = instanceFor("futures_um");
  const futKeysOk =
    futSub &&
    credFor(futSub.billing)?.futuresOk &&
    credFor(futSub.billing)?.validatedAt;

  async function saveFutures(status: "active" | "paused") {
    const sub = activeSub("futures_um");
    if (!sub) return;
    setBusy(true);
    setFutMsg(null);
    try {
      const res = await fetch("/api/trade/bots/instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: "futures_um",
          billing: sub.billing,
          status,
          config: {
            symbol: futSymbol,
            side: futSide,
            leverage: futLeverage,
            marginUsdt: futMargin.trim().replace(",", "."),
            intervalHours: futInterval,
            stopLossPct: futSl,
            takeProfitPct: futTp,
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = typeof json.error === "string" ? json.error : "";
        setFutMsg(code ? apiErrorMessage(code, t) : t("bots_err_generic"));
        return;
      }
      setFutMsg(
        status === "active" ? t("bots_futures_started") : t("bots_futures_paused"),
      );
      await reloadAfterSave();
    } finally {
      setBusy(false);
    }
  }

  async function saveGrid(status: "active" | "paused") {
    const sub = activeSub("grid_spot");
    if (!sub) return;
    setBusy(true);
    setGridMsg(null);
    try {
      const res = await fetch("/api/trade/bots/instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: "grid_spot",
          billing: sub.billing,
          status,
          config: {
            symbol: gridSymbol,
            priceLow: gridLow.trim().replace(",", "."),
            priceHigh: gridHigh.trim().replace(",", "."),
            gridCount,
            quotePerGrid: gridQuote.trim().replace(",", "."),
            refreshHours: gridRefresh,
            ...smartConfigFields(gridSmart),
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = typeof json.error === "string" ? json.error : "";
        setGridMsg(code ? apiErrorMessage(code, t) : t("bots_err_generic"));
        return;
      }
      setGridMsg(status === "active" ? t("bots_grid_started") : t("bots_grid_paused"));
      await reloadAfterSave();
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    if (err) {
      return (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
          {err}
        </p>
      );
    }
    return (
      <div className="space-y-4 pt-6 animate-pulse" aria-busy="true">
        <div className="h-8 w-56 rounded-lg bg-stone-200 dark:bg-stone-800" />
        <div className="h-20 rounded-2xl bg-stone-100 dark:bg-stone-800/80" />
        <div className="h-36 rounded-2xl bg-stone-100 dark:bg-stone-800/80" />
        <div className="h-36 rounded-2xl bg-stone-100 dark:bg-stone-800/80" />
        <p className="text-center text-sm text-stone-500">{t("bots_loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 pt-6">
      <header>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          {t("bots_title")}
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {t("bots_intro")}
        </p>
        {!data.keysEncryptionConfigured ? (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
            {t("bots_encryption_missing")}
          </p>
        ) : null}
        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/80 p-4 dark:border-sky-800/50 dark:bg-sky-950/25">
          <p className="text-sm font-semibold text-sky-950 dark:text-sky-100">
            {t("bots_auto_title")}
          </p>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {t("bots_auto_body")}
          </p>
        </div>
      </header>

      <BotStrategyTabBar
        active={activeTab}
        onSelect={setActiveTab}
        labels={{
          dca_spot: t("bots_tab_dca"),
          grid_spot: t("bots_tab_grid"),
          futures_um: t("bots_tab_futures"),
        }}
      />


      {activeTab === "dca_spot" && !dcaSub ? (
        <section className="mt-4 rounded-2xl border border-stone-200 bg-white p-6 text-center dark:border-stone-700 dark:bg-stone-900">
          <BotPlanIcon planId="dca_spot" className="mx-auto h-10 w-10 text-emerald-600" />
          <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
            {t(BOT_PLAN_DESC_KEY.dca_spot)}
          </p>
          <button
            type="button"
            onClick={() => startWizard("dca_spot")}
            className="mt-4 w-full max-w-xs rounded-xl bg-violet-700 py-3 text-sm font-semibold text-white"
          >
            {t("bots_subscribe_cta")}
          </button>
        </section>
      ) : null}

      {activeTab === "dca_spot" && dcaSub && !dcaKeysOk ? (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
          <p className="text-sm text-amber-950 dark:text-amber-100">
            {t("bots_keys_required_spot")}
          </p>
          <button
            type="button"
            onClick={() => startWizard("dca_spot")}
            className="mt-3 w-full rounded-xl bg-amber-700 py-2.5 text-sm font-semibold text-white"
          >
            {t("bots_keys_required_cta")}
          </button>
        </div>
      ) : null}

      {activeTab === "grid_spot" && gridSub && !gridKeysOk ? (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
          <p className="text-sm text-amber-950 dark:text-amber-100">
            {t("bots_keys_required_spot")}
          </p>
          <button
            type="button"
            onClick={() => startWizard("grid_spot")}
            className="mt-3 w-full rounded-xl bg-amber-700 py-2.5 text-sm font-semibold text-white"
          >
            {t("bots_keys_required_cta")}
          </button>
        </div>
      ) : null}

      {activeTab === "grid_spot" && !gridSub ? (
        <section className="mt-4 rounded-2xl border border-stone-200 bg-white p-6 text-center dark:border-stone-700 dark:bg-stone-900">
          <BotPlanIcon planId="grid_spot" className="mx-auto h-10 w-10 text-violet-600" />
          <button
            type="button"
            onClick={() => startWizard("grid_spot")}
            className="mt-4 w-full max-w-xs rounded-xl bg-violet-700 py-3 text-sm font-semibold text-white"
          >
            {t("bots_subscribe_cta")}
          </button>
        </section>
      ) : null}

      {activeTab === "futures_um" && futSub && !futKeysOk ? (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
          <p className="text-sm text-amber-950 dark:text-amber-100">
            {t("bots_keys_required_futures")}
          </p>
          <button
            type="button"
            onClick={() => startWizard("futures_um")}
            className="mt-3 w-full rounded-xl bg-amber-700 py-2.5 text-sm font-semibold text-white"
          >
            {t("bots_keys_required_cta")}
          </button>
        </div>
      ) : null}

      {activeTab === "futures_um" && !futSub ? (
        <section className="mt-4 rounded-2xl border border-stone-200 bg-white p-6 text-center dark:border-stone-700 dark:bg-stone-900">
          <BotPlanIcon planId="futures_um" className="mx-auto h-10 w-10 text-amber-600" />
          <button
            type="button"
            onClick={() => startWizard("futures_um")}
            className="mt-4 w-full max-w-xs rounded-xl bg-violet-700 py-3 text-sm font-semibold text-white"
          >
            {t("bots_subscribe_cta")}
          </button>
        </section>
      ) : null}

      {activeTab === "dca_spot" && dcaSub && dcaKeysOk ? (
        <section className="mt-4 rounded-2xl border border-emerald-700/40 bg-emerald-50/60 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/20">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-emerald-950 dark:text-emerald-100">
              {t("bots_dca_config_title")}
            </h2>
            <BotStatusBadge
              status={dcaInst?.status ?? "none"}
              t={t}
            />
          </div>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {t("bots_dca_config_hint")}
          </p>
          <div className="mt-4 grid gap-3">
            <label className="block text-sm font-medium">
              {t("bots_dca_symbol")}
              <select
                value={dcaSymbol}
                onChange={(e) => setDcaSymbol(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              >
                {(data.dcaOptions?.symbols ?? ["BTCUSDT"]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              {t("bots_dca_amount")}
              <input
                value={dcaAmount}
                onChange={(e) => setDcaAmount(e.target.value)}
                inputMode="decimal"
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              />
            </label>
            <label className="block text-sm font-medium">
              {t("bots_dca_interval")}
              <select
                value={dcaInterval}
                onChange={(e) => setDcaInterval(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              >
                {(data.dcaOptions?.intervalHours ?? [24]).map((h) => (
                  <option key={h} value={h}>
                    {h}h
                  </option>
                ))}
              </select>
            </label>
          </div>
          <SmartModePanel
            planId="dca_spot"
            symbol={dcaSymbol}
            smart={dcaSmart}
            setSmart={setDcaSmart}
            smartOptions={data.smartOptions}
            t={t}
          />
          {dcaInst?.status === "active" && !dcaInst.lastExecutedAt ? (
            <p className="mt-2 text-xs text-sky-700 dark:text-sky-300">
              {t("bots_waiting_first_tick")}
            </p>
          ) : null}
          {dcaInst?.lastExecutedAt ? (
            <p className="mt-2 text-xs text-stone-500">
              {t("bots_dca_last_run")}: {new Date(dcaInst.lastExecutedAt).toLocaleString()}
            </p>
          ) : null}
          {dcaInst?.lastError ? (
            <p className="mt-1 rounded-lg bg-rose-50 px-2 py-1.5 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
              {formatBotRuntimeError(dcaInst.lastError, t)}
            </p>
          ) : null}
          {dcaMsg ? <p className="mt-2 text-sm text-emerald-800">{dcaMsg}</p> : null}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveDca("active")}
              className="flex-1 rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              {t("bots_dca_start")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveDca("paused")}
              className="flex-1 rounded-xl border border-stone-400 py-2.5 text-sm font-semibold dark:border-stone-600"
            >
              {t("bots_dca_pause")}
            </button>
          </div>
          {dcaInst?.status === "active" ? (
            <p className="mt-2 text-xs text-stone-500">{t("bots_dca_cron_note")}</p>
          ) : null}
          <BotPositionsPanel planId="dca_spot" logs={logs} keysOk t={t} />
        </section>
      ) : null}

      {activeTab === "grid_spot" && gridSub && gridKeysOk ? (
        <section className="mt-4 rounded-2xl border border-violet-700/40 bg-violet-50/40 p-4 dark:border-violet-800/50 dark:bg-violet-950/15">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-violet-950 dark:text-violet-100">
              {t("bots_grid_config_title")}
            </h2>
            <BotStatusBadge
              status={gridInst?.status ?? "none"}
              lastExecutedAt={gridInst?.lastExecutedAt}
              t={t}
            />
          </div>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {t("bots_grid_config_hint")}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium sm:col-span-2">
              {t("bots_dca_symbol")}
              <select
                value={gridSymbol}
                onChange={(e) => setGridSymbol(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              >
                {(data.gridOptions?.symbols ?? ["BTCUSDT"]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              {t("bots_grid_low")}
              <input
                value={gridLow}
                onChange={(e) => setGridLow(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              />
            </label>
            <label className="block text-sm font-medium">
              {t("bots_grid_high")}
              <input
                value={gridHigh}
                onChange={(e) => setGridHigh(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              />
            </label>
            <label className="block text-sm font-medium">
              {t("bots_grid_count")}
              <input
                type="number"
                min={3}
                max={15}
                value={gridCount}
                onChange={(e) => setGridCount(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              />
            </label>
            <label className="block text-sm font-medium">
              {t("bots_grid_quote")}
              <input
                value={gridQuote}
                onChange={(e) => setGridQuote(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              />
            </label>
            <label className="block text-sm font-medium sm:col-span-2">
              {t("bots_grid_refresh")}
              <select
                value={gridRefresh}
                onChange={(e) => setGridRefresh(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              >
                {(data.gridOptions?.refreshHours ?? [12]).map((h) => (
                  <option key={h} value={h}>
                    {h}h
                  </option>
                ))}
              </select>
            </label>
          </div>
          <SmartModePanel
            planId="grid_spot"
            symbol={gridSymbol}
            smart={gridSmart}
            setSmart={setGridSmart}
            smartOptions={data.smartOptions}
            t={t}
          />
          {gridInst?.status === "active" && !gridInst.lastExecutedAt ? (
            <p className="mt-2 text-xs text-sky-700 dark:text-sky-300">
              {t("bots_waiting_first_tick")}
            </p>
          ) : null}
          {gridInst?.lastExecutedAt ? (
            <p className="mt-2 text-xs text-stone-500">
              {t("bots_dca_last_run")}: {new Date(gridInst.lastExecutedAt).toLocaleString()}
            </p>
          ) : null}
          {gridInst?.lastError ? (
            <p className="mt-2 rounded-lg bg-rose-50 px-2 py-1.5 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
              {formatBotRuntimeError(gridInst.lastError, t)}
            </p>
          ) : null}
          {gridMsg ? <p className="mt-2 text-sm text-violet-800">{gridMsg}</p> : null}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveGrid("active")}
              className="flex-1 rounded-xl bg-violet-700 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              {t("bots_grid_start")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveGrid("paused")}
              className="flex-1 rounded-xl border border-stone-400 py-2.5 text-sm font-semibold dark:border-stone-600"
            >
              {t("bots_grid_pause")}
            </button>
          </div>
          <BotPositionsPanel planId="grid_spot" logs={logs} keysOk t={t} />
        </section>
      ) : null}

      {activeTab === "futures_um" && futSub && futKeysOk ? (
        <section className="mt-4 rounded-2xl border border-amber-600/50 bg-amber-50/50 p-4 dark:border-amber-700/50 dark:bg-amber-950/20">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-amber-950 dark:text-amber-100">
              {t("bots_futures_config_title")}
            </h2>
            <BotStatusBadge
              status={futInst?.status ?? "none"}
              lastExecutedAt={futInst?.lastExecutedAt}
              t={t}
            />
          </div>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {t("bots_futures_config_hint")}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium sm:col-span-2">
              {t("bots_dca_symbol")}
              <select
                value={futSymbol}
                onChange={(e) => setFutSymbol(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              >
                {(data.futuresOptions?.symbols ?? ["BTCUSDT"]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              {t("bots_futures_side")}
              <select
                value={futSide}
                onChange={(e) => setFutSide(e.target.value as "LONG" | "SHORT")}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              >
                <option value="LONG">{t("bots_futures_long")}</option>
                <option value="SHORT">{t("bots_futures_short")}</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              {t("bots_futures_leverage")}
              <select
                value={futLeverage}
                onChange={(e) => setFutLeverage(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              >
                {(data.futuresOptions?.leverage ?? [5]).map((lv) => (
                  <option key={lv} value={lv}>
                    {lv}×
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              {t("bots_futures_margin")}
              <input
                value={futMargin}
                onChange={(e) => setFutMargin(e.target.value)}
                inputMode="decimal"
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              />
            </label>
            <label className="block text-sm font-medium">
              {t("bots_futures_sl")}
              <input
                type="number"
                min={1}
                max={50}
                value={futSl}
                onChange={(e) => setFutSl(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              />
            </label>
            <label className="block text-sm font-medium">
              {t("bots_futures_tp")}
              <input
                type="number"
                min={1}
                max={100}
                value={futTp}
                onChange={(e) => setFutTp(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              />
            </label>
            <label className="block text-sm font-medium sm:col-span-2">
              {t("bots_futures_reopen")}
              <select
                value={futInterval}
                onChange={(e) => setFutInterval(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              >
                {(data.futuresOptions?.intervalHours ?? [24]).map((h) => (
                  <option key={h} value={h}>
                    {h}h
                  </option>
                ))}
              </select>
            </label>
          </div>
          <SmartModePanel
            planId="futures_um"
            symbol={futSymbol}
            smart={futSmart}
            setSmart={setFutSmart}
            smartOptions={data.smartOptions}
            t={t}
          />
          {futInst?.status === "active" && !futInst.lastExecutedAt ? (
            <p className="mt-2 text-xs text-sky-700 dark:text-sky-300">
              {t("bots_waiting_first_tick")}
            </p>
          ) : null}
          {futInst?.lastExecutedAt ? (
            <p className="mt-2 text-xs text-stone-500">
              {t("bots_dca_last_run")}: {new Date(futInst.lastExecutedAt).toLocaleString()}
            </p>
          ) : null}
          {futInst?.lastError ? (
            <p className="mt-2 rounded-lg bg-rose-50 px-2 py-1.5 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
              {formatBotRuntimeError(futInst.lastError, t)}
            </p>
          ) : null}
          {futMsg ? <p className="mt-2 text-sm text-amber-900">{futMsg}</p> : null}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveFutures("active")}
              className="flex-1 rounded-xl bg-amber-700 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              {t("bots_futures_start")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveFutures("paused")}
              className="flex-1 rounded-xl border border-stone-400 py-2.5 text-sm font-semibold dark:border-stone-600"
            >
              {t("bots_futures_pause")}
            </button>
          </div>
          {futInst?.status === "active" ? (
            <p className="mt-2 text-xs text-stone-500">{t("bots_futures_cron_note")}</p>
          ) : null}
          <BotPositionsPanel planId="futures_um" logs={logs} keysOk t={t} />
        </section>
      ) : null}

      {wizardPlan ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label={t("bots_close_wizard")}
            onClick={() => {
              setWizardPlan(null);
              setWizardStep(1);
            }}
          />
          <section
            role="dialog"
            aria-modal="true"
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border-2 border-violet-600/50 bg-violet-50/95 p-4 shadow-2xl dark:border-violet-500/40 dark:bg-violet-950/95"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
              {t("bots_wizard_progress", { step: String(wizardStep), total: "3" })}
            </p>
            <h3 className="mt-1 font-bold text-violet-950 dark:text-violet-100">
              {t(PLAN_LABEL[wizardPlan] as keyof typeof t)} — {t("bots_wizard_title")}
            </h3>

          {wizardStep === 1 ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-stone-700 dark:text-stone-300">
                {t("bots_choose_billing")}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setWizardBilling("demo")}
                  className={`flex-1 rounded-xl py-2 text-sm font-bold ${
                    wizardBilling === "demo"
                      ? "bg-violet-600 text-white"
                      : "bg-stone-200 dark:bg-stone-800"
                  }`}
                >
                  {t("bots_billing_demo")} ({data.tradeMode?.demoUsdt ?? "0"} USDT)
                </button>
                <button
                  type="button"
                  onClick={() => setWizardBilling("live")}
                  className={`flex-1 rounded-xl py-2 text-sm font-bold ${
                    wizardBilling === "live"
                      ? "bg-violet-600 text-white"
                      : "bg-stone-200 dark:bg-stone-800"
                  }`}
                >
                  {t("bots_billing_live")}
                </button>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  const sub = activeSub(wizardPlan);
                  if (sub && sub.billing === wizardBilling) {
                    setWizardStep(3);
                  } else {
                    setWizardStep(2);
                  }
                }}
                className="w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white disabled:opacity-40"
              >
                {t("continue")}
              </button>
            </div>
          ) : null}

          {wizardStep === 2 ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm">{t("bots_subscribe_confirm")}</p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void subscribe(wizardPlan, wizardBilling)}
                className="w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white disabled:opacity-40"
              >
                {busy ? "…" : t("bots_confirm_subscribe")}
              </button>
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className="w-full text-sm underline"
              >
                {t("back")}
              </button>
            </div>
          ) : null}

          {wizardStep === 3 ? (
            <div className="mt-4 space-y-4">
              <ol className="list-decimal space-y-2 pl-5 text-sm text-stone-800 dark:text-stone-200">
                <li>{t("bots_wizard_step1")}</li>
                <li>{t("bots_wizard_step2")}</li>
                <li>{t("bots_wizard_step3")}</li>
                <li>{t("bots_wizard_step4")}</li>
              </ol>
              {wizardBilling === "demo" ? (
                <p className="rounded-lg border-2 border-amber-500 bg-amber-50 p-3 text-sm font-medium text-amber-950 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-100">
                  {wizardPlan === "futures_um"
                    ? t("bots_error_demo_futures_keys")
                    : t("bots_error_demo_spot_keys")}
                </p>
              ) : (
                <p className="rounded-lg bg-stone-100 p-3 text-xs dark:bg-stone-800">
                  {t("bots_env_live_hint")}
                </p>
              )}
              {credFor(wizardBilling) ? (
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  {t("bots_keys_connected", {
                    hint: credFor(wizardBilling)!.apiKeyHint,
                  })}
                </p>
              ) : null}
              <label className="block text-sm font-medium">
                {t("bots_api_key_label")}
                <input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono text-sm dark:border-stone-600 dark:bg-stone-900"
                  autoComplete="off"
                />
              </label>
              <label className="block text-sm font-medium">
                {t("bots_api_secret_label")}
                <input
                  type="password"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono text-sm dark:border-stone-600 dark:bg-stone-900"
                  autoComplete="off"
                />
              </label>
              {connectMsg ? (
                <p className="text-sm text-stone-700 dark:text-stone-300">{connectMsg}</p>
              ) : null}
              <button
                type="button"
                disabled={busy || apiKey.length < 16 || apiSecret.length < 16}
                onClick={() => void connectKeys()}
                className="w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white disabled:opacity-40"
              >
                {busy ? "…" : t("bots_test_and_save")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setWizardPlan(null);
                  setWizardStep(1);
                }}
                className="w-full text-sm underline"
              >
                {t("bots_close_wizard")}
              </button>
            </div>
          ) : null}
          </section>
        </div>
      ) : null}

      {err ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
          {err}
        </p>
      ) : null}

      <p className="text-center text-sm">
        <Link href="/app/trade/futures/guide" className="text-emerald-700 underline dark:text-emerald-300">
          {t("trade_ui_learn_futures")}
        </Link>
      </p>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import type { BotPlanId } from "@/lib/bot-config";
import type { Messages } from "@/i18n/messages";
import {
  BOT_PLAN_DESC_KEY,
  botsApiMessage,
  formatBotRuntimeError,
  formatBotsCredentialValidationLine,
  type BotLogRow,
} from "@/lib/bots-ui-helpers";
import { BotsKeysHub } from "@/components/trade/bots-keys-hub";
import {
  BotsCronHealthBar,
  type CronHealthSnapshot,
} from "@/components/trade/bots-cron-health-bar";
import { BotStrategyLivePanel } from "@/components/trade/bot-strategy-live-panel";
import { BotRunControls } from "@/components/trade/bot-run-controls";
import type { BotOpenPositionRow } from "@/lib/bot-positions-types";
import { parseBotFuturesConfig } from "@/lib/bot-futures-config";
import { UiInfoTip, UiSectionTitle } from "@/components/ui/ui-info-tip";
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
  futuresApiKind: "fapi" | "papi" | null;
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
  cronConfigured?: boolean;
  cronHealth?: CronHealthSnapshot;
  isSuperAdmin?: boolean;
};

const PLAN_LABEL: Record<BotPlanId, string> = {
  dca_spot: "bots_plan_dca",
  grid_spot: "bots_plan_grid",
  futures_um: "bots_plan_futures",
};

function BotStatusBadge({
  status,
  lastExecutedAt,
  monitoringOpen,
  t,
}: {
  status: "active" | "paused" | "none";
  lastExecutedAt?: string | null;
  monitoringOpen?: boolean;
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
  if (monitoringOpen) {
    return (
      <span className="rounded-full bg-amber-600 px-2.5 py-0.5 text-xs font-semibold text-white dark:bg-amber-700">
        {t("bots_status_position_open")}
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

function billingEnvLabel(
  billing: "demo" | "live",
  t: (k: keyof Messages) => string,
) {
  return billing === "demo" ? t("bots_billing_demo") : t("bots_billing_live");
}

function SmartModePanel({
  planId,
  symbol,
  billing,
  smart,
  setSmart,
  smartOptions,
  t,
}: {
  planId: BotPlanId;
  symbol: string;
  billing: "demo" | "live";
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
        billing,
        timeframe: smart.timeframe,
      });
      const res = await fetch(`/api/trade/bots/signal?${q}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = typeof json.error === "string" ? json.error : "";
        setPreview(botsApiMessage(err, t));
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
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={smart.smartMode}
          onChange={(e) => setSmart({ ...smart, smartMode: e.target.checked })}
          className="shrink-0"
        />
        <span className="flex min-w-0 flex-1 items-center gap-1 text-sm font-semibold text-indigo-950 dark:text-indigo-100">
          <span className="truncate">{t("bots_smart_mode")}</span>
          <UiInfoTip tip={t("bots_smart_mode_hint")} />
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

type FutExitUiState = {
  smartExitMode: boolean;
  minReversalScore: number;
  minProfitPctForSmartExit: number;
  smartExitUseEntryTimeframe: boolean;
  smartExitTimeframe: SmartUiState["timeframe"];
};

function loadFutExitFromConfig(
  cfg: Record<string, unknown> | undefined,
): FutExitUiState {
  const entryTf =
    (cfg?.timeframe as SmartUiState["timeframe"] | undefined) ?? "1h";
  return {
    smartExitMode: Boolean(cfg?.smartExitMode),
    minReversalScore: Number(cfg?.minReversalScore) || 40,
    minProfitPctForSmartExit: Number(cfg?.minProfitPctForSmartExit) ?? 0.5,
    smartExitUseEntryTimeframe: cfg?.smartExitUseEntryTimeframe !== false,
    smartExitTimeframe:
      (cfg?.smartExitTimeframe as SmartUiState["timeframe"] | undefined) ??
      entryTf,
  };
}

function futExitConfigFields(s: FutExitUiState) {
  return {
    smartExitMode: s.smartExitMode,
    minReversalScore: s.minReversalScore,
    minProfitPctForSmartExit: s.minProfitPctForSmartExit,
    smartExitUseEntryTimeframe: s.smartExitUseEntryTimeframe,
    ...(s.smartExitUseEntryTimeframe
      ? {}
      : { smartExitTimeframe: s.smartExitTimeframe }),
  };
}

function resolveExitTfLabel(
  exit: FutExitUiState,
  entryTimeframe: SmartUiState["timeframe"],
): SmartUiState["timeframe"] {
  return exit.smartExitUseEntryTimeframe
    ? entryTimeframe
    : exit.smartExitTimeframe;
}

const SMART_EXIT_TF_ENTRY = "__entry__";

function FuturesSmartExitPanel({
  exit,
  setExit,
  entryTimeframe,
  timeframes,
  t,
}: {
  exit: FutExitUiState;
  setExit: (s: FutExitUiState) => void;
  entryTimeframe: SmartUiState["timeframe"];
  timeframes: string[];
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string;
}) {
  const exitTf = resolveExitTfLabel(exit, entryTimeframe);
  const tfSelectValue = exit.smartExitUseEntryTimeframe
    ? SMART_EXIT_TF_ENTRY
    : exit.smartExitTimeframe;

  return (
    <div className="mt-3 rounded-xl border border-teal-300/80 bg-teal-50/70 p-3 dark:border-teal-800 dark:bg-teal-950/35">
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={exit.smartExitMode}
          onChange={(e) =>
            setExit({ ...exit, smartExitMode: e.target.checked })
          }
          className="shrink-0"
        />
        <span className="flex min-w-0 flex-1 items-center gap-1 text-sm font-semibold text-teal-950 dark:text-teal-100">
          <span className="truncate">{t("bots_smart_exit_mode")}</span>
          <UiInfoTip tip={t("bots_smart_exit_hint", { tf: exitTf })} />
        </span>
      </label>
      {exit.smartExitMode ? (
        <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
          <label className="block text-[11px] font-medium text-teal-950/90 dark:text-teal-100/90">
            {t("bots_smart_exit_tf_label")}
            <select
              value={tfSelectValue}
              onChange={(e) => {
                const v = e.target.value;
                if (v === SMART_EXIT_TF_ENTRY) {
                  setExit({ ...exit, smartExitUseEntryTimeframe: true });
                  return;
                }
                setExit({
                  ...exit,
                  smartExitUseEntryTimeframe: false,
                  smartExitTimeframe: v as SmartUiState["timeframe"],
                });
              }}
              className="mt-0.5 w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs dark:border-stone-600 dark:bg-stone-900"
            >
              <option value={SMART_EXIT_TF_ENTRY}>
                {t("bots_smart_exit_tf_entry", { tf: entryTimeframe })}
              </option>
              {timeframes.map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] font-medium text-teal-950/90 dark:text-teal-100/90">
            {t("bots_smart_exit_reversal_score")}
            <select
              value={exit.minReversalScore}
              onChange={(e) =>
                setExit({
                  ...exit,
                  minReversalScore: Number(e.target.value),
                })
              }
              className="mt-0.5 w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs dark:border-stone-600 dark:bg-stone-900"
            >
              {[30, 35, 40, 45, 50, 55].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] font-medium text-teal-950/90 dark:text-teal-100/90">
            {t("bots_smart_exit_min_profit")}
            <input
              type="number"
              min={0}
              max={20}
              step={0.1}
              value={exit.minProfitPctForSmartExit}
              onChange={(e) =>
                setExit({
                  ...exit,
                  minProfitPctForSmartExit: Number(e.target.value),
                })
              }
              className="mt-0.5 w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs dark:border-stone-600 dark:bg-stone-900"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
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
  const [connectOk, setConnectOk] = useState(false);
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
  const [futExit, setFutExit] = useState<FutExitUiState>({
    smartExitMode: false,
    minReversalScore: 40,
    minProfitPctForSmartExit: 0.5,
    smartExitUseEntryTimeframe: true,
    smartExitTimeframe: "1h",
  });
  const [logs, setLogs] = useState<BotLogRow[]>([]);
  const [activeTab, setActiveTab] = useState<BotPlanId>("dca_spot");
  const [accountBilling, setAccountBilling] = useState<"demo" | "live">("demo");
  const [keysHubMsg, setKeysHubMsg] = useState<string | null>(null);
  const [futOpenRows, setFutOpenRows] = useState<BotOpenPositionRow[]>([]);
  const billingDefaultApplied = useRef(false);

  const loadLogs = useCallback(async (planId: BotPlanId, billing: "demo" | "live") => {
    const logRes = await fetch(
      `/api/trade/bots/logs?planId=${planId}&billing=${billing}`,
      { cache: "no-store" },
    );
    const logJson = await logRes.json().catch(() => ({}));
    if (logRes.ok && Array.isArray(logJson.logs)) {
      const next = logJson.logs as BotLogRow[];
      setLogs((prev) => {
        if (
          prev.length === next.length &&
          prev.every((row, i) => row.id === next[i]?.id)
        ) {
          return prev;
        }
        return next;
      });
    }
  }, []);

  const refreshDcaLogs = useCallback(
    () => loadLogs("dca_spot", accountBilling),
    [loadLogs, accountBilling],
  );
  const refreshGridLogs = useCallback(
    () => loadLogs("grid_spot", accountBilling),
    [loadLogs, accountBilling],
  );
  const refreshFutLogs = useCallback(
    () => loadLogs("futures_um", accountBilling),
    [loadLogs, accountBilling],
  );

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/trade/bots/overview", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const code = typeof json.error === "string" ? json.error : "";
      setErr(code ? botsApiMessage(code, t) : t("bots_err_generic"));
      setData(null);
      return;
    }
    setData(json as Overview);
  }, []);

  useEffect(() => {
    if (data) void loadLogs(activeTab, accountBilling);
  }, [data, activeTab, accountBilling, loadLogs]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!data || billingDefaultApplied.current) return;
    billingDefaultApplied.current = true;
    const demoCred = data.credentials.find((c) => c.environment === "demo");
    const liveCred = data.credentials.find((c) => c.environment === "live");
    const liveOk =
      Boolean(liveCred?.validatedAt) &&
      (data.tradeMode?.tradeLiveEnabled || data.isSuperAdmin);
    if (data.isSuperAdmin) {
      if (demoCred?.validatedAt) setAccountBilling("demo");
      else if (liveOk) setAccountBilling("live");
      return;
    }
    if (liveOk) setAccountBilling("live");
    else if (demoCred?.validatedAt) setAccountBilling("demo");
  }, [data]);

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
    setFutExit(loadFutExitFromConfig(finst?.config));
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
        const code =
          typeof json.error === "string" ? json.error : "bots_subscribe_failed";
        setErr(botsApiMessage(code, t));
        return;
      }
      setWizardStep(3);
      await load();
    } finally {
      setBusy(false);
    }
  }

  function formatKeysSavedMessage(
    check: {
      spotOk?: boolean;
      futuresOk?: boolean;
      futuresApiKind?: string | null;
    } | undefined,
  ): string {
    if (!check) return t("bots_keys_saved");
    const spot = check.spotOk ? t("bots_keys_validated_yes") : t("bots_keys_validated_no");
    let futures = t("bots_keys_validated_no");
    if (check.futuresOk) {
      futures =
        check.futuresApiKind === "papi"
          ? t("bots_keys_validated_pm")
          : t("bots_keys_validated_yes");
    }
    return `${t("bots_keys_validated_ok")} ${t("bots_keys_validated_detail", { spot, futures })}`;
  }

  async function connectKeys() {
    if (!wizardPlan) return;
    setBusy(true);
    setConnectMsg(null);
    setConnectOk(false);
    try {
      const body: Record<string, string> = {
        environment: wizardBilling,
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
        planId: wizardPlan,
      };
      const res = await fetch("/api/trade/bots/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code =
          typeof json.error === "string" ? json.error : "bots_error_binance_generic";
        setConnectOk(false);
        setConnectMsg(
          typeof json.detail === "string" && !code.startsWith("bots_")
            ? json.detail
            : botsApiMessage(code, t),
        );
        return;
      }
      const savedMsg = formatKeysSavedMessage(
        json.check as {
          spotOk?: boolean;
          futuresOk?: boolean;
          futuresApiKind?: "fapi" | "papi" | null;
        },
      );
      setConnectOk(true);
      setConnectMsg(savedMsg);
      setKeysHubMsg(savedMsg);
      setApiKey("");
      setApiSecret("");
      if (wizardBilling === "live") {
        setAccountBilling("live");
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  function startWizard(planId: BotPlanId) {
    setActiveTab(planId);
    setWizardPlan(planId);
    setWizardBilling(accountBilling);
    setWizardStep(1);
    setConnectMsg(null);
    setConnectOk(false);
    setApiKey("");
    setApiSecret("");
  }

  function openKeysHub(env: "demo" | "live") {
    setWizardBilling(env);
    setAccountBilling(env);
    setWizardPlan(activeTab);
    setWizardStep(3);
    setConnectMsg(null);
    setConnectOk(false);
    setApiKey("");
    setApiSecret("");
  }

  async function revokeKeys(env: "demo" | "live") {
    setBusy(true);
    setKeysHubMsg(null);
    try {
      const res = await fetch(
        `/api/trade/bots/keys?environment=${env}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const code = typeof json.error === "string" ? json.error : "bots_err_generic";
        setKeysHubMsg(botsApiMessage(code, t));
        return;
      }
      setKeysHubMsg(t("bots_keys_revoked"));
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function reloadAfterSave() {
    await load();
    await loadLogs(activeTab, accountBilling);
  }

  function activeSub(planId: BotPlanId, billingOverride?: "demo" | "live") {
    const billing = billingOverride ?? accountBilling;
    if (data?.isSuperAdmin) {
      const paid = data.subscriptions.find(
        (s) => s.planId === planId && s.billing === billing,
      );
      if (paid) return paid;
      return {
        id: `privileged-${billing}-${planId}`,
        planId,
        billing,
        pricePaid: "0",
        expiresAt: "2099-12-31T23:59:59.000Z",
      };
    }
    return data?.subscriptions.find((s) => s.planId === planId);
  }

  function credFor(env: "demo" | "live") {
    return data?.credentials.find((c) => c.environment === env);
  }

  function keysOkForPlan(planId: BotPlanId, billing: "demo" | "live") {
    const c = credFor(billing);
    if (!c?.validatedAt) return false;
    if (planId === "futures_um") return Boolean(c.futuresOk);
    return Boolean(c.spotOk);
  }

  function instanceFor(planId: BotPlanId) {
    return data?.instances.find((i) => i.planId === planId);
  }

  function instEnvAligned(inst: { billing: "demo" | "live" } | undefined) {
    return !inst || inst.billing === accountBilling;
  }

  function billingMismatchBanner(inst: { billing: "demo" | "live" } | undefined) {
    if (!inst || inst.billing === accountBilling) return null;
    return (
      <p className="rounded-lg border border-violet-400/70 bg-violet-50 px-3 py-2 text-xs text-violet-950 dark:border-violet-600/50 dark:bg-violet-950/40 dark:text-violet-100 sm:col-span-2">
        {t("bots_billing_view_mismatch", {
          saved: billingEnvLabel(inst.billing, t),
          viewing: billingEnvLabel(accountBilling, t),
        })}
      </p>
    );
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
        setDcaMsg(code ? botsApiMessage(code, t) : t("bots_err_generic"));
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
  const dcaKeysOk = Boolean(
    dcaSub && keysOkForPlan("dca_spot", dcaSub.billing),
  );

  const gridSub = activeSub("grid_spot");
  const gridInst = instanceFor("grid_spot");
  const gridKeysOk = Boolean(
    gridSub && keysOkForPlan("grid_spot", gridSub.billing),
  );

  const futSub = activeSub("futures_um");
  const futInst = instanceFor("futures_um");
  const futKeysOk = Boolean(
    futSub && keysOkForPlan("futures_um", futSub.billing),
  );
  const savedFutCfg = parseBotFuturesConfig(futInst?.config ?? null);
  const savedFutSymbol = savedFutCfg?.symbol;
  const futFormSymbolDirty = Boolean(
    savedFutSymbol && futSymbol !== savedFutSymbol,
  );
  const futUnmanagedRow = futOpenRows.find(
    (r) => r.kind === "futures" && r.matchesConfig === false,
  );
  const futHasUnmanagedOpen = Boolean(futUnmanagedRow);
  const futHasConfigOpen = futOpenRows.some(
    (r) => r.kind === "futures" && r.matchesConfig !== false,
  );
  const futConfigOpenRow = futOpenRows.find(
    (r) => r.kind === "futures" && r.matchesConfig !== false,
  );
  const futShowRealign =
    futFormSymbolDirty ||
    futHasUnmanagedOpen ||
    Boolean(futConfigOpenRow && futSymbol !== futConfigOpenRow.symbol);

  function realignFuturesForm() {
    const targetSymbol =
      futUnmanagedRow?.symbol ??
      futConfigOpenRow?.symbol ??
      savedFutSymbol;
    if (!targetSymbol) return;
    setFutSymbol(targetSymbol);
    const side =
      (targetSymbol === futUnmanagedRow?.symbol
        ? futUnmanagedRow.side
        : targetSymbol === futConfigOpenRow?.symbol
          ? futConfigOpenRow.side
          : savedFutCfg?.side) ?? futSide;
    if (side === "LONG" || side === "SHORT") setFutSide(side);
    setFutMsg(t("bots_futures_realign_done", { symbol: targetSymbol }));
  }

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
            ...smartConfigFields(futSmart),
            ...futExitConfigFields(futExit),
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = typeof json.error === "string" ? json.error : "";
        if (
          code === "bots_futures_other_symbol_open" &&
          typeof json.openSymbol === "string"
        ) {
          setFutMsg(
            t("bots_futures_other_symbol_open", { symbol: json.openSymbol }),
          );
          return;
        }
        setFutMsg(code ? botsApiMessage(code, t) : t("bots_err_generic"));
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
        setGridMsg(code ? botsApiMessage(code, t) : t("bots_err_generic"));
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
      <header className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          {t("bots_title")}
        </h1>
        <UiInfoTip tip={t("bots_intro_tip")} />
        {!data.keysEncryptionConfigured ? (
          <p className="w-full rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
            {t("bots_encryption_missing")}
          </p>
        ) : null}
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

      {data.isSuperAdmin ? (
        <p className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-2 text-sm text-violet-950 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-100">
          {t("bots_privileged_badge")}
        </p>
      ) : null}

      <BotsKeysHub
        credentials={data.credentials}
        accountBilling={accountBilling}
        onBillingChange={(env) => {
          setAccountBilling(env);
          setFutOpenRows([]);
          setLogs([]);
        }}
        tradeLiveEnabled={Boolean(data.tradeMode?.tradeLiveEnabled)}
        isSuperAdmin={Boolean(data.isSuperAdmin)}
        busy={busy}
        keysHubMsg={keysHubMsg}
        onConnect={openKeysHub}
        onRevoke={(env) => void revokeKeys(env)}
        t={t}
      />

      {data.cronHealth ? (
        <BotsCronHealthBar health={data.cronHealth} t={t} />
      ) : null}

      {activeTab === "dca_spot" && !dcaSub ? (
        <section className="mt-4 rounded-2xl border border-stone-200 bg-white p-6 text-center dark:border-stone-700 dark:bg-stone-900">
          <BotPlanIcon planId="dca_spot" className="mx-auto h-10 w-10 text-emerald-600" />
          <h2 className="mt-3 text-lg font-bold">
            <UiSectionTitle
              title={t("bots_plan_dca")}
              tip={t(BOT_PLAN_DESC_KEY.dca_spot)}
            />
          </h2>
          <button
            type="button"
            onClick={() => startWizard("dca_spot")}
            className="mt-4 w-full max-w-xs rounded-xl bg-violet-700 py-3 text-sm font-semibold text-white"
          >
            {t("bots_subscribe_cta")}
          </button>
        </section>
      ) : null}



      {activeTab === "grid_spot" && !gridSub ? (
        <section className="mt-4 rounded-2xl border border-stone-200 bg-white p-6 text-center dark:border-stone-700 dark:bg-stone-900">
          <BotPlanIcon planId="grid_spot" className="mx-auto h-10 w-10 text-violet-600" />
          <h2 className="mt-3 text-lg font-bold">
            <UiSectionTitle
              title={t("bots_plan_grid")}
              tip={t(BOT_PLAN_DESC_KEY.grid_spot)}
            />
          </h2>
          <button
            type="button"
            onClick={() => startWizard("grid_spot")}
            className="mt-4 w-full max-w-xs rounded-xl bg-violet-700 py-3 text-sm font-semibold text-white"
          >
            {t("bots_subscribe_cta")}
          </button>
        </section>
      ) : null}


      {activeTab === "futures_um" && !futSub ? (
        <section className="mt-4 rounded-2xl border border-stone-200 bg-white p-6 text-center dark:border-stone-700 dark:bg-stone-900">
          <BotPlanIcon planId="futures_um" className="mx-auto h-10 w-10 text-amber-600" />
          <h2 className="mt-3 text-lg font-bold">
            <UiSectionTitle
              title={t("bots_plan_futures")}
              tip={t(BOT_PLAN_DESC_KEY.futures_um)}
            />
          </h2>
          <button
            type="button"
            onClick={() => startWizard("futures_um")}
            className="mt-4 w-full max-w-xs rounded-xl bg-violet-700 py-3 text-sm font-semibold text-white"
          >
            {t("bots_subscribe_cta")}
          </button>
        </section>
      ) : null}

      {activeTab === "dca_spot" && dcaSub && !dcaKeysOk ? (
        <p className="mt-4 flex items-center gap-1 text-sm text-stone-600 dark:text-stone-400">
          {t("bots_keys_required_short")}
          <UiInfoTip tip={t("bots_keys_required_spot")} />
        </p>
      ) : null}

      {activeTab === "grid_spot" && gridSub && !gridKeysOk ? (
        <p className="mt-4 flex items-center gap-1 text-sm text-stone-600 dark:text-stone-400">
          {t("bots_keys_required_short")}
          <UiInfoTip tip={t("bots_keys_required_spot")} />
        </p>
      ) : null}

      {activeTab === "futures_um" && futSub && !futKeysOk ? (
        <p className="mt-4 flex items-center gap-1 text-sm text-stone-600 dark:text-stone-400">
          {t("bots_keys_required_short")}
          <UiInfoTip tip={t("bots_keys_required_futures")} />
        </p>
      ) : null}

      {activeTab === "dca_spot" && dcaSub && dcaKeysOk ? (
        <section className="mt-4 rounded-2xl border border-emerald-700/40 bg-emerald-50/60 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/20">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-emerald-950 dark:text-emerald-100">
              <UiSectionTitle
                title={t("bots_dca_config_title")}
                tip={t("bots_dca_config_tip")}
              />
            </h2>
            <BotStatusBadge
              status={dcaInst?.status ?? "none"}
              t={t}
            />
          </div>
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
          {billingMismatchBanner(dcaInst)}
          <SmartModePanel
            planId="dca_spot"
            symbol={dcaSymbol}
            billing={accountBilling}
            smart={dcaSmart}
            setSmart={setDcaSmart}
            smartOptions={data.smartOptions}
            t={t}
          />
          {dcaInst?.lastExecutedAt && instEnvAligned(dcaInst) ? (
            <p className="mt-2 text-xs text-stone-500">
              {t("bots_dca_last_run")}: {new Date(dcaInst.lastExecutedAt).toLocaleString()}
            </p>
          ) : null}
          {dcaInst?.lastError && instEnvAligned(dcaInst) ? (
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
          <BotStrategyLivePanel
            planId="dca_spot"
            billing={accountBilling}
            botActive={
              dcaInst?.status === "active" && instEnvAligned(dcaInst)
            }
            keysOk={dcaKeysOk}
            logs={logs}
            onLogsRefresh={refreshDcaLogs}
            t={t}
          />
        </section>
      ) : null}

      {activeTab === "grid_spot" && gridSub && gridKeysOk ? (
        <section className="mt-4 rounded-2xl border border-violet-700/40 bg-violet-50/40 p-4 dark:border-violet-800/50 dark:bg-violet-950/15">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-violet-950 dark:text-violet-100">
              <UiSectionTitle
                title={t("bots_grid_config_title")}
                tip={t("bots_grid_config_tip")}
              />
            </h2>
            <BotStatusBadge
              status={gridInst?.status ?? "none"}
              lastExecutedAt={gridInst?.lastExecutedAt}
              t={t}
            />
          </div>
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
          {billingMismatchBanner(gridInst)}
          <SmartModePanel
            planId="grid_spot"
            symbol={gridSymbol}
            billing={accountBilling}
            smart={gridSmart}
            setSmart={setGridSmart}
            smartOptions={data.smartOptions}
            t={t}
          />
          {gridInst?.lastExecutedAt && instEnvAligned(gridInst) ? (
            <p className="mt-2 text-xs text-stone-500">
              {t("bots_dca_last_run")}: {new Date(gridInst.lastExecutedAt).toLocaleString()}
            </p>
          ) : null}
          {gridInst?.lastError && instEnvAligned(gridInst) ? (
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
          <BotStrategyLivePanel
            planId="grid_spot"
            billing={accountBilling}
            botActive={
              gridInst?.status === "active" && instEnvAligned(gridInst)
            }
            keysOk={gridKeysOk}
            logs={logs}
            onLogsRefresh={refreshGridLogs}
            t={t}
          />
        </section>
      ) : null}

      {activeTab === "futures_um" && futSub && futKeysOk ? (
        <section className="mt-4 rounded-2xl border border-amber-600/50 bg-amber-50/50 p-4 dark:border-amber-700/50 dark:bg-amber-950/20">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-amber-950 dark:text-amber-100">
              <UiSectionTitle
                title={t("bots_futures_config_title")}
                tip={t("bots_futures_config_tip")}
              />
            </h2>
            <BotStatusBadge
              status={futInst?.status ?? "none"}
              lastExecutedAt={
                instEnvAligned(futInst) ? futInst?.lastExecutedAt : undefined
              }
              monitoringOpen={
                instEnvAligned(futInst) &&
                futInst?.status === "active" &&
                futHasConfigOpen
              }
              t={t}
            />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {billingMismatchBanner(futInst)}
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
            {futFormSymbolDirty && savedFutSymbol ? (
              <p className="rounded-lg border border-amber-400/60 bg-amber-100/80 px-3 py-2 text-xs text-amber-950 dark:border-amber-600/50 dark:bg-amber-950/40 dark:text-amber-100 sm:col-span-2">
                {t("bots_futures_symbol_pending", {
                  saved: savedFutSymbol,
                  next: futSymbol,
                })}
              </p>
            ) : null}
            {futHasUnmanagedOpen ? (
              <p className="rounded-lg border border-rose-400/60 bg-rose-50/90 px-3 py-2 text-xs text-rose-900 dark:border-rose-700/50 dark:bg-rose-950/40 dark:text-rose-100 sm:col-span-2">
                {t("bots_futures_position_other")}
              </p>
            ) : null}
            {futShowRealign ? (
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={realignFuturesForm}
                  className="w-full rounded-lg border border-amber-600/60 bg-white px-3 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-50 dark:border-amber-500/50 dark:bg-stone-900 dark:text-amber-100 dark:hover:bg-amber-950/50"
                >
                  {t("bots_futures_realign_form")}
                </button>
              </div>
            ) : null}
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
            billing={accountBilling}
            smart={futSmart}
            setSmart={setFutSmart}
            smartOptions={data.smartOptions}
            t={t}
          />
          <FuturesSmartExitPanel
            exit={futExit}
            setExit={setFutExit}
            entryTimeframe={futSmart.timeframe}
            timeframes={data.smartOptions?.timeframes ?? ["15m", "1h", "4h"]}
            t={t}
          />
          {futInst?.status === "active" && !instEnvAligned(futInst) ? (
            <p className="mt-2 text-xs text-violet-800 dark:text-violet-200">
              {t("bots_logs_other_env")}
            </p>
          ) : null}
          {futInst?.lastExecutedAt && instEnvAligned(futInst) ? (
            <p className="mt-2 text-xs text-stone-500">
              {t("bots_dca_last_run")}:{" "}
              {new Date(futInst.lastExecutedAt).toLocaleString()}
            </p>
          ) : null}
          {futInst?.lastError && instEnvAligned(futInst) ? (
            <p className="mt-2 rounded-lg bg-rose-50 px-2 py-1.5 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
              {formatBotRuntimeError(futInst.lastError, t)}
            </p>
          ) : null}
          {futMsg ? <p className="mt-2 text-sm text-amber-900">{futMsg}</p> : null}
          <BotRunControls
            status={futInst?.status ?? "none"}
            busy={busy}
            variant="amber"
            monitoringOpen={instEnvAligned(futInst) && futHasConfigOpen}
            monitoringLabel={t("bots_futures_monitoring_open")}
            startLabel={t("bots_futures_start")}
            pauseLabel={t("bots_futures_pause")}
            onStart={() => void saveFutures("active")}
            onPause={() => void saveFutures("paused")}
          />
          <p className="mt-3 text-center">
            <Link
              href="/app/trade/futures/guide"
              className="text-xs font-medium text-amber-800 underline decoration-amber-600/50 underline-offset-2 dark:text-amber-200"
            >
              {t("trade_ui_learn_futures")}
            </Link>
          </p>
          <BotStrategyLivePanel
            planId="futures_um"
            billing={accountBilling}
            botActive={
              futInst?.status === "active" && instEnvAligned(futInst)
            }
            keysOk={futKeysOk}
            logs={logs}
            onLogsRefresh={refreshFutLogs}
            onOpenChange={setFutOpenRows}
            t={t}
          />
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
                  disabled={
                    !data.tradeMode?.tradeLiveEnabled && !data.isSuperAdmin
                  }
                  onClick={() => setWizardBilling("live")}
                  className={`flex-1 rounded-xl border-2 py-2 text-sm font-bold disabled:opacity-40 ${
                    wizardBilling === "live"
                      ? "border-rose-500 bg-rose-600 text-white"
                      : "border-stone-200 bg-stone-200 dark:border-stone-600 dark:bg-stone-800"
                  }`}
                >
                  <span className="block">{t("bots_billing_live")}</span>
                  <span className="text-[10px] font-medium opacity-90">
                    {t("bots_billing_live_sub")}
                  </span>
                </button>
              </div>
              {wizardBilling === "live" &&
              !data.tradeMode?.tradeLiveEnabled &&
              !data.isSuperAdmin ? (
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  {t("bots_live_disabled_hint")}
                </p>
              ) : null}
              <button
                type="button"
                disabled={
                  busy ||
                  (wizardBilling === "live" &&
                    !data.tradeMode?.tradeLiveEnabled &&
                    !data.isSuperAdmin)
                }
                onClick={() => {
                  if (data.isSuperAdmin) {
                    setAccountBilling(wizardBilling);
                    setWizardStep(3);
                    return;
                  }
                  const sub = activeSub(wizardPlan, wizardBilling);
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
              <p className="flex items-center gap-1 text-sm font-medium">
                {t("bots_confirm_subscribe")}
                <UiInfoTip tip={t("bots_subscribe_confirm_tip")} />
              </p>
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
              <p className="flex flex-wrap items-center gap-1 text-sm font-medium">
                {t("bots_connect_keys")}
                <UiInfoTip
                  tip={
                    wizardBilling === "live"
                      ? t("bots_wizard_steps_live_tip")
                      : t("bots_wizard_steps_tip")
                  }
                />
                <UiInfoTip
                  variant="warn"
                  tip={
                    wizardBilling === "live"
                      ? `${t("bots_live_real_money_banner")} ${wizardPlan === "futures_um" ? t("bots_env_live_futures_hint") : t("bots_env_live_spot_hint")} ${t("bots_live_ip_note")}`
                      : wizardPlan === "futures_um"
                        ? t("bots_env_demo_futures_hint")
                        : t("bots_env_demo_spot_hint")
                  }
                />
              </p>
              {credFor(wizardBilling) ? (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-950/30">
                  <p className="text-sm text-emerald-800 dark:text-emerald-200">
                    {t("bots_keys_connected", {
                      hint: credFor(wizardBilling)!.apiKeyHint,
                    })}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    {formatBotsCredentialValidationLine(
                      credFor(wizardBilling),
                      t,
                    )}
                  </p>
                </div>
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
                <p
                  className={
                    connectOk
                      ? "text-sm text-emerald-700 dark:text-emerald-300"
                      : "text-sm text-rose-800 dark:text-rose-200"
                  }
                >
                  {connectMsg}
                </p>
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

      {activeTab !== "futures_um" ? (
        <p className="text-center text-sm">
          <Link
            href="/app/trade/futures/guide"
            className="text-emerald-700 underline dark:text-emerald-300"
          >
            {t("trade_ui_learn_futures")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}

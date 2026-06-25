"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import type { BotPlanId } from "@/lib/bot-config";
import type { Messages } from "@/i18n/messages";
import {
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
import {
  buildCoordinatedDcaConfig,
  buildCoordinatedFuturesConfig,
  buildCoordinatedGridConfig,
  coordinatedStyleFromProfile,
  parseCoordinatedStyle,
  type BotCoordinatedStyleId,
} from "@/lib/bot-coordinated-config";
import {
  getFuturesTraderProfilePreset,
  parseTraderProfileId,
} from "@/lib/bot-futures-trader-profiles";
import { BotStrategyLivePanel } from "@/components/trade/bot-strategy-live-panel";
import { BotRunControls } from "@/components/trade/bot-run-controls";
import type { BotOpenPositionRow } from "@/lib/bot-positions-types";
import { parseBotFuturesConfig } from "@/lib/bot-futures-config";
import {
  BotPlanIcon,
  BotStrategyTabBar,
  type BotTabRunState,
} from "@/components/trade/bot-strategy-icons";
import { BotCoordinationRail } from "@/components/trade/bot-coordination-rail";
import { BotSignalPreview } from "@/components/trade/bot-signal-preview";
import { BotInstanceStatsCard } from "@/components/trade/bot-instance-stats-card";
import {
  BotTemplatePicker,
  type BotTemplateView,
} from "@/components/trade/bot-template-picker";
import { BotCommunityActions } from "@/components/trade/bot-community-actions";
import { BotCopyFollowPanel } from "@/components/trade/bot-copy-follow-panel";
import {
  buildTemplateFormPatch,
  getBotTemplate,
  type BotTemplateId,
} from "@/lib/bot-templates";
import { BotsCronAlert } from "@/components/trade/bots-cron-alert";
import { BotsHubHero } from "@/components/trade/bots-hub-hero";
import { BotsAiGuideButton } from "@/components/trade/bots-page-chrome";
import { BotsSetupWizard } from "@/components/trade/bots-setup-wizard";
import {
  BotFlowBtn,
  BotFlowCard,
  BotFlowCategory,
  BotFlowError,
  BotFlowField,
  BotFlowInput,
  BotFlowSelect,
  BotFormGrid,
  BotPlanCard,
  BotStatusPill,
} from "@/components/trade/bots-flow-ui";

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
  entryIntervalRemainingMinutes?: number;
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
  templates?: BotTemplateView[];
  demoTrialEligible?: Record<BotPlanId, boolean>;
};

function botTabRunState(
  subscribed: boolean,
  inst: { status: "active" | "paused" } | undefined,
): BotTabRunState {
  if (!subscribed) return "idle";
  if (inst?.status === "active") return "running";
  if (inst?.status === "paused") return "paused";
  return "idle";
}

function BotStatusBadge({
  status,
  lastExecutedAt,
  entryIntervalRemainingMinutes = 0,
  monitoringOpen,
  t,
}: {
  status: "active" | "paused" | "none";
  lastExecutedAt?: string | null;
  entryIntervalRemainingMinutes?: number;
  monitoringOpen?: boolean;
  t: (k: keyof Messages, vars?: Record<string, string | number>) => string;
}) {
  if (status === "none") {
    return <BotStatusPill tone="idle">{t("bots_status_not_started")}</BotStatusPill>;
  }
  if (status === "paused") {
    return <BotStatusPill tone="paused">{t("bots_status_paused")}</BotStatusPill>;
  }
  if (monitoringOpen) {
    return <BotStatusPill tone="open">{t("bots_status_position_open")}</BotStatusPill>;
  }
  if (entryIntervalRemainingMinutes > 0) {
    return (
      <BotStatusPill tone="wait">
        {t("bots_status_entry_interval", {
          minutes: String(entryIntervalRemainingMinutes),
        })}
      </BotStatusPill>
    );
  }
  if (!lastExecutedAt) {
    return <BotStatusPill tone="active">{t("bots_status_ready")}</BotStatusPill>;
  }
  return <BotStatusPill tone="active">{t("bots_status_active")}</BotStatusPill>;
}

function billingEnvLabel(
  billing: "demo" | "live",
  t: (k: keyof Messages) => string,
) {
  return billing === "demo" ? t("bots_billing_demo") : t("bots_billing_live");
}

function applyCoordinatedStyleDefaults(
  style: BotCoordinatedStyleId,
  setters: {
    setFutInterval: (h: number) => void;
    setFutSl: (n: number) => void;
    setFutTp: (n: number) => void;
  },
) {
  const preset = getFuturesTraderProfilePreset(style);
  setters.setFutInterval(preset.intervalHours);
  setters.setFutSl(preset.stopLossPct);
  setters.setFutTp(preset.takeProfitPct);
}

export function BotsTradingClient() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
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
  const [futStyle, setFutStyle] = useState<BotCoordinatedStyleId>("day");
  const [logs, setLogs] = useState<BotLogRow[]>([]);
  const [activeTab, setActiveTab] = useState<BotPlanId>("futures_um");
  const [accountBilling, setAccountBilling] = useState<"demo" | "live">("demo");
  const [keysHubMsg, setKeysHubMsg] = useState<string | null>(null);
  const [futOpenRows, setFutOpenRows] = useState<BotOpenPositionRow[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<BotTemplateId | null>(null);
  const [tplMsg, setTplMsg] = useState<string | null>(null);
  const billingDefaultApplied = useRef(false);
  const templateFromUrlApplied = useRef(false);

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

  const applyTemplate = useCallback(
    async (templateId: BotTemplateId) => {
      const template = getBotTemplate(templateId);
      if (!template) return;
      setActiveTab(template.planId);
      setActiveTemplateId(templateId);
      setTplMsg(null);

      let mark: number | undefined;
      if (template.planId === "grid_spot") {
        try {
          const res = await fetch(
            `/api/trade/ticker?symbol=${template.symbol}`,
            { cache: "no-store" },
          );
          const json = await res.json().catch(() => ({}));
          const last = Number(json?.lastPrice ?? json?.price);
          if (Number.isFinite(last) && last > 0) mark = last;
        } catch {
          /* fallback defaults in buildTemplateFormPatch */
        }
      }

      const patch = buildTemplateFormPatch(template, mark);
      setFutStyle(patch.style);
      if (patch.dca) {
        setDcaSymbol(patch.dca.symbol);
        setDcaAmount(patch.dca.quoteAmountUsdt);
        setDcaInterval(patch.dca.intervalHours);
      }
      if (patch.grid) {
        setGridSymbol(patch.grid.symbol);
        setGridLow(patch.grid.priceLow);
        setGridHigh(patch.grid.priceHigh);
        setGridCount(patch.grid.gridCount);
        setGridQuote(patch.grid.quotePerGrid);
        setGridRefresh(patch.grid.refreshHours);
      }
      if (patch.futures) {
        setFutSymbol(patch.futures.symbol);
        setFutSide(patch.futures.side);
        setFutLeverage(patch.futures.leverage);
        setFutMargin(patch.futures.marginUsdt);
        setFutInterval(patch.futures.intervalHours);
        setFutSl(patch.futures.stopLossPct);
        setFutTp(patch.futures.takeProfitPct);
      }
      setTplMsg(t("bots_tpl_applied"));
    },
    [t],
  );

  useEffect(() => {
    if (!data || templateFromUrlApplied.current) return;

    const billingParam = searchParams.get("billing");
    if (billingParam === "demo" || billingParam === "live") {
      setAccountBilling(billingParam);
    }

    const raw = searchParams.get("template");
    if (raw && getBotTemplate(raw)) {
      templateFromUrlApplied.current = true;
      void applyTemplate(raw as BotTemplateId);
      return;
    }

    const symbol = searchParams.get("symbol");
    const side = searchParams.get("side");
    const plan = searchParams.get("plan");
    if (symbol && plan === "futures_um") {
      templateFromUrlApplied.current = true;
      setActiveTab("futures_um");
      const sym = symbol.toUpperCase();
      setFutSymbol(sym);
      if (side?.toUpperCase() === "SHORT") setFutSide("SHORT");
      else setFutSide("LONG");
    }
  }, [data, searchParams, applyTemplate]);

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
    if (!data?.instances) return;

    const inst = data.instances.find(
      (i) => i.planId === "dca_spot" && i.billing === accountBilling,
    );
    const cfg = inst?.config as {
      symbol?: string;
      quoteAmountUsdt?: string;
      intervalHours?: number;
    } | undefined;
    if (cfg?.symbol) setDcaSymbol(cfg.symbol);
    if (cfg?.quoteAmountUsdt) setDcaAmount(cfg.quoteAmountUsdt);
    if (cfg?.intervalHours) setDcaInterval(cfg.intervalHours);

    const ginst = data.instances.find(
      (i) => i.planId === "grid_spot" && i.billing === accountBilling,
    );
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

    const finst = data.instances.find(
      (i) => i.planId === "futures_um" && i.billing === accountBilling,
    );
    if (finst) {
      const fcfg = finst.config as {
        symbol?: string;
        side?: "LONG" | "SHORT";
        leverage?: number;
        marginUsdt?: string;
        intervalHours?: number;
        stopLossPct?: number;
        takeProfitPct?: number;
      };
      if (fcfg?.symbol) setFutSymbol(fcfg.symbol);
      if (fcfg?.side) setFutSide(fcfg.side);
      if (fcfg?.leverage) setFutLeverage(fcfg.leverage);
      if (fcfg?.marginUsdt) setFutMargin(fcfg.marginUsdt);
      if (fcfg?.intervalHours) setFutInterval(fcfg.intervalHours);
      if (fcfg?.stopLossPct) setFutSl(fcfg.stopLossPct);
      if (fcfg?.takeProfitPct) setFutTp(fcfg.takeProfitPct);
      setFutStyle(
        coordinatedStyleFromProfile(
          parseTraderProfileId(finst.config?.traderProfile),
        ),
      );
    } else {
      applyCoordinatedStyleDefaults("day", {
        setFutInterval,
        setFutSl,
        setFutTp,
      });
    }
  }, [data?.instances, accountBilling]);

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
    return data?.subscriptions.find(
      (s) => s.planId === planId && s.billing === billing,
    );
  }

  function subOnOtherBilling(planId: BotPlanId) {
    return data?.subscriptions.find(
      (s) => s.planId === planId && s.billing !== accountBilling,
    );
  }

  function billingSubBanner(planId: BotPlanId) {
    if (activeSub(planId)) return null;
    const other = subOnOtherBilling(planId);
    if (!other) return null;
    return (
      <BotFlowError>
        {t("bots_billing_sub_required", {
          env: billingEnvLabel(accountBilling, t),
          other: billingEnvLabel(other.billing, t),
        })}
      </BotFlowError>
    );
  }

  function canStartPlan(
    sub: Subscription | undefined,
    keysOk: boolean,
    inst: BotInstance | undefined,
    cronHealth?: CronHealthSnapshot,
  ) {
    if (!sub || !keysOk) return false;
    if (!instEnvAligned(inst)) return false;
    if (cronHealth && (!cronHealth.configured || cronHealth.stale)) {
      return false;
    }
    return true;
  }

  function startBlockReason(
    planId: BotPlanId,
    sub: Subscription | undefined,
    keysOk: boolean,
    inst: BotInstance | undefined,
    cronHealth?: CronHealthSnapshot,
    extra?: boolean,
  ): string | null {
    if (extra) return t("bots_start_block_position");
    if (!sub) return t("bots_start_block_sub");
    if (!keysOk) {
      return planId === "futures_um"
        ? t("bots_keys_required_futures")
        : t("bots_keys_required_spot");
    }
    if (!instEnvAligned(inst)) return t("bots_start_block_billing");
    if (cronHealth && !cronHealth.configured) return t("bots_cron_blocked_off");
    if (cronHealth?.stale) {
      return t("bots_cron_blocked_stale", {
        ago: String(cronHealth.minutesSinceLastRun ?? "?"),
      });
    }
    return null;
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
    return data?.instances.find(
      (i) => i.planId === planId && i.billing === accountBilling,
    );
  }

  function instEnvAligned(inst: { billing: "demo" | "live" } | undefined) {
    return !inst || inst.billing === accountBilling;
  }

  function billingMismatchBanner(inst: { billing: "demo" | "live" } | undefined) {
    if (!inst || inst.billing === accountBilling) return null;
    return (
      <BotFlowError>
        {t("bots_billing_view_mismatch", {
          saved: billingEnvLabel(inst.billing, t),
          viewing: billingEnvLabel(accountBilling, t),
        })}
      </BotFlowError>
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
          config: buildCoordinatedDcaConfig(
            {
              symbol: dcaSymbol,
              quoteAmountUsdt: dcaAmount.trim().replace(",", "."),
              intervalHours: dcaInterval,
            },
            futStyle,
          ),
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

  function templateIdForPlan(planId: BotPlanId): BotTemplateId | null {
    if (activeTemplateId) {
      const t = getBotTemplate(activeTemplateId);
      if (t?.planId === planId) return activeTemplateId;
    }
    if (planId === "dca_spot") {
      return futStyle === "swing" ? "dca_swing_eth" : "dca_day_btc";
    }
    if (planId === "grid_spot") {
      return futStyle === "swing" ? "grid_swing_sol" : "grid_day_btc";
    }
    return futStyle === "swing" ? "fut_swing_eth_long" : "fut_day_btc_long";
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
  /** One DB row per user+plan; billing column updates on save (not separate demo/live rows). */
  const futInstRow = data?.instances.find((i) => i.planId === "futures_um");
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

  const botTabRunStates: Record<BotPlanId, BotTabRunState> = {
    futures_um: botTabRunState(Boolean(futSub), futInst),
    grid_spot: botTabRunState(Boolean(gridSub), gridInst),
    dca_spot: botTabRunState(Boolean(dcaSub), dcaInst),
  };

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
      const futConfigPayload = buildCoordinatedFuturesConfig(
        {
          symbol: futSymbol,
          side: futSide,
          leverage: futLeverage,
          marginUsdt: futMargin.trim().replace(",", "."),
          intervalHours: futInterval,
          stopLossPct: futSl,
          takeProfitPct: futTp,
        },
        futStyle,
      );
      if (!parseBotFuturesConfig(futConfigPayload)) {
        setFutMsg(t("bots_invalid_futures_config"));
        return;
      }
      const res = await fetch("/api/trade/bots/instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: "futures_um",
          billing: sub.billing,
          status,
          config: futConfigPayload,
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
          config: buildCoordinatedGridConfig(
            {
              symbol: gridSymbol,
              priceLow: gridLow.trim().replace(",", "."),
              priceHigh: gridHigh.trim().replace(",", "."),
              gridCount,
              quotePerGrid: gridQuote.trim().replace(",", "."),
              refreshHours: gridRefresh,
            },
            futStyle,
          ),
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
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {err}
        </p>
      );
    }
    return (
      <div className="space-y-4 pt-6 animate-pulse" aria-busy="true">
        <div className="h-8 w-56 rounded-lg bg-[color:var(--fd-mint)]/60" />
        <div className="h-20 rounded-2xl bg-[color:var(--fd-mint)]/40" />
        <div className="h-36 rounded-2xl bg-[color:var(--fd-mint)]/40" />
        <div className="h-36 rounded-2xl bg-[color:var(--fd-mint)]/40" />
        <p className="text-center text-sm text-[color:var(--fd-muted)]">{t("bots_loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-10 pt-2">
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="min-w-0 flex-1 text-lg font-bold text-[color:var(--fd-text)]">
            {t("bots_title")}
          </h1>
          <div className="relative shrink-0">
            <BotsAiGuideButton t={t} />
          </div>
        </div>
        <BotsHubHero t={t} />
        <BotsCronAlert health={data.cronHealth} t={t} />
        {!data.keysEncryptionConfigured ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {t("bots_encryption_missing")}
          </p>
        ) : null}
      </header>

      <BotStrategyTabBar
        active={activeTab}
        onSelect={setActiveTab}
        runState={botTabRunStates}
        categoryTitle={t("bots_category_bots")}
        labels={{
          dca_spot: t("bots_tab_dca"),
          grid_spot: t("bots_tab_grid"),
          futures_um: t("bots_tab_futures"),
        }}
      />

      {data.isSuperAdmin ? (
        <p className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-medium text-violet-900">
          {t("bots_privileged_badge")}
        </p>
      ) : null}

      <BotFlowCategory
        title={t("bots_category_setup")}
        icon={
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 15a3 3 0 100-6 3 3 0 000 6z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        }
        className="space-y-2"
      >
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
      </BotFlowCategory>

      {activeTab === "dca_spot" && !dcaSub ? (
        <BotFlowCard className="mt-4 text-center">
          {billingSubBanner("dca_spot")}
          <BotPlanIcon planId="dca_spot" className="mx-auto h-10 w-10 text-[color:var(--fd-primary)]" />
          <h2 className="mt-2 text-base font-bold text-[color:var(--fd-text)]">
            {t("bots_plan_dca")}
          </h2>
          {data.demoTrialEligible?.dca_spot && accountBilling === "demo" ? (
            <p className="mt-1 text-xs font-bold text-[color:var(--fd-primary)]">
              {t("bots_demo_trial_badge")}
            </p>
          ) : null}
          <BotFlowBtn
            variant="violet"
            className="mx-auto mt-4 w-full max-w-xs"
            onClick={() => startWizard("dca_spot")}
          >
            {t("bots_subscribe_cta")}
          </BotFlowBtn>
        </BotFlowCard>
      ) : null}



      {activeTab === "grid_spot" && !gridSub ? (
        <BotFlowCard className="mt-4 text-center">
          {billingSubBanner("grid_spot")}
          <BotPlanIcon planId="grid_spot" className="mx-auto h-10 w-10 text-violet-700" />
          <h2 className="mt-2 text-base font-bold text-[color:var(--fd-text)]">
            {t("bots_plan_grid")}
          </h2>
          {data.demoTrialEligible?.grid_spot && accountBilling === "demo" ? (
            <p className="mt-1 text-xs font-bold text-[color:var(--fd-primary)]">
              {t("bots_demo_trial_badge")}
            </p>
          ) : null}
          <BotFlowBtn
            variant="violet"
            className="mx-auto mt-4 w-full max-w-xs"
            onClick={() => startWizard("grid_spot")}
          >
            {t("bots_subscribe_cta")}
          </BotFlowBtn>
        </BotFlowCard>
      ) : null}


      {activeTab === "futures_um" && !futSub ? (
        <BotFlowCard className="mt-4 text-center">
          {billingSubBanner("futures_um")}
          <BotPlanIcon planId="futures_um" className="mx-auto h-10 w-10 text-amber-800" />
          <h2 className="mt-2 text-base font-bold text-[color:var(--fd-text)]">
            {t("bots_plan_futures")}
          </h2>
          {data.demoTrialEligible?.futures_um && accountBilling === "demo" ? (
            <p className="mt-1 text-xs font-bold text-[color:var(--fd-primary)]">
              {t("bots_demo_trial_badge")}
            </p>
          ) : null}
          <BotFlowBtn
            variant="violet"
            className="mx-auto mt-4 w-full max-w-xs"
            onClick={() => startWizard("futures_um")}
          >
            {t("bots_subscribe_cta")}
          </BotFlowBtn>
        </BotFlowCard>
      ) : null}

      {activeTab === "dca_spot" && dcaSub && !dcaKeysOk ? (
        <BotFlowError>{t("bots_keys_required_short")}</BotFlowError>
      ) : null}

      {activeTab === "grid_spot" && gridSub && !gridKeysOk ? (
        <BotFlowError>{t("bots_keys_required_short")}</BotFlowError>
      ) : null}

      {activeTab === "futures_um" && futSub && !futKeysOk ? (
        <BotFlowError>{t("bots_keys_required_short")}</BotFlowError>
      ) : null}

      {activeTab === "dca_spot" && dcaSub && dcaKeysOk ? (
        <BotPlanCard planId="dca_spot" className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-[color:var(--fd-text)]">
              {t("bots_dca_config_title")}
            </h2>
            <BotStatusBadge
              status={dcaInst?.status ?? "none"}
              t={t}
            />
          </div>
          {(data.templates?.length ?? 0) > 0 ? (
            <div className="mt-3">
              <BotTemplatePicker
                planId="dca_spot"
                templates={data.templates ?? []}
                activeId={activeTemplateId}
                onSelect={(id) => void applyTemplate(id)}
                t={t}
              />
              {tplMsg && activeTab === "dca_spot" ? (
                <p className="mt-1 text-[11px] font-medium text-[color:var(--fd-primary)]">{tplMsg}</p>
              ) : null}
            </div>
          ) : null}
          <div className="mt-3">
            <BotInstanceStatsCard planId="dca_spot" billing={accountBilling} t={t} />
          </div>
          <div className="mt-3">
            <BotCommunityActions
              planId="dca_spot"
              billing={accountBilling}
              templateId={templateIdForPlan("dca_spot")}
              t={t}
            />
            <div className="mt-2">
              <BotCopyFollowPanel planId="dca_spot" billing={accountBilling} t={t} />
            </div>
          </div>
          <BotFlowCategory title={t("bots_category_basics")} className="mt-3">
            <div className="space-y-3">
              {billingMismatchBanner(dcaInst)}
              <BotFlowField label={t("bots_symbol_label")}>
                <BotFlowSelect
                  value={dcaSymbol}
                  onChange={(e) => setDcaSymbol(e.target.value)}
                >
                  {(data.dcaOptions?.symbols ?? ["BTCUSDT"]).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </BotFlowSelect>
              </BotFlowField>
              <BotFormGrid>
                <BotFlowField label={t("bots_dca_amount")}>
                  <BotFlowInput
                    value={dcaAmount}
                    onChange={(e) => setDcaAmount(e.target.value)}
                    inputMode="decimal"
                  />
                </BotFlowField>
                <BotFlowField label={t("bots_dca_interval")}>
                  <BotFlowSelect
                    value={dcaInterval}
                    onChange={(e) => setDcaInterval(Number(e.target.value))}
                  >
                    {(data.dcaOptions?.intervalHours ?? [24]).map((h) => (
                      <option key={h} value={h}>
                        {h}h
                      </option>
                    ))}
                  </BotFlowSelect>
                </BotFlowField>
              </BotFormGrid>
              <BotSignalPreview
                planId="dca_spot"
                symbol={dcaSymbol}
                billing={accountBilling}
                t={t}
              />
            </div>
          </BotFlowCategory>
          <BotFlowCategory title={t("bots_category_coordination")} className="mt-3">
            <BotCoordinationRail
              cronHealth={data.cronHealth}
              botStatus={dcaInst?.status ?? "none"}
              t={t}
            />
          </BotFlowCategory>
          <BotFlowCategory title={t("bots_category_execution")} className="mt-3">
            {dcaInst?.lastExecutedAt && instEnvAligned(dcaInst) ? (
              <p className="text-xs text-[color:var(--fd-muted)]">
                {t("bots_dca_last_run")}: {new Date(dcaInst.lastExecutedAt).toLocaleString()}
              </p>
            ) : null}
            {dcaInst?.lastError && instEnvAligned(dcaInst) ? (
              <BotFlowError>{formatBotRuntimeError(dcaInst.lastError, t)}</BotFlowError>
            ) : null}
            {dcaMsg ? (
              <p className="text-xs font-medium text-[color:var(--fd-primary)]">{dcaMsg}</p>
            ) : null}
            <BotRunControls
              status={dcaInst?.status ?? "none"}
              busy={busy}
              startDisabled={!canStartPlan(dcaSub, dcaKeysOk, dcaInst, data.cronHealth)}
              blockHint={startBlockReason("dca_spot", dcaSub, dcaKeysOk, dcaInst, data.cronHealth)}
              startLabel={t("bots_dca_start")}
              pauseLabel={t("bots_dca_pause")}
              runningLabel={t("bots_coord_running")}
              stoppedLabel={t("bots_coord_stopped")}
              onStart={() => void saveDca("active")}
              onPause={() => void saveDca("paused")}
            />
          </BotFlowCategory>
          <BotStrategyLivePanel
            planId="dca_spot"
            billing={accountBilling}
            botActive={
              dcaInst?.status === "active" && instEnvAligned(dcaInst)
            }
            paused={dcaInst?.status === "paused" && instEnvAligned(dcaInst)}
            keysOk={dcaKeysOk}
            logs={logs}
            onLogsRefresh={refreshDcaLogs}
            t={t}
          />
        </BotPlanCard>
      ) : null}

      {activeTab === "grid_spot" && gridSub && gridKeysOk ? (
        <BotPlanCard planId="grid_spot" className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-[color:var(--fd-text)]">
              {t("bots_grid_config_title")}
            </h2>
            <BotStatusBadge
              status={gridInst?.status ?? "none"}
              lastExecutedAt={gridInst?.lastExecutedAt}
              t={t}
            />
          </div>
          {(data.templates?.length ?? 0) > 0 ? (
            <div className="mt-3">
              <BotTemplatePicker
                planId="grid_spot"
                templates={data.templates ?? []}
                activeId={activeTemplateId}
                onSelect={(id) => void applyTemplate(id)}
                t={t}
              />
              {tplMsg && activeTab === "grid_spot" ? (
                <p className="mt-1 text-[11px] font-medium text-violet-800">{tplMsg}</p>
              ) : null}
            </div>
          ) : null}
          <div className="mt-3">
            <BotInstanceStatsCard planId="grid_spot" billing={accountBilling} t={t} />
          </div>
          <div className="mt-3">
            <BotCommunityActions
              planId="grid_spot"
              billing={accountBilling}
              templateId={templateIdForPlan("grid_spot")}
              t={t}
            />
            <div className="mt-2">
              <BotCopyFollowPanel planId="grid_spot" billing={accountBilling} t={t} />
            </div>
          </div>
          <BotFlowCategory title={t("bots_category_basics")} className="mt-3">
            <div className="space-y-3">
              {billingMismatchBanner(gridInst)}
              <BotFlowField label={t("bots_symbol_label")}>
                <BotFlowSelect
                  value={gridSymbol}
                  onChange={(e) => setGridSymbol(e.target.value)}
                >
                  {(data.gridOptions?.symbols ?? ["BTCUSDT"]).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </BotFlowSelect>
              </BotFlowField>
              <BotFormGrid>
                <BotFlowField label={t("bots_grid_low")}>
                  <BotFlowInput value={gridLow} onChange={(e) => setGridLow(e.target.value)} />
                </BotFlowField>
                <BotFlowField label={t("bots_grid_high")}>
                  <BotFlowInput value={gridHigh} onChange={(e) => setGridHigh(e.target.value)} />
                </BotFlowField>
                <BotFlowField label={t("bots_grid_count")}>
                  <BotFlowInput
                    type="number"
                    min={3}
                    max={15}
                    value={gridCount}
                    onChange={(e) => setGridCount(Number(e.target.value))}
                  />
                </BotFlowField>
                <BotFlowField label={t("bots_grid_quote")}>
                  <BotFlowInput value={gridQuote} onChange={(e) => setGridQuote(e.target.value)} />
                </BotFlowField>
              </BotFormGrid>
              <BotFlowField label={t("bots_grid_refresh")}>
                <BotFlowSelect
                  value={gridRefresh}
                  onChange={(e) => setGridRefresh(Number(e.target.value))}
                >
                  {(data.gridOptions?.refreshHours ?? [12]).map((h) => (
                    <option key={h} value={h}>
                      {h}h
                    </option>
                  ))}
                </BotFlowSelect>
              </BotFlowField>
              <BotSignalPreview
                planId="grid_spot"
                symbol={gridSymbol}
                billing={accountBilling}
                t={t}
              />
            </div>
          </BotFlowCategory>
          <BotFlowCategory title={t("bots_category_coordination")} className="mt-3">
            <BotCoordinationRail
              cronHealth={data.cronHealth}
              botStatus={gridInst?.status ?? "none"}
              t={t}
            />
          </BotFlowCategory>
          <BotFlowCategory title={t("bots_category_execution")} className="mt-3">
            {gridInst?.lastExecutedAt && instEnvAligned(gridInst) ? (
              <p className="text-xs text-[color:var(--fd-muted)]">
                {t("bots_dca_last_run")}: {new Date(gridInst.lastExecutedAt).toLocaleString()}
              </p>
            ) : null}
            {gridInst?.lastError && instEnvAligned(gridInst) ? (
              <BotFlowError>{formatBotRuntimeError(gridInst.lastError, t)}</BotFlowError>
            ) : null}
            {gridMsg ? (
              <p className="text-xs font-medium text-violet-800">{gridMsg}</p>
            ) : null}
            <BotRunControls
              status={gridInst?.status ?? "none"}
              busy={busy}
              variant="violet"
              startDisabled={!canStartPlan(gridSub, gridKeysOk, gridInst, data.cronHealth)}
              blockHint={startBlockReason("grid_spot", gridSub, gridKeysOk, gridInst, data.cronHealth)}
              startLabel={t("bots_grid_start")}
              pauseLabel={t("bots_grid_pause")}
              runningLabel={t("bots_coord_running")}
              stoppedLabel={t("bots_coord_stopped")}
              onStart={() => void saveGrid("active")}
              onPause={() => void saveGrid("paused")}
            />
          </BotFlowCategory>
          <BotStrategyLivePanel
            planId="grid_spot"
            billing={accountBilling}
            botActive={
              gridInst?.status === "active" && instEnvAligned(gridInst)
            }
            paused={gridInst?.status === "paused" && instEnvAligned(gridInst)}
            keysOk={gridKeysOk}
            logs={logs}
            onLogsRefresh={refreshGridLogs}
            t={t}
          />
        </BotPlanCard>
      ) : null}

      {activeTab === "futures_um" && futSub && futKeysOk ? (
        <BotPlanCard planId="futures_um" className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-[color:var(--fd-text)]">
              {t("bots_futures_config_title")}
            </h2>
            <BotStatusBadge
              status={futInst?.status ?? "none"}
              lastExecutedAt={
                instEnvAligned(futInst) ? futInst?.lastExecutedAt : undefined
              }
              entryIntervalRemainingMinutes={
                instEnvAligned(futInst)
                  ? futInst?.entryIntervalRemainingMinutes ?? 0
                  : 0
              }
              monitoringOpen={
                instEnvAligned(futInst) &&
                futInst?.status === "active" &&
                futHasConfigOpen
              }
              t={t}
            />
          </div>
          {(data.templates?.length ?? 0) > 0 ? (
            <div className="mt-3">
              <BotTemplatePicker
                planId="futures_um"
                templates={data.templates ?? []}
                activeId={activeTemplateId}
                onSelect={(id) => void applyTemplate(id)}
                t={t}
              />
              {tplMsg && activeTab === "futures_um" ? (
                <p className="mt-1 text-[11px] font-medium text-amber-900">{tplMsg}</p>
              ) : null}
            </div>
          ) : null}
          <div className="mt-3">
            <BotInstanceStatsCard planId="futures_um" billing={accountBilling} t={t} />
          </div>
          <div className="mt-3">
            <BotCommunityActions
              planId="futures_um"
              billing={accountBilling}
              templateId={templateIdForPlan("futures_um")}
              t={t}
            />
            <div className="mt-2">
              <BotCopyFollowPanel planId="futures_um" billing={accountBilling} t={t} />
            </div>
          </div>
          <BotFlowCategory title={t("bots_category_basics")} className="mt-3">
            <div className="space-y-3">
            {billingMismatchBanner(futInst)}
            <BotFlowField label={t("bots_symbol_label")}>
              <BotFlowSelect
                value={futSymbol}
                onChange={(e) => setFutSymbol(e.target.value)}
              >
                {(data.futuresOptions?.symbols ?? ["BTCUSDT"]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </BotFlowSelect>
            </BotFlowField>
            {futFormSymbolDirty && savedFutSymbol ? (
              <p className="text-xs font-medium text-amber-900">
                {savedFutSymbol} → {futSymbol}
              </p>
            ) : null}
            {futHasUnmanagedOpen ? (
              <BotFlowError>{t("bots_futures_other_short")}</BotFlowError>
            ) : null}
            {futShowRealign ? (
              <BotFlowBtn variant="ghost" onClick={realignFuturesForm}>
                {t("bots_futures_realign_form")}
              </BotFlowBtn>
            ) : null}
            <BotFormGrid>
              <BotFlowField label={t("bots_futures_side")}>
                <BotFlowSelect
                  value={futSide}
                  onChange={(e) => setFutSide(e.target.value as "LONG" | "SHORT")}
                >
                  <option value="LONG">{t("bots_futures_long")}</option>
                  <option value="SHORT">{t("bots_futures_short")}</option>
                </BotFlowSelect>
              </BotFlowField>
              <BotFlowField label={t("bots_futures_leverage")}>
                <BotFlowSelect
                  value={futLeverage}
                  onChange={(e) => setFutLeverage(Number(e.target.value))}
                >
                  {(data.futuresOptions?.leverage ?? [5]).map((lv) => (
                    <option key={lv} value={lv}>
                      {lv}×
                    </option>
                  ))}
                </BotFlowSelect>
              </BotFlowField>
              <BotFlowField label={t("bots_futures_margin")}>
                <BotFlowInput
                  value={futMargin}
                  onChange={(e) => setFutMargin(e.target.value)}
                  inputMode="decimal"
                />
              </BotFlowField>
              <BotFlowField label={t("bots_futures_sl")}>
                <BotFlowInput
                  type="number"
                  min={1}
                  max={50}
                  value={futSl}
                  onChange={(e) => setFutSl(Number(e.target.value))}
                />
              </BotFlowField>
              <BotFlowField label={t("bots_futures_tp")}>
                <BotFlowInput
                  type="number"
                  min={1}
                  max={100}
                  value={futTp}
                  onChange={(e) => setFutTp(Number(e.target.value))}
                />
              </BotFlowField>
              <BotFlowField label={t("bots_futures_reopen")}>
                <BotFlowSelect
                  value={futInterval}
                  onChange={(e) => setFutInterval(Number(e.target.value))}
                >
                  {(data.futuresOptions?.intervalHours ?? [24]).map((h) => (
                    <option key={h} value={h}>
                      {h}h
                    </option>
                  ))}
                </BotFlowSelect>
              </BotFlowField>
            </BotFormGrid>
              <BotFlowField label={t("bots_coord_style_label")}>
                <BotFlowSelect
                  value={futStyle}
                  onChange={(e) => {
                    const style = parseCoordinatedStyle(e.target.value);
                    setFutStyle(style);
                    applyCoordinatedStyleDefaults(style, {
                      setFutInterval,
                      setFutSl,
                      setFutTp,
                    });
                  }}
                >
                  <option value="day">{t("bots_coord_style_day")}</option>
                  <option value="swing">{t("bots_coord_style_swing")}</option>
                </BotFlowSelect>
              </BotFlowField>
              <BotSignalPreview
                planId="futures_um"
                symbol={futSymbol}
                billing={accountBilling}
                t={t}
              />
            </div>
          </BotFlowCategory>
          <BotFlowCategory title={t("bots_category_coordination")} className="mt-3">
            <BotCoordinationRail
              cronHealth={data.cronHealth}
              botStatus={futInst?.status ?? "none"}
              instanceId={futInstRow?.id}
              aiAssistMode
              t={t}
            />
          </BotFlowCategory>
          <BotFlowCategory title={t("bots_category_execution")} className="mt-3">
          {futInst?.status === "active" && !instEnvAligned(futInst) ? (
            <p className="mt-2 text-xs font-medium text-violet-800 dark:text-violet-200">
              {t("bots_billing_view_mismatch", {
                saved: billingEnvLabel(futInst!.billing, t),
                viewing: billingEnvLabel(accountBilling, t),
              })}
            </p>
          ) : null}
          {futInst?.lastExecutedAt && instEnvAligned(futInst) ? (
            <p className="mt-2 text-xs text-stone-500">
              {t("bots_dca_last_run")}:{" "}
              {new Date(futInst.lastExecutedAt).toLocaleString()}
            </p>
          ) : null}
          {futInst?.lastError && instEnvAligned(futInst) ? (
            <BotFlowError>{formatBotRuntimeError(futInst.lastError, t)}</BotFlowError>
          ) : null}
          {futMsg ? (
            <p className="mt-2 text-xs font-medium text-amber-900">{futMsg}</p>
          ) : null}
          <BotRunControls
            status={futInst?.status ?? "none"}
            busy={busy}
            variant="amber"
            startDisabled={
              !canStartPlan(futSub, futKeysOk, futInst, data.cronHealth) ||
              futHasUnmanagedOpen
            }
            blockHint={startBlockReason(
              "futures_um",
              futSub,
              futKeysOk,
              futInst,
              data.cronHealth,
              futHasUnmanagedOpen,
            )}
            monitoringOpen={instEnvAligned(futInst) && futHasConfigOpen}
            monitoringLabel={t("bots_status_position_open")}
            startLabel={t("bots_futures_start")}
            pauseLabel={t("bots_futures_pause")}
            runningLabel={t("bots_coord_running")}
            stoppedLabel={t("bots_coord_stopped")}
            onStart={() => void saveFutures("active")}
            onPause={() => void saveFutures("paused")}
          />
          </BotFlowCategory>
          <BotStrategyLivePanel
            planId="futures_um"
            billing={accountBilling}
            botActive={
              futInst?.status === "active" && instEnvAligned(futInst)
            }
            paused={futInst?.status === "paused" && instEnvAligned(futInst)}
            keysOk={futKeysOk}
            logs={logs}
            onLogsRefresh={refreshFutLogs}
            onOpenChange={setFutOpenRows}
            t={t}
          />
        </BotPlanCard>
      ) : null}

      {wizardPlan ? (
        <BotsSetupWizard
          planId={wizardPlan}
          step={wizardStep}
          billing={wizardBilling}
          demoUsdt={data.tradeMode?.demoUsdt ?? "0"}
          tradeLiveEnabled={Boolean(data.tradeMode?.tradeLiveEnabled)}
          isSuperAdmin={Boolean(data.isSuperAdmin)}
          busy={busy}
          apiKey={apiKey}
          apiSecret={apiSecret}
          connectMsg={connectMsg}
          connectOk={connectOk}
          existingCred={credFor(wizardBilling)}
          onClose={() => {
            setWizardPlan(null);
            setWizardStep(1);
          }}
          onBillingChange={setWizardBilling}
          onStepBack={() => setWizardStep(1)}
          onContinueStep1={() => {
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
          onSubscribe={() => void subscribe(wizardPlan, wizardBilling)}
          onApiKeyChange={setApiKey}
          onApiSecretChange={setApiSecret}
          onTestAndSave={() => void connectKeys()}
          demoTrialActive={
            wizardBilling === "demo" &&
            Boolean(data.demoTrialEligible?.[wizardPlan])
          }
          t={t}
        />
      ) : null}

      {err ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {err}
        </p>
      ) : null}

    </div>
  );
}

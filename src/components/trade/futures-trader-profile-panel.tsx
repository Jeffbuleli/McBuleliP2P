"use client";

import { useState } from "react";
import type { Messages } from "@/i18n/messages";
import {
  getFuturesTraderProfilePreset,
  parseTraderProfileId,
  type BotTraderProfileId,
  type FuturesTraderProfilePreset,
} from "@/lib/bot-futures-trader-profiles";
import {
  defaultConfirmTimeframe,
  higherTimeframesThan,
  isHigherTimeframe,
} from "@/lib/bot-candle-timeframe-utils";
import { BOT_CANDLE_TIMEFRAMES } from "@/lib/bot-smart-config";
import { AiAssistStatusBadge } from "@/components/trade/ai-assist-status-badge";
import {
  BotFlowField,
  BotFlowInput,
  BotFlowSelect,
  BotFlowToggle,
  BotFormGrid,
} from "@/components/trade/bots-flow-ui";

type CandleTf = (typeof BOT_CANDLE_TIMEFRAMES)[number];

export type FutBreakevenUiState = {
  breakevenMode: boolean;
  breakevenTriggerPct: number;
};

export type FutTrailingUiState = {
  trailingMode: boolean;
  trailingPct: number;
  trailingTriggerPct: number;
};

export function loadFutBreakevenFromConfig(
  cfg: Record<string, unknown> | undefined,
): FutBreakevenUiState {
  return {
    breakevenMode: Boolean(cfg?.breakevenMode),
    breakevenTriggerPct: Number(cfg?.breakevenTriggerPct) || 1,
  };
}

export function loadFutTrailingFromConfig(
  cfg: Record<string, unknown> | undefined,
): FutTrailingUiState {
  return {
    trailingMode: Boolean(cfg?.trailingMode),
    trailingPct: Number(cfg?.trailingPct) || 0.8,
    trailingTriggerPct: Number(cfg?.trailingTriggerPct) || 2,
  };
}

export function futBreakevenConfigFields(s: FutBreakevenUiState) {
  return {
    breakevenMode: s.breakevenMode,
    breakevenTriggerPct: s.breakevenTriggerPct,
  };
}

export function futTrailingConfigFields(s: FutTrailingUiState) {
  return {
    trailingMode: s.trailingMode,
    trailingPct: s.trailingPct,
    trailingTriggerPct: s.trailingTriggerPct,
  };
}

export type FutMultiTfUiState = {
  multiTfGateMode: boolean;
  confirmTimeframe: CandleTf;
};

export type FutLifecycleUiState = {
  maxHoldMinutes: number;
  reentryCooldownMinutes: number;
};

export function loadFutLifecycleFromConfig(
  cfg: Record<string, unknown> | undefined,
): FutLifecycleUiState {
  const max = Number(cfg?.maxHoldMinutes);
  const cool = Number(cfg?.reentryCooldownMinutes);
  return {
    maxHoldMinutes: Number.isFinite(max) && max >= 0 ? max : 0,
    reentryCooldownMinutes: Number.isFinite(cool) && cool >= 0 ? cool : 0,
  };
}

export function futLifecycleConfigFields(s: FutLifecycleUiState) {
  return {
    maxHoldMinutes: s.maxHoldMinutes,
    reentryCooldownMinutes: s.reentryCooldownMinutes,
  };
}

export type FutAiAssistUiState = {
  aiAssistMode: boolean;
  minAiConfidence: number;
};

export function loadFutAiAssistFromConfig(
  cfg: Record<string, unknown> | undefined,
): FutAiAssistUiState {
  return {
    aiAssistMode: Boolean(cfg?.aiAssistMode),
    minAiConfidence: Number(cfg?.minAiConfidence) || 40,
  };
}

export function futAiAssistConfigFields(s: FutAiAssistUiState) {
  return {
    aiAssistMode: s.aiAssistMode,
    minAiConfidence: s.minAiConfidence,
    aiSignalMaxAgeMs: 120_000,
  };
}

function parseCandleTf(raw: unknown, fallback: CandleTf): CandleTf {
  if (
    typeof raw === "string" &&
    (BOT_CANDLE_TIMEFRAMES as readonly string[]).includes(raw)
  ) {
    return raw as CandleTf;
  }
  return fallback;
}

export function loadFutMultiTfFromConfig(
  cfg: Record<string, unknown> | undefined,
  entryTimeframe: CandleTf,
): FutMultiTfUiState {
  const fallback = defaultConfirmTimeframe(entryTimeframe);
  const confirm = parseCandleTf(cfg?.confirmTimeframe, fallback);
  return {
    multiTfGateMode: Boolean(cfg?.multiTfGateMode),
    confirmTimeframe: isHigherTimeframe(entryTimeframe, confirm)
      ? confirm
      : fallback,
  };
}

export function futMultiTfConfigFields(
  s: FutMultiTfUiState,
  entryTimeframe: CandleTf,
) {
  if (!s.multiTfGateMode || !isHigherTimeframe(entryTimeframe, s.confirmTimeframe)) {
    return { multiTfGateMode: false };
  }
  return {
    multiTfGateMode: true,
    confirmTimeframe: s.confirmTimeframe,
  };
}

function confirmOptionsFor(entryTimeframe: CandleTf): CandleTf[] {
  return higherTimeframesThan(entryTimeframe);
}

export type FuturesProfileApplyPayload = FuturesTraderProfilePreset;

const PROFILE_KEYS: Record<
  Exclude<BotTraderProfileId, "custom">,
  keyof Messages
> = {
  scalp: "bots_trader_profile_scalp",
  day: "bots_trader_profile_day",
  swing: "bots_trader_profile_swing",
  position: "bots_trader_profile_position",
};

export function FuturesTraderProfilePanel({
  profile,
  onProfileChange,
  breakeven,
  onBreakevenChange,
  trailing,
  onTrailingChange,
  multiTf,
  onMultiTfChange,
  lifecycle,
  onLifecycleChange,
  aiAssist,
  onAiAssistChange,
  botInstanceId,
  savedInstanceBilling,
  accountBilling,
  showAiTechnicalRef,
  entryTimeframe,
  onApplyPreset,
  t,
}: {
  profile: BotTraderProfileId;
  onProfileChange: (id: BotTraderProfileId) => void;
  breakeven: FutBreakevenUiState;
  onBreakevenChange: (s: FutBreakevenUiState) => void;
  trailing: FutTrailingUiState;
  onTrailingChange: (s: FutTrailingUiState) => void;
  multiTf: FutMultiTfUiState;
  onMultiTfChange: (s: FutMultiTfUiState) => void;
  lifecycle: FutLifecycleUiState;
  onLifecycleChange: (s: FutLifecycleUiState) => void;
  aiAssist: FutAiAssistUiState;
  onAiAssistChange: (s: FutAiAssistUiState) => void;
  botInstanceId?: string | null;
  savedInstanceBilling?: "demo" | "live" | null;
  accountBilling?: "demo" | "live";
  showAiTechnicalRef?: boolean;
  entryTimeframe: CandleTf;
  onApplyPreset: (preset: FuturesProfileApplyPayload) => void;
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [refCopied, setRefCopied] = useState(false);
  const confirmOptions = confirmOptionsFor(entryTimeframe);

  function billingLabel(b: "demo" | "live") {
    return b === "demo" ? t("bots_billing_demo") : t("bots_billing_live");
  }

  function selectProfile(id: BotTraderProfileId) {
    onProfileChange(id);
    if (id !== "custom") {
      onApplyPreset(getFuturesTraderProfilePreset(id));
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <BotFlowField label={t("bots_trader_profile_label")}>
        <BotFlowSelect
          value={profile}
          onChange={(e) => selectProfile(parseTraderProfileId(e.target.value))}
        >
          {(Object.keys(PROFILE_KEYS) as Exclude<BotTraderProfileId, "custom">[]).map(
            (id) => (
              <option key={id} value={id}>
                {t(PROFILE_KEYS[id])}
              </option>
            ),
          )}
          <option value="custom">{t("bots_trader_profile_custom")}</option>
        </BotFlowSelect>
      </BotFlowField>

      <BotFlowToggle
        label={t("bots_breakeven_mode")}
        checked={breakeven.breakevenMode}
        onChange={(v) => onBreakevenChange({ ...breakeven, breakevenMode: v })}
      />
      {breakeven.breakevenMode ? (
        <BotFlowField label={t("bots_breakeven_trigger")}>
          <BotFlowInput
            type="number"
            min={0.1}
            max={20}
            step={0.1}
            value={breakeven.breakevenTriggerPct}
            onChange={(e) =>
              onBreakevenChange({
                ...breakeven,
                breakevenTriggerPct: Number(e.target.value),
              })
            }
          />
        </BotFlowField>
      ) : null}

      <BotFlowToggle
        label={t("bots_trailing_mode")}
        checked={trailing.trailingMode}
        onChange={(v) => onTrailingChange({ ...trailing, trailingMode: v })}
      />
      {trailing.trailingMode ? (
        <BotFormGrid>
          <BotFlowField label={t("bots_trailing_retrace")}>
            <BotFlowInput
              type="number"
              min={0.1}
              max={20}
              step={0.1}
              value={trailing.trailingPct}
              onChange={(e) =>
                onTrailingChange({
                  ...trailing,
                  trailingPct: Number(e.target.value),
                })
              }
            />
          </BotFlowField>
          <BotFlowField label={t("bots_trailing_trigger")}>
            <BotFlowInput
              type="number"
              min={0.1}
              max={50}
              step={0.1}
              value={trailing.trailingTriggerPct}
              onChange={(e) =>
                onTrailingChange({
                  ...trailing,
                  trailingTriggerPct: Number(e.target.value),
                })
              }
            />
          </BotFlowField>
        </BotFormGrid>
      ) : null}

      {confirmOptions.length > 0 ? (
        <BotFlowToggle
          label={t("bots_mtf_gate_mode")}
          checked={multiTf.multiTfGateMode}
          onChange={(v) => onMultiTfChange({ ...multiTf, multiTfGateMode: v })}
        />
      ) : null}
      {multiTf.multiTfGateMode && confirmOptions.length > 0 ? (
        <BotFlowField label={t("bots_mtf_confirm_tf")}>
          <BotFlowSelect
            value={multiTf.confirmTimeframe}
            onChange={(e) =>
              onMultiTfChange({
                ...multiTf,
                confirmTimeframe: e.target.value as CandleTf,
              })
            }
          >
            {confirmOptions.map((tf) => (
              <option key={tf} value={tf}>
                {tf}
              </option>
            ))}
          </BotFlowSelect>
        </BotFlowField>
      ) : null}

      <BotFlowToggle
        label={t("bots_ai_assist_mode")}
        checked={aiAssist.aiAssistMode}
        onChange={(v) => onAiAssistChange({ ...aiAssist, aiAssistMode: v })}
      />
      {aiAssist.aiAssistMode ? (
        <BotFlowField label={t("bots_ai_min_confidence")}>
          <BotFlowInput
            type="number"
            min={0}
            max={100}
            step={1}
            value={aiAssist.minAiConfidence}
            onChange={(e) =>
              onAiAssistChange({
                ...aiAssist,
                minAiConfidence: Math.max(0, Number(e.target.value) || 0),
              })
            }
          />
        </BotFlowField>
      ) : null}

      <AiAssistStatusBadge
        instanceId={botInstanceId}
        enabled={aiAssist.aiAssistMode}
        t={t}
      />

      {aiAssist.aiAssistMode && showAiTechnicalRef && botInstanceId ? (
        <div className="rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-2">
          <p className="text-[10px] font-medium text-[color:var(--fd-muted)]">
            {t("bots_ai_instance_ref_admin")}
            {savedInstanceBilling ? ` · ${billingLabel(savedInstanceBilling)}` : ""}
          </p>
          <p className="mt-0.5 break-all font-mono text-[10px] text-[color:var(--fd-text)]">
            {botInstanceId}
          </p>
          <button
            type="button"
            className="mt-1 text-[10px] font-semibold text-[color:var(--fd-primary)] underline"
            onClick={() => {
              void navigator.clipboard.writeText(botInstanceId).then(() => {
                setRefCopied(true);
                window.setTimeout(() => setRefCopied(false), 2000);
              });
            }}
          >
            {refCopied ? t("profile_id_copied") : t("bots_ai_copy_ref")}
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setAdvancedOpen((o) => !o)}
        className="w-full rounded-xl border border-[color:var(--fd-border)] py-2 text-xs font-bold text-[color:var(--fd-muted)]"
      >
        {advancedOpen ? "−" : "+"} {t("bots_advanced_options")}
      </button>

      {advancedOpen ? (
        <BotFormGrid>
          <BotFlowField label={t("bots_max_hold_label")}>
            <BotFlowInput
              type="number"
              min={0}
              max={10080}
              step={1}
              value={lifecycle.maxHoldMinutes}
              onChange={(e) =>
                onLifecycleChange({
                  ...lifecycle,
                  maxHoldMinutes: Math.max(0, Number(e.target.value) || 0),
                })
              }
            />
          </BotFlowField>
          <BotFlowField label={t("bots_reentry_cooldown_label")}>
            <BotFlowInput
              type="number"
              min={0}
              max={1440}
              step={1}
              value={lifecycle.reentryCooldownMinutes}
              onChange={(e) =>
                onLifecycleChange({
                  ...lifecycle,
                  reentryCooldownMinutes: Math.max(0, Number(e.target.value) || 0),
                })
              }
            />
          </BotFlowField>
        </BotFormGrid>
      ) : null}
    </div>
  );
}

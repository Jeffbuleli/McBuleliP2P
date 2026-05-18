"use client";

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
import { UiInfoTip } from "@/components/ui/ui-info-tip";

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
  accountBilling,
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
  accountBilling?: "demo" | "live";
  entryTimeframe: CandleTf;
  onApplyPreset: (preset: FuturesProfileApplyPayload) => void;
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string;
}) {
  const confirmOptions = confirmOptionsFor(entryTimeframe);
  function selectProfile(id: BotTraderProfileId) {
    onProfileChange(id);
    if (id !== "custom") {
      onApplyPreset(getFuturesTraderProfilePreset(id));
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-amber-200/90 bg-amber-50/50 p-3 dark:border-amber-900/60 dark:bg-amber-950/25">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-w-[8rem] flex-1 items-center gap-1 text-xs font-semibold text-amber-950 dark:text-amber-100">
          <span>{t("bots_trader_profile_label")}</span>
          <UiInfoTip tip={t("bots_trader_profile_tip")} />
        </label>
        <select
          value={profile}
          onChange={(e) =>
            selectProfile(parseTraderProfileId(e.target.value))
          }
          className="min-w-[9rem] flex-1 rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs font-medium dark:border-stone-600 dark:bg-stone-900"
        >
          {(Object.keys(PROFILE_KEYS) as Exclude<BotTraderProfileId, "custom">[]).map(
            (id) => (
              <option key={id} value={id}>
                {t(PROFILE_KEYS[id])}
              </option>
            ),
          )}
          <option value="custom">{t("bots_trader_profile_custom")}</option>
        </select>
      </div>
      <label className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={breakeven.breakevenMode}
            onChange={(e) =>
              onBreakevenChange({
                ...breakeven,
                breakevenMode: e.target.checked,
              })
            }
          />
          <span className="font-medium text-amber-950 dark:text-amber-100">
            {t("bots_breakeven_mode")}
          </span>
          <UiInfoTip tip={t("bots_breakeven_tip")} />
        </span>
        {breakeven.breakevenMode ? (
          <span className="flex items-center gap-1">
            <span className="text-stone-600 dark:text-stone-400">
              {t("bots_breakeven_trigger")}
            </span>
            <input
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
              className="w-14 rounded border border-stone-300 bg-white px-1.5 py-0.5 dark:border-stone-600 dark:bg-stone-900"
            />
            <span className="text-stone-500">%</span>
          </span>
        ) : null}
      </label>
      <label className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={trailing.trailingMode}
            onChange={(e) =>
              onTrailingChange({
                ...trailing,
                trailingMode: e.target.checked,
              })
            }
          />
          <span className="font-medium text-amber-950 dark:text-amber-100">
            {t("bots_trailing_mode")}
          </span>
          <UiInfoTip tip={t("bots_trailing_tip")} />
        </span>
        {trailing.trailingMode ? (
          <>
            <span className="flex items-center gap-1">
              <span className="text-stone-600 dark:text-stone-400">
                {t("bots_trailing_retrace")}
              </span>
              <input
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
                className="w-14 rounded border border-stone-300 bg-white px-1.5 py-0.5 dark:border-stone-600 dark:bg-stone-900"
              />
              <span className="text-stone-500">%</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-stone-600 dark:text-stone-400">
                {t("bots_trailing_trigger")}
              </span>
              <input
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
                className="w-14 rounded border border-stone-300 bg-white px-1.5 py-0.5 dark:border-stone-600 dark:bg-stone-900"
              />
              <span className="text-stone-500">%</span>
            </span>
          </>
        ) : null}
      </label>
      {confirmOptions.length > 0 ? (
        <label className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={multiTf.multiTfGateMode}
              onChange={(e) =>
                onMultiTfChange({
                  ...multiTf,
                  multiTfGateMode: e.target.checked,
                })
              }
            />
            <span className="font-medium text-amber-950 dark:text-amber-100">
              {t("bots_mtf_gate_mode")}
            </span>
            <UiInfoTip tip={t("bots_mtf_gate_tip")} />
          </span>
          {multiTf.multiTfGateMode ? (
            <span className="flex items-center gap-1">
              <span className="text-stone-600 dark:text-stone-400">
                {t("bots_mtf_confirm_tf")}
              </span>
              <select
                value={multiTf.confirmTimeframe}
                onChange={(e) =>
                  onMultiTfChange({
                    ...multiTf,
                    confirmTimeframe: e.target.value as CandleTf,
                  })
                }
                className="rounded border border-stone-300 bg-white px-1.5 py-0.5 dark:border-stone-600 dark:bg-stone-900"
              >
                {confirmOptions.map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
              </select>
              <span className="text-stone-500">← {entryTimeframe}</span>
            </span>
          ) : null}
        </label>
      ) : null}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="flex items-center gap-1">
          <span className="font-medium text-amber-950 dark:text-amber-100">
            {t("bots_max_hold_label")}
          </span>
          <UiInfoTip tip={t("bots_max_hold_tip")} />
          <input
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
            className="w-16 rounded border border-stone-300 bg-white px-1.5 py-0.5 dark:border-stone-600 dark:bg-stone-900"
          />
          <span className="text-stone-500">{t("bots_lifecycle_minutes")}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="font-medium text-amber-950 dark:text-amber-100">
            {t("bots_reentry_cooldown_label")}
          </span>
          <UiInfoTip tip={t("bots_reentry_cooldown_tip")} />
          <input
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
            className="w-16 rounded border border-stone-300 bg-white px-1.5 py-0.5 dark:border-stone-600 dark:bg-stone-900"
          />
          <span className="text-stone-500">{t("bots_lifecycle_minutes")}</span>
        </span>
      </div>
      <label className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={aiAssist.aiAssistMode}
            onChange={(e) =>
              onAiAssistChange({
                ...aiAssist,
                aiAssistMode: e.target.checked,
              })
            }
          />
          <span className="font-medium text-amber-950 dark:text-amber-100">
            {t("bots_ai_assist_mode")}
          </span>
          <UiInfoTip tip={t("bots_ai_assist_tip")} />
        </span>
        {aiAssist.aiAssistMode ? (
          <span className="flex items-center gap-1">
            <span className="text-stone-600 dark:text-stone-400">
              {t("bots_ai_min_confidence")}
            </span>
            <input
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
              className="w-14 rounded border border-stone-300 bg-white px-1.5 py-0.5 dark:border-stone-600 dark:bg-stone-900"
            />
          </span>
        ) : null}
      </label>
      {aiAssist.aiAssistMode && botInstanceId ? (
        <p className="mt-1.5 break-all font-mono text-[10px] text-stone-600 dark:text-stone-400">
          {t("bots_ai_instance_id")}: {botInstanceId}
          {accountBilling ? ` (${accountBilling})` : ""}
        </p>
      ) : null}
    </div>
  );
}

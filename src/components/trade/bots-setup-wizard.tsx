"use client";

import type { BotPlanId } from "@/lib/bot-config";
import type { Messages } from "@/i18n/messages";
import { formatBotsCredentialValidationLine } from "@/lib/bots-ui-helpers";
import type { BotsHubCredential } from "@/components/trade/bots-keys-hub";
import { BotPlanIcon } from "@/components/trade/bot-strategy-icons";
import { botFieldCls } from "@/components/trade/bots-flow-ui";

const PLAN_LABEL: Record<BotPlanId, keyof Messages> = {
  dca_spot: "bots_plan_dca",
  grid_spot: "bots_plan_grid",
  futures_um: "bots_plan_futures",
};

const PLAN_WIZARD_CLASS: Record<BotPlanId, string> = {
  dca_spot: "bots-wizard--dca",
  grid_spot: "bots-wizard--grid",
  futures_um: "bots-wizard--futures",
};

function envHintKey(
  planId: BotPlanId,
  billing: "demo" | "live",
): keyof Messages {
  if (billing === "live") {
    return planId === "futures_um"
      ? "bots_env_live_futures_hint"
      : "bots_env_live_spot_hint";
  }
  return planId === "futures_um"
    ? "bots_env_demo_futures_hint"
    : "bots_env_demo_spot_hint";
}

function StepDots({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="bots-wizard__dots" aria-hidden>
      {([1, 2, 3] as const).map((n) => (
        <span
          key={n}
          className={`bots-wizard__dot ${n <= step ? "bots-wizard__dot--on" : ""} ${n === step ? "bots-wizard__dot--current" : ""}`}
        />
      ))}
    </div>
  );
}

export function BotsSetupWizard({
  planId,
  step,
  billing,
  demoUsdt,
  tradeLiveEnabled,
  isSuperAdmin,
  busy,
  apiKey,
  apiSecret,
  connectMsg,
  connectOk,
  existingCred,
  onClose,
  onBillingChange,
  onStepBack,
  onContinueStep1,
  onSubscribe,
  onApiKeyChange,
  onApiSecretChange,
  onTestAndSave,
  t,
}: {
  planId: BotPlanId;
  step: 1 | 2 | 3;
  billing: "demo" | "live";
  demoUsdt: string;
  tradeLiveEnabled: boolean;
  isSuperAdmin: boolean;
  busy: boolean;
  apiKey: string;
  apiSecret: string;
  connectMsg: string | null;
  connectOk: boolean;
  existingCred: BotsHubCredential | null | undefined;
  onClose: () => void;
  onBillingChange: (env: "demo" | "live") => void;
  onStepBack: () => void;
  onContinueStep1: () => void;
  onSubscribe: () => void;
  onApiKeyChange: (v: string) => void;
  onApiSecretChange: (v: string) => void;
  onTestAndSave: () => void;
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string;
}) {
  const liveBlocked = billing === "live" && !tradeLiveEnabled && !isSuperAdmin;
  const stepLabels: Record<1 | 2 | 3, keyof Messages> = {
    1: "bots_wizard_step_name_env",
    2: "bots_wizard_step_name_sub",
    3: "bots_wizard_step_name_keys",
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={t("bots_close_wizard")}
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        className={`bots-wizard fd-card relative max-h-[90vh] w-full max-w-lg overflow-y-auto p-0 shadow-xl ${PLAN_WIZARD_CLASS[planId]}`}
      >
        <header className="bots-wizard__head px-4 pb-3 pt-4">
          <div className="flex items-start gap-3">
            <span className="bots-wizard__plan-icon" aria-hidden>
              <BotPlanIcon planId={planId} className="h-7 w-7" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="bots-wizard__progress">
                {t("bots_wizard_progress", { step: String(step), total: "3" })}
              </p>
              <h3 className="bots-wizard__title">
                {t(PLAN_LABEL[planId])}
              </h3>
              <p className="bots-wizard__subtitle">{t(stepLabels[step])}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="bots-wizard__close flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
              aria-label={t("bots_close_wizard")}
            >
              ×
            </button>
          </div>
          <StepDots step={step} />
        </header>

        <div className="px-4 pb-4">
          {step === 1 ? (
            <div className="space-y-3">
              <p className="bots-wizard__lead">{t("bots_choose_billing")}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onBillingChange("demo")}
                  className={`bots-wizard__env-btn flex-1 ${billing === "demo" ? "bots-wizard__env-btn--on" : ""}`}
                >
                  <span className="block text-sm font-bold">{t("bots_billing_demo")}</span>
                  <span className="mt-0.5 block text-[10px] font-medium opacity-85">
                    {t("bots_billing_demo_sub")} · {demoUsdt} USDT
                  </span>
                </button>
                <button
                  type="button"
                  disabled={!tradeLiveEnabled && !isSuperAdmin}
                  onClick={() => onBillingChange("live")}
                  className={`bots-wizard__env-btn bots-wizard__env-btn--live flex-1 ${billing === "live" ? "bots-wizard__env-btn--on-live" : ""}`}
                >
                  <span className="block text-sm font-bold">{t("bots_billing_live")}</span>
                  <span className="mt-0.5 block text-[10px] font-medium opacity-85">
                    {t("bots_billing_live_sub")}
                  </span>
                </button>
              </div>
              {liveBlocked ? (
                <p className="bots-wizard__warn">{t("bots_live_disabled_hint")}</p>
              ) : (
                <p className="bots-wizard__hint">{t(envHintKey(planId, billing))}</p>
              )}
              <button
                type="button"
                disabled={busy || liveBlocked}
                onClick={onContinueStep1}
                className="bots-wizard__primary w-full"
              >
                {t("continue")}
              </button>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <p className="bots-wizard__lead">{t("bots_subscribe_confirm")}</p>
              <button
                type="button"
                disabled={busy}
                onClick={onSubscribe}
                className="bots-wizard__primary w-full"
              >
                {busy ? "…" : t("bots_confirm_subscribe")}
              </button>
              <button
                type="button"
                onClick={onStepBack}
                className="bots-wizard__ghost w-full"
              >
                {t("back")}
              </button>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3">
              <ul className="bots-wizard__checklist space-y-1.5 text-xs text-[color:var(--fd-text)]">
                <li>① {billing === "live" ? t("bots_wizard_step1_live") : t("bots_wizard_step1")}</li>
                <li>② {billing === "live" ? t("bots_wizard_step2_live") : t("bots_wizard_step2")}</li>
                <li>③ {billing === "live" ? t("bots_wizard_step3_live") : t("bots_wizard_step3")}</li>
              </ul>
              <p className="bots-wizard__hint">{t(envHintKey(planId, billing))}</p>

              {existingCred?.validatedAt ? (
                <div className="bots-wizard__ok-box">
                  <p className="text-sm font-semibold">
                    {t("bots_keys_connected", { hint: existingCred.apiKeyHint ?? "…" })}
                  </p>
                  <p className="mt-1 text-xs font-medium opacity-90">
                    {formatBotsCredentialValidationLine(existingCred, t)}
                  </p>
                </div>
              ) : null}

              <label className="block">
                <span className="bots-wizard__label">{t("bots_api_key_label")}</span>
                <input
                  value={apiKey}
                  onChange={(e) => onApiKeyChange(e.target.value)}
                  className={`${botFieldCls} mt-1 font-mono text-sm`}
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>
              <label className="block">
                <span className="bots-wizard__label">{t("bots_api_secret_label")}</span>
                <input
                  type="password"
                  value={apiSecret}
                  onChange={(e) => onApiSecretChange(e.target.value)}
                  className={`${botFieldCls} mt-1 font-mono text-sm`}
                  autoComplete="off"
                />
              </label>

              {connectMsg ? (
                <p
                  className={
                    connectOk ? "bots-wizard__msg-ok text-sm" : "bots-wizard__msg-err text-sm"
                  }
                >
                  {connectMsg}
                </p>
              ) : null}

              <button
                type="button"
                disabled={busy || apiKey.length < 16 || apiSecret.length < 16}
                onClick={onTestAndSave}
                className="bots-wizard__primary w-full"
              >
                {busy ? "…" : t("bots_test_and_save")}
              </button>
              <button type="button" onClick={onClose} className="bots-wizard__ghost w-full">
                {t("bots_close_wizard")}
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

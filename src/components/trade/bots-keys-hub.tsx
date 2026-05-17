"use client";

import type { BotPlanId } from "@/lib/bot-config";
import type { Messages } from "@/i18n/messages";
import {
  formatBotsCredentialValidationLine,
  type BotsCredentialStatus,
} from "@/lib/bots-ui-helpers";

export type BotsHubCredential = BotsCredentialStatus & {
  environment: "demo" | "live";
  apiKeyHint: string;
};

type Props = {
  credentials: BotsHubCredential[];
  accountBilling: "demo" | "live";
  onBillingChange: (env: "demo" | "live") => void;
  tradeLiveEnabled: boolean;
  isSuperAdmin: boolean;
  activePlanId: BotPlanId;
  busy: boolean;
  keysHubMsg: string | null;
  onConnect: (env: "demo" | "live") => void;
  onRevoke: (env: "demo" | "live") => void;
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string;
};

function credFor(
  credentials: BotsHubCredential[],
  env: "demo" | "live",
): BotsHubCredential | undefined {
  return credentials.find((c) => c.environment === env);
}

function BillingToggle({
  value,
  onChange,
  liveDisabled,
  t,
}: {
  value: "demo" | "live";
  onChange: (v: "demo" | "live") => void;
  liveDisabled: boolean;
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string;
}) {
  function pill(id: "demo" | "live", disabled?: boolean) {
    const isLive = id === "live";
    const on = value === id;
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(id)}
        className={`flex min-w-[7.5rem] flex-1 flex-col items-center rounded-xl border-2 px-3 py-2.5 text-center transition ${
          on
            ? isLive
              ? "border-rose-500 bg-rose-50 shadow-sm dark:border-rose-500 dark:bg-rose-950/50"
              : "border-violet-500 bg-violet-50 shadow-sm dark:border-violet-500 dark:bg-violet-950/40"
            : "border-stone-200 bg-stone-50 dark:border-stone-600 dark:bg-stone-800/50"
        } disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <span
          className={`text-sm font-bold ${on && isLive ? "text-rose-900 dark:text-rose-100" : on ? "text-violet-900 dark:text-violet-100" : "text-stone-700 dark:text-stone-300"}`}
        >
          {id === "demo" ? t("bots_billing_demo") : t("bots_billing_live")}
        </span>
        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
          {id === "demo" ? t("bots_billing_demo_sub") : t("bots_billing_live_sub")}
        </span>
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      {pill("demo")}
      {pill("live", liveDisabled)}
    </div>
  );
}

function LiveChecklist({
  t,
}: {
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string;
}) {
  const items: (keyof Messages)[] = [
    "bots_live_checklist_reading",
    "bots_live_checklist_spot",
    "bots_live_checklist_pm",
    "bots_live_checklist_no_withdraw",
    "bots_live_checklist_ip",
  ];
  return (
    <ul className="mt-2 space-y-1.5 text-sm text-stone-700 dark:text-stone-300">
      {items.map((key) => (
        <li key={key} className="flex gap-2">
          <span className="text-emerald-600 dark:text-emerald-400" aria-hidden>
            ✓
          </span>
          <span>{t(key)}</span>
        </li>
      ))}
    </ul>
  );
}

export function BotsKeysHub({
  credentials,
  accountBilling,
  onBillingChange,
  tradeLiveEnabled,
  isSuperAdmin,
  activePlanId,
  busy,
  keysHubMsg,
  onConnect,
  onRevoke,
  t,
}: Props) {
  const liveAllowed = tradeLiveEnabled || isSuperAdmin;
  const env = accountBilling;
  const c = credFor(credentials, env);
  const validated = Boolean(c?.validatedAt);
  const validationLine = formatBotsCredentialValidationLine(c, t);
  const isLive = env === "live";
  const needsFutures = activePlanId === "futures_um";

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-50">
            {t("bots_keys_hub_title")}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-stone-600 dark:text-stone-400">
            {t("bots_keys_hub_hint")}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
        {t("bots_keys_hub_env_label")}
      </p>
      <div className="mt-2">
        <BillingToggle
          value={accountBilling}
          onChange={onBillingChange}
          liveDisabled={!liveAllowed}
          t={t}
        />
      </div>

      {!liveAllowed ? (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
          {t("bots_live_disabled_hint")}
        </p>
      ) : null}

      <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
        {t("bots_keys_shared_hint")}
      </p>

      <div
        className={`mt-4 rounded-2xl border-2 p-4 ${
          isLive
            ? "border-rose-300/80 bg-gradient-to-br from-rose-50/90 to-white dark:border-rose-800/60 dark:from-rose-950/40 dark:to-stone-900"
            : "border-violet-200 bg-violet-50/50 dark:border-violet-800/50 dark:bg-violet-950/20"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
              isLive
                ? "bg-rose-600 text-white"
                : "bg-violet-600 text-white"
            }`}
          >
            {isLive ? t("bots_live_hub_badge") : t("bots_demo_hub_badge")}
          </span>
          {validated ? (
            <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">
              {t("bots_keys_status_ok")}
            </span>
          ) : (
            <span className="rounded-full bg-stone-400 px-2.5 py-0.5 text-xs font-semibold text-white dark:bg-stone-600">
              {t("bots_keys_status_none")}
            </span>
          )}
        </div>

        {isLive ? (
          <p className="mt-3 text-sm font-medium text-rose-950 dark:text-rose-100">
            {t("bots_live_real_money_banner")}
          </p>
        ) : (
          <p className="mt-3 text-sm text-violet-950 dark:text-violet-100">
            {t("bots_demo_hub_hint")}
          </p>
        )}

        {validated && c ? (
          <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50/80 px-3 py-2.5 dark:border-emerald-800 dark:bg-emerald-950/30">
            <p className="font-mono text-xs text-stone-600 dark:text-stone-400">
              {t("bots_keys_connected", { hint: c.apiKeyHint })}
            </p>
            {validationLine ? (
              <p className="mt-1 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                {validationLine}
              </p>
            ) : null}
          </div>
        ) : null}

        {isLive && !validated ? (
          <div className="mt-4">
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              {t("bots_live_checklist_title")}
            </p>
            <LiveChecklist t={t} />
            <p className="mt-3 rounded-lg bg-stone-100/80 px-3 py-2 text-xs text-stone-700 dark:bg-stone-800/80 dark:text-stone-300">
              {t("bots_live_ip_note")}
            </p>
            <a
              href="https://www.binance.com/en/my/settings/api-management"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-rose-700 underline dark:text-rose-300"
            >
              {t("bots_live_open_binance")} ↗
            </a>
          </div>
        ) : null}

        {!isLive && !validated ? (
          <p className="mt-3 rounded-lg border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-100">
            {needsFutures
              ? t("bots_env_demo_futures_hint")
              : t("bots_env_demo_spot_hint")}
          </p>
        ) : null}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={busy || (isLive && !liveAllowed)}
            onClick={() => onConnect(env)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-40 ${
              isLive ? "bg-rose-700 hover:bg-rose-800" : "bg-violet-700 hover:bg-violet-800"
            }`}
          >
            {isLive ? t("bots_keys_connect_live") : t("bots_keys_connect_demo")}
          </button>
          {c ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onRevoke(env)}
              className="rounded-xl border border-rose-400 px-4 py-2.5 text-sm font-semibold text-rose-800 dark:border-rose-600 dark:text-rose-200"
            >
              {t("bots_keys_revoke")}
            </button>
          ) : null}
        </div>
      </div>

      <p className="mt-3 text-xs text-stone-500">{t("bots_keys_replace_hint")}</p>
      {keysHubMsg ? (
        <p className="mt-2 rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-800 dark:bg-stone-800 dark:text-stone-200">
          {keysHubMsg}
        </p>
      ) : null}
    </section>
  );
}


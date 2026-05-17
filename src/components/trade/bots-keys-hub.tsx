"use client";

import type { Messages } from "@/i18n/messages";
import {
  formatBotsCredentialValidationLine,
  type BotsCredentialStatus,
} from "@/lib/bots-ui-helpers";
import { UiInfoTip, UiSectionTitle } from "@/components/ui/ui-info-tip";

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
  busy: boolean;
  keysHubMsg: string | null;
  onConnect: (env: "demo" | "live") => void;
  onRevoke: (env: "demo" | "live") => void;
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string;
};

function credFor(credentials: BotsHubCredential[], env: "demo" | "live") {
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
  t: Props["t"];
}) {
  function pill(id: "demo" | "live", disabled?: boolean) {
    const on = value === id;
    const isLive = id === "live";
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(id)}
        className={`flex min-w-[7rem] flex-1 flex-col rounded-xl border-2 px-3 py-2 text-center text-sm font-bold transition disabled:opacity-40 ${
          on
            ? isLive
              ? "border-rose-500 bg-rose-50 text-rose-950 dark:bg-rose-950/50 dark:text-rose-100"
              : "border-violet-500 bg-violet-50 text-violet-950 dark:bg-violet-950/40"
            : "border-stone-200 dark:border-stone-600"
        }`}
      >
        {id === "demo" ? t("bots_billing_demo") : t("bots_billing_live")}
        <span className="mt-0.5 text-[10px] font-medium uppercase opacity-70">
          {id === "demo" ? t("bots_billing_demo_sub") : t("bots_billing_live_sub")}
        </span>
      </button>
    );
  }
  return (
    <div className="mt-3 flex gap-2">
      {pill("demo")}
      {pill("live", liveDisabled)}
    </div>
  );
}

export function BotsKeysHub({
  credentials,
  accountBilling,
  onBillingChange,
  tradeLiveEnabled,
  isSuperAdmin,
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
  const line = formatBotsCredentialValidationLine(c, t);
  const isLive = env === "live";

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold">
          <UiSectionTitle title={t("bots_keys_hub_title")} tip={t("bots_keys_hub_tip")} />
        </h2>
        {validated ? (
          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
            {t("bots_keys_status_ok")}
          </span>
        ) : (
          <span className="rounded-full bg-stone-400 px-2 py-0.5 text-xs text-white dark:bg-stone-600">
            {t("bots_keys_status_none")}
          </span>
        )}
      </div>

      <BillingToggle
        value={accountBilling}
        onChange={onBillingChange}
        liveDisabled={!liveAllowed}
        t={t}
      />

      {!liveAllowed && isLive ? (
        <p className="mt-2 flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
          {t("bots_live_disabled_hint")}
          <UiInfoTip tip={t("bots_live_disabled_tip")} variant="warn" />
        </p>
      ) : null}

      {validated && c ? (
        <p className="mt-3 text-sm text-emerald-800 dark:text-emerald-200">
          {c.apiKeyHint}
          {line ? ` · ${line}` : ""}
        </p>
      ) : null}

      {isLive && !validated ? (
        <p className="mt-3 flex items-start gap-1 text-xs text-stone-600 dark:text-stone-400">
          <span>{t("bots_live_setup_short")}</span>
          <UiInfoTip tip={t("bots_live_checklist_tip")} />
        </p>
      ) : null}

      {!isLive && !validated ? (
        <p className="mt-3 flex items-start gap-1 text-xs text-stone-600 dark:text-stone-400">
          <span>{t("bots_demo_setup_short")}</span>
          <UiInfoTip tip={t("bots_demo_setup_tip")} />
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || (isLive && !liveAllowed)}
          onClick={() => onConnect(env)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 ${
            isLive ? "bg-rose-700" : "bg-violet-700"
          }`}
        >
          {isLive ? t("bots_keys_connect_live") : t("bots_keys_connect_demo")}
        </button>
        {c ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onRevoke(env)}
            className="rounded-xl border border-stone-400 px-4 py-2 text-sm font-semibold dark:border-stone-500"
          >
            {t("bots_keys_revoke")}
          </button>
        ) : null}
        {isLive && !validated ? (
          <a
            href="https://www.binance.com/en/my/settings/api-management"
            target="_blank"
            rel="noopener noreferrer"
            className="self-center text-xs font-semibold text-rose-600 underline dark:text-rose-400"
          >
            binance.com ↗
          </a>
        ) : null}
      </div>

      {keysHubMsg ? (
        <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">{keysHubMsg}</p>
      ) : null}
    </section>
  );
}

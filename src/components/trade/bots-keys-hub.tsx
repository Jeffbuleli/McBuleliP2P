"use client";

import type { Messages } from "@/i18n/messages";
import {
  formatBotsCredentialValidationLine,
  type BotsCredentialStatus,
} from "@/lib/bots-ui-helpers";
import {
  BotFlowBtn,
  BotFlowCard,
  BotStatusPill,
} from "@/components/trade/bots-flow-ui";

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
    <BotFlowCard>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-[color:var(--fd-text)]">{t("bots_keys_hub_title")}</h2>
        <BotStatusPill tone={validated ? "active" : "idle"}>
          {validated ? t("bots_keys_status_ok") : t("bots_keys_status_none")}
        </BotStatusPill>
      </div>

      <div className="mt-3 flex gap-2">
        {(["demo", "live"] as const).map((id) => {
          const on = accountBilling === id;
          const disabled = id === "live" && !liveAllowed;
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => onBillingChange(id)}
              className={`flex-1 rounded-2xl border-2 py-2.5 text-sm font-bold transition disabled:opacity-40 ${
                on
                  ? id === "live"
                    ? "border-rose-600 bg-rose-600 text-white"
                    : "border-violet-600 bg-violet-600 text-white"
                  : "border-[color:var(--fd-border)] bg-white text-[color:var(--fd-muted)]"
              }`}
            >
              {id === "demo" ? t("bots_billing_demo") : t("bots_billing_live")}
            </button>
          );
        })}
      </div>

      {validated && c ? (
        <p className="mt-3 truncate text-xs font-medium text-[color:var(--fd-primary)]">
          {c.apiKeyHint}
          {line ? ` · ${line}` : ""}
        </p>
      ) : (
        <p className="mt-3 text-[11px] text-[color:var(--fd-muted)]">
          {isLive ? t("bots_live_setup_short") : t("bots_demo_setup_short")}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <BotFlowBtn
          variant={isLive ? "danger" : "violet"}
          disabled={busy || (isLive && !liveAllowed)}
          onClick={() => onConnect(env)}
          className="!min-h-[44px] !flex-none px-5"
        >
          {isLive ? t("bots_keys_connect_live") : t("bots_keys_connect_demo")}
        </BotFlowBtn>
        {c ? (
          <BotFlowBtn
            variant="ghost"
            disabled={busy}
            onClick={() => onRevoke(env)}
            className="!min-h-[44px] !flex-none px-4"
          >
            {t("bots_keys_revoke")}
          </BotFlowBtn>
        ) : null}
      </div>

      {keysHubMsg ? (
        <p className="mt-2 text-xs text-[color:var(--fd-muted)]">{keysHubMsg}</p>
      ) : null}
    </BotFlowCard>
  );
}

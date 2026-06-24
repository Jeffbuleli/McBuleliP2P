"use client";

import { useCallback, useEffect, useState } from "react";
import { BotsKeysHub, type BotsHubCredential } from "@/components/trade/bots-keys-hub";
import { ProfileActionSheet } from "@/components/profile/profile-action-sheet";
import { useI18n } from "@/components/i18n-provider";
import { botsApiMessage } from "@/lib/bots-ui-helpers";

const inputCls =
  "w-full rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-2.5 text-sm text-[#1c1917]";

type Props = {
  tradeLiveEnabled: boolean;
  isSuperAdmin: boolean;
};

export function ProfileApiKeysClient({ tradeLiveEnabled, isSuperAdmin }: Props) {
  const { t } = useI18n();
  const [credentials, setCredentials] = useState<BotsHubCredential[]>([]);
  const [accountBilling, setAccountBilling] = useState<"demo" | "live">("demo");
  const [busy, setBusy] = useState(false);
  const [keysHubMsg, setKeysHubMsg] = useState<string | null>(null);
  const [connectEnv, setConnectEnv] = useState<"demo" | "live" | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/trade/bots/keys");
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setCredentials(data.credentials ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitConnect() {
    if (!connectEnv) return;
    setBusy(true);
    setKeysHubMsg(null);
    try {
      const res = await fetch("/api/trade/bots/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          environment: connectEnv,
          apiKey: apiKey.trim(),
          apiSecret: apiSecret.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = typeof json.error === "string" ? json.error : "bots_err_generic";
        setKeysHubMsg(botsApiMessage(code, t));
        return;
      }
      setKeysHubMsg(t("bots_keys_saved"));
      setConnectEnv(null);
      setApiKey("");
      setApiSecret("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function revokeKeys(env: "demo" | "live") {
    setBusy(true);
    setKeysHubMsg(null);
    try {
      const res = await fetch(`/api/trade/bots/keys?environment=${env}`, {
        method: "DELETE",
      });
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

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--fd-muted)]">{t("profile_api_keys_sub")}</p>
      <BotsKeysHub
        credentials={credentials}
        accountBilling={accountBilling}
        onBillingChange={setAccountBilling}
        tradeLiveEnabled={tradeLiveEnabled}
        isSuperAdmin={isSuperAdmin}
        busy={busy}
        keysHubMsg={keysHubMsg}
        onConnect={(env) => {
          setConnectEnv(env);
          setApiKey("");
          setApiSecret("");
        }}
        onRevoke={(env) => void revokeKeys(env)}
        t={t}
      />
      <p className="text-center text-[11px] text-[var(--fd-muted)]">
        <a href="/app/trade/bots" className="font-semibold text-[color:var(--fd-primary)]">
          {t("profile_api_keys_open_bots")}
        </a>
      </p>

      <ProfileActionSheet
        open={connectEnv !== null}
        title={
          connectEnv === "live"
            ? t("bots_keys_connect_live")
            : t("bots_keys_connect_demo")
        }
        subtitle={t("profile_api_keys_connect_sub")}
        onClose={() => setConnectEnv(null)}
      >
        <div className="space-y-3">
          <label className="block">
            <span className="text-[11px] font-semibold text-[var(--fd-muted)]">API Key</span>
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className={`${inputCls} mt-1`}
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-[var(--fd-muted)]">API Secret</span>
            <input
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              type="password"
              className={`${inputCls} mt-1`}
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            disabled={busy || apiKey.trim().length < 16 || apiSecret.trim().length < 16}
            onClick={() => void submitConnect()}
            className="w-full rounded-xl bg-[color:var(--fd-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {t("bots_keys_connect_demo")}
          </button>
        </div>
      </ProfileActionSheet>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { ProfileActionSheet } from "@/components/profile/profile-action-sheet";
import { clientErrorText } from "@/lib/client-error-text";
import { USDT_NETWORKS, type NetworkId } from "@/lib/networks";

type WhitelistRow = {
  id: string;
  asset: string;
  networkCanonical: string;
  address: string;
  memoTo: string | null;
  label: string | null;
  status: string;
  cooldownUntil: string | null;
  approvedAt: string | null;
};

const inputCls =
  "w-full rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-2.5 text-sm text-[#1c1917]";

export function ProfileWithdrawalAddresses() {
  const { t } = useI18n();
  const [rows, setRows] = useState<WhitelistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [network, setNetwork] = useState<NetworkId>("TRC20");
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [memo, setMemo] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/wallet/withdraw-addresses");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(clientErrorText(t, data.message ?? data.error ?? "profile_invalid_input"));
        return;
      }
      setRows(data.addresses ?? []);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addAddress() {
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      const res = await fetch("/api/wallet/withdraw-addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset: "USDT",
          network,
          address: address.trim(),
          label: label.trim() || undefined,
          memo: memo.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(clientErrorText(t, data.message ?? data.error ?? "profile_invalid_input"));
        return;
      }
      setOk(t("profile_addresses_saved"));
      setSheetOpen(false);
      setAddress("");
      setLabel("");
      setMemo("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  function shortAddr(a: string) {
    if (a.length <= 16) return a;
    return `${a.slice(0, 8)}…${a.slice(-6)}`;
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <p className="text-sm text-[var(--fd-muted)]">{t("sec_loading")}</p>
      ) : null}
      {err ? <p className="text-sm text-rose-700">{err}</p> : null}
      {ok ? <p className="text-sm text-emerald-700">{ok}</p> : null}

      <section className="fd-card overflow-hidden p-0">
        <ul className="divide-y divide-[var(--fd-border)]">
          {rows.length === 0 && !loading ? (
            <li className="px-4 py-6 text-center text-sm text-[var(--fd-muted)]">
              {t("profile_addresses_empty")}
            </li>
          ) : null}
          {rows.map((row) => (
            <li key={row.id} className="px-4 py-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1c1917]">
                    {(row.label || USDT_NETWORKS[row.networkCanonical as NetworkId]?.label) ??
                      row.networkCanonical}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-[var(--fd-muted)]">
                    {shortAddr(row.address)}
                  </p>
                </div>
                <span className="fd-pill-ok shrink-0 text-[10px]">{row.status}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="w-full rounded-xl bg-[color:var(--fd-primary)] px-4 py-3 text-sm font-semibold text-white"
      >
        {t("profile_addresses_add")}
      </button>

      <ProfileActionSheet
        open={sheetOpen}
        title={t("profile_addresses_add")}
        subtitle={t("profile_addresses_add_sub")}
        onClose={() => setSheetOpen(false)}
      >
        <div className="space-y-3">
          <label className="block">
            <span className="text-[11px] font-semibold text-[var(--fd-muted)]">
              {t("profile_addresses_network")}
            </span>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value as NetworkId)}
              className={`${inputCls} mt-1`}
            >
              {(Object.keys(USDT_NETWORKS) as NetworkId[]).map((id) => (
                <option key={id} value={id}>
                  {USDT_NETWORKS[id].label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-[var(--fd-muted)]">
              {t("profile_addresses_address")}
            </span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={`${inputCls} mt-1`}
              placeholder="T…"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-[var(--fd-muted)]">
              {t("profile_addresses_label")}
            </span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={`${inputCls} mt-1`}
            />
          </label>
          <button
            type="button"
            disabled={busy || !address.trim()}
            onClick={() => void addAddress()}
            className="w-full rounded-xl bg-[color:var(--fd-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {t("profile_addresses_save")}
          </button>
        </div>
      </ProfileActionSheet>
    </div>
  );
}

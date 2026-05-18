"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { USDT_NETWORKS, type NetworkId } from "@/lib/networks";
import { formatAuthClientError } from "@/lib/format-auth-client-error";
import { useI18n } from "@/components/i18n-provider";
import {
  EXTERNAL_WITHDRAW_FEE_PI,
  EXTERNAL_WITHDRAW_FEE_USDT,
} from "@/lib/withdraw-fees";
import { PI_MAIN_NETWORK_ID } from "@/lib/pi-constants";
import {
  FlowBackLink,
  FlowCard,
  FlowHubLink,
  FlowPrimaryBtn,
  WalletFlowShell,
} from "@/components/wallet/wallet-flow-shell";

type WAsset = "USDT" | "PI";

export default function WithdrawPage() {
  const { t } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const [wAsset, setWAsset] = useState<WAsset>("USDT");
  const [network, setNetwork] = useState<NetworkId>("TRC20");
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");
  const [amount, setAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feeUsdt, setFeeUsdt] = useState(EXTERNAL_WITHDRAW_FEE_USDT);
  const [feePi, setFeePi] = useState(EXTERNAL_WITHDRAW_FEE_PI);

  useEffect(() => {
    const a = sp.get("asset");
    if (a === "PI" || a === "USDT") setWAsset(a);
  }, [sp]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/config/withdraw-fees");
        const data = await res.json();
        if (typeof data.feeUsdt === "number") setFeeUsdt(data.feeUsdt);
        if (typeof data.feePi === "number") setFeePi(data.feePi);
      } catch {
        /* defaults */
      }
    })();
  }, []);

  const fee = wAsset === "PI" ? feePi : feeUsdt;
  const netNum = Number(amount);
  const totalDebit =
    Number.isFinite(netNum) && netNum > 0 ? netNum + fee : null;
  const unit = wAsset === "PI" ? "PI" : "USDT";

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset: wAsset,
          network: wAsset === "PI" ? PI_MAIN_NETWORK_ID : network,
          address,
          memo: memo || undefined,
          amount,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(formatAuthClientError(data));
        setShowConfirm(false);
        return;
      }
      router.push("/app/wallet");
      router.refresh();
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  }

  const addrOk =
    wAsset === "PI"
      ? address.trim().length >= 20
      : address.trim().length >= 10;

  return (
    <WalletFlowShell title={t("withdraw_title")} subtitle={t("wallet_crypto_only_hint")}>
      <FlowCard>
        <p className="mb-2 text-center text-xs font-bold uppercase text-[color:var(--fd-muted)]">
          {t("deposit_pick_asset")}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setWAsset("USDT")}
            className={`flex flex-col items-center gap-1.5 rounded-xl p-3 ${
              wAsset === "USDT" ? "bg-emerald-50 ring-2 ring-[color:var(--fd-primary)]" : "bg-stone-50"
            }`}
          >
            <Image src="/assets/crypto/usdt.png" alt="" width={40} height={40} className="rounded-full" />
            <span className="text-xs font-bold">USDT</span>
          </button>
          <button
            type="button"
            onClick={() => setWAsset("PI")}
            className={`flex flex-col items-center gap-1.5 rounded-xl p-3 ${
              wAsset === "PI" ? "bg-violet-50 ring-2 ring-violet-500" : "bg-stone-50"
            }`}
          >
            <Image src="/assets/crypto/pi.png" alt="" width={40} height={40} className="rounded-full" />
            <span className="text-xs font-bold">Pi</span>
          </button>
        </div>
      </FlowCard>

      {wAsset === "USDT" ? (
        <FlowCard className="mt-3">
          <p className="mb-2 text-xs font-bold uppercase text-[color:var(--fd-muted)]">
            {t("deposit_network")}
          </p>
          <div className="flex flex-col gap-2">
            {(Object.keys(USDT_NETWORKS) as NetworkId[]).map((id) => {
              const s = USDT_NETWORKS[id];
              const active = network === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setNetwork(id)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${
                    active
                      ? "border-[color:var(--fd-primary)] bg-emerald-50/80"
                      : "border-[color:var(--fd-border)]"
                  }`}
                >
                  <span className="text-sm font-semibold">{s.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.badgeClass}`}>
                    {id}
                  </span>
                </button>
              );
            })}
          </div>
        </FlowCard>
      ) : null}

      <FlowCard className="mt-3 space-y-3">
        <label className="block">
          <span className="text-xs font-bold uppercase text-[color:var(--fd-muted)]">
            {t("withdraw_addr")}
          </span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-[color:var(--fd-primary)]/30"
            placeholder={wAsset === "PI" ? t("withdraw_addr_pi_ph") : "0x… / T…"}
            autoComplete="off"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase text-[color:var(--fd-muted)]">
            {wAsset === "PI" ? t("withdraw_amt_pi") : t("withdraw_amt")}
          </span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            className="mt-1.5 w-full rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-2.5 text-lg font-bold tabular-nums outline-none focus:ring-2 focus:ring-[color:var(--fd-primary)]/30"
            placeholder="0"
          />
        </label>
      </FlowCard>

      {error ? (
        <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p>
      ) : null}

      <FlowPrimaryBtn
        disabled={!amount || Number(amount) <= 0 || !addrOk || loading}
        onClick={() => setShowConfirm(true)}
      >
        {t("withdraw_review")}
      </FlowPrimaryBtn>

      {showConfirm ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-[color:var(--fd-card)] p-5 shadow-xl">
            <p className="text-lg font-bold text-[color:var(--fd-text)]">{t("withdraw_review")}</p>
            <div className="mt-4 space-y-2 text-sm text-[color:var(--fd-muted)]">
              <p>
                <span className="text-2xl" aria-hidden>
                  {wAsset === "PI" ? "🟣" : "💵"}
                </span>{" "}
                <strong className="text-[color:var(--fd-text)]">{wAsset}</strong> ·{" "}
                {wAsset === "USDT" ? network : "Pi"}
              </p>
              <p className="break-all font-mono text-xs">{address.trim()}</p>
              <p className="font-bold tabular-nums text-[color:var(--fd-text)]">
                {amount} {unit}
                {totalDebit != null ? ` → ${totalDebit.toLocaleString()} ${unit}` : ""}
              </p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="min-h-[48px] rounded-xl border border-[color:var(--fd-border)] font-semibold"
              >
                {t("back")}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void submit()}
                className="min-h-[48px] rounded-xl bg-[color:var(--fd-primary)] font-bold text-white disabled:opacity-50"
              >
                {loading ? "…" : t("withdraw_confirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <FlowHubLink label={t("wallet_title")} />
    </WalletFlowShell>
  );
}


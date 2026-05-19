"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { NetworkId } from "@/lib/networks";
import { NetworkPicker } from "@/components/wallet/network-picker";
import { formatAuthClientError } from "@/lib/format-auth-client-error";
import { useI18n } from "@/components/i18n-provider";
import { interpolate } from "@/i18n/messages";
import {
  EXTERNAL_WITHDRAW_FEE_PI,
  EXTERNAL_WITHDRAW_FEE_USDT,
} from "@/lib/withdraw-fees";
import { PI_MAIN_NETWORK_ID } from "@/lib/pi-constants";
import { ProcessingSheet } from "@/components/wallet/processing-sheet";
import {
  FlowCard,
  FlowHubLink,
  FlowPrimaryBtn,
  WalletFlowShell,
} from "@/components/wallet/wallet-flow-shell";
import { withdrawalProgressSteps } from "@/lib/transaction-steps";
import { WithdrawalStatus } from "@/lib/status";

type WAsset = "USDT" | "PI";

export default function WithdrawPage() {
  const { t } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const [wAsset, setWAsset] = useState<WAsset>("USDT");
  const [network, setNetwork] = useState<NetworkId>("TRC20");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feeUsdt, setFeeUsdt] = useState(EXTERNAL_WITHDRAW_FEE_USDT);
  const [feePi, setFeePi] = useState(EXTERNAL_WITHDRAW_FEE_PI);
  const [minUsdt, setMinUsdt] = useState(10);
  const [processingOpen, setProcessingOpen] = useState(false);

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
        if (typeof data.minNetUsdt === "number") setMinUsdt(data.minNetUsdt);
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
          amount,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(formatAuthClientError(data));
        setShowConfirm(false);
        return;
      }
      setProcessingOpen(true);
      window.setTimeout(() => {
        router.push("/app/wallet/history");
        router.refresh();
      }, 2200);
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  }

  const addrOk =
    wAsset === "PI"
      ? address.trim().length >= 20
      : address.trim().length >= 10;

  const feeNote =
    wAsset === "USDT"
      ? interpolate(t("fee_note"), { fee: String(feeUsdt), min: String(minUsdt) })
      : interpolate(t("fee_note_asset"), {
          fee: String(feePi),
          min: "0",
          unit: "PI",
        });

  return (
    <WalletFlowShell
      title={t("withdraw_title")}
      subtitle={t("withdraw_pick_asset")}
    >
      <FlowCard>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setWAsset("USDT")}
            className={`flex flex-col items-center gap-1.5 rounded-xl p-3 transition ${
              wAsset === "USDT"
                ? "bg-emerald-50 ring-2 ring-[color:var(--fd-primary)]"
                : "bg-stone-50"
            }`}
          >
            <Image src="/assets/crypto/usdt.png" alt="" width={40} height={40} className="rounded-full" />
            <span className="text-xs font-bold">USDT</span>
            <span className="text-center text-[9px] text-[color:var(--fd-muted)]">
              {t("asset_usdt_full")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setWAsset("PI")}
            className={`flex flex-col items-center gap-1.5 rounded-xl p-3 transition ${
              wAsset === "PI" ? "bg-violet-50 ring-2 ring-violet-500" : "bg-stone-50"
            }`}
          >
            <Image src="/assets/crypto/pi.png" alt="" width={40} height={40} className="rounded-full" />
            <span className="text-xs font-bold">Pi</span>
            <span className="text-center text-[9px] text-[color:var(--fd-muted)]">
              {t("asset_pi_network")}
            </span>
          </button>
        </div>
      </FlowCard>

      {wAsset === "USDT" ? (
        <div className="mt-3">
          <NetworkPicker
            label={t("deposit_step_usdt_network")}
            value={network}
            onChange={setNetwork}
          />
        </div>
      ) : (
        <p className="mt-3 text-center text-xs font-semibold text-violet-800">
          {t("deposit_network_pi_main")}
        </p>
      )}

      <FlowCard className="mt-3 space-y-3">
        <label className="block">
          <span className="text-xs font-bold uppercase text-[color:var(--fd-muted)]">
            {wAsset === "PI" ? t("withdraw_addr_pi_ph") : t("withdraw_addr")}
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
          <p className="mt-1 text-[10px] text-[color:var(--fd-muted)]">{feeNote}</p>
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
                <strong className="text-[color:var(--fd-text)]">{wAsset}</strong>
                {wAsset === "USDT" ? ` · ${network}` : ` · ${t("deposit_network_pi_main")}`}
              </p>
              <p className="break-all font-mono text-xs">{address.trim()}</p>
              {totalDebit != null ? (
                <p className="font-bold tabular-nums text-[color:var(--fd-text)]">
                  {interpolate(t("withdraw_confirm_debit"), {
                    net: amount,
                    total: String(totalDebit),
                    unit,
                  })}
                </p>
              ) : null}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
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

      <ProcessingSheet
        open={processingOpen}
        title={t("withdraw_title")}
        steps={withdrawalProgressSteps(WithdrawalStatus.PENDING_AGENT)}
        onClose={() => setProcessingOpen(false)}
      />
    </WalletFlowShell>
  );
}

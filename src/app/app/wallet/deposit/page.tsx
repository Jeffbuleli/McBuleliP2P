"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { NetworkId } from "@/lib/networks";
import { NetworkPicker } from "@/components/wallet/network-picker";
import { clientErrorText } from "@/lib/client-error-text";
import { formatAuthClientError } from "@/lib/format-auth-client-error";
import { useI18n } from "@/components/i18n-provider";
import { IconAlert } from "@/components/icons/flow-icons";
import { WalletAssetIcon } from "@/components/wallet/wallet-asset-icon";
import { WalletErrorBanner, walletInputClass } from "@/components/wallet/wallet-form";
import {
  FlowBackLink,
  FlowCard,
  FlowHubLink,
  FlowPrimaryBtn,
  WalletFlowShell,
} from "@/components/wallet/wallet-flow-shell";

type Step = 1 | 2;
type PickAsset = "USDT" | "PI";

export default function DepositWizardPage() {
  const { t } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [asset, setAsset] = useState<PickAsset | null>(null);

  useEffect(() => {
    const a = sp.get("asset");
    if (a === "PI") {
      setAsset("PI");
      setStep(1);
    } else if (a === "USDT") {
      setAsset("USDT");
      setStep(1);
    } else {
      router.replace("/app/wallet");
    }
  }, [sp, router]);

  const [network, setNetwork] = useState<NetworkId>("TRC20");
  const [acceptedRisk, setAcceptedRisk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabledUsdt, setEnabledUsdt] = useState<boolean | null>(null);
  const [enabledPi, setEnabledPi] = useState<boolean | null>(null);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [routesError, setRoutesError] = useState<string | null>(null);
  const [usdtNeedsSetup, setUsdtNeedsSetup] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [declaredAmountUsdt, setDeclaredAmountUsdt] = useState("");
  const [declaredAmountPi, setDeclaredAmountPi] = useState("");
  const [userNote, setUserNote] = useState("");

  useEffect(() => {
    void (async () => {
      setRoutesLoading(true);
      setRoutesError(null);
      try {
        const res = await fetch("/api/config/deposit-routes");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setEnabledUsdt(false);
          setEnabledPi(false);
          setUsdtNeedsSetup(false);
          setIsAdmin(false);
          setRoutesError(t("deposit_unavailable"));
          return;
        }
        setEnabledUsdt(Boolean(data.usdtBinance));
        setEnabledPi(Boolean(data.piManual));
        setUsdtNeedsSetup(Boolean(data.usdtBinanceNeedsSetup));
        setIsAdmin(Boolean(data.isAdmin));
      } catch {
        setEnabledUsdt(false);
        setEnabledPi(false);
        setUsdtNeedsSetup(false);
        setIsAdmin(false);
        setRoutesError(t("deposit_unavailable"));
      } finally {
        setRoutesLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  const routesReady = !routesLoading;
  const routeEnabled =
    asset === "USDT" ? enabledUsdt === true : asset === "PI" ? enabledPi === true : false;

  const unavailableMsg = (() => {
    if (!routesReady || !asset) return null;
    if (routeEnabled) return null;
    if (!isAdmin) return t("deposit_unavailable");
    if (asset === "USDT") return t("deposit_unavailable_usdt");
    return t("deposit_unavailable_pi");
  })();

  function pickNetwork(id: NetworkId) {
    setNetwork(id);
    setAcceptedRisk(false);
  }

  async function createIntent() {
    if (!asset) return;
    setError(null);
    setLoading(true);
    try {
      const body =
        asset === "USDT"
          ? {
              provider: "binance" as const,
              asset: "USDT" as const,
              network,
              declaredAmountUsdt: declaredAmountUsdt.trim().replace(",", "."),
              userNote: userNote.trim() || undefined,
            }
          : {
              provider: "manual" as const,
              asset: "PI" as const,
              network: "PI_MAIN" as const,
              declaredAmountPi: declaredAmountPi.trim().replace(",", "."),
              userNote: userNote.trim() || undefined,
            };

      const res = await fetch("/api/deposits/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const rec = data as Record<string, unknown>;
        const msg = typeof rec.message === "string" ? rec.message : "";
        if (msg === "deposit_declared_below_min" && typeof rec.min === "string") {
          setError(
            asset === "PI"
              ? t("deposit_declared_below_min", { min: `${rec.min} π` })
              : t("deposit_declared_below_min", { min: rec.min }),
          );
          return;
        }
        if (msg.startsWith("deposit_") || msg.startsWith("wallet_binance_")) {
          const adminDetail =
            isAdmin && typeof rec.adminDetail === "string" ? rec.adminDetail.trim() : "";
          const base = clientErrorText(t, msg);
          setError(adminDetail ? `${base}\n\n${adminDetail}` : base);
          return;
        }
        setError(
          formatAuthClientError(data, t, { includeAdminDetail: isAdmin }) ||
            t("deposit_provider_unavailable"),
        );
        return;
      }
      const id = data.deposit?.id as string | undefined;
      if (id) router.push(`/app/wallet/deposit/${id}`);
    } finally {
      setLoading(false);
    }
  }

  const declaredAmount =
    asset === "USDT"
      ? declaredAmountUsdt.trim().replace(",", ".")
      : declaredAmountPi.trim().replace(",", ".");
  const declaredNum = Number(declaredAmount);
  const hasValidAmount = Number.isFinite(declaredNum) && declaredNum > 0;

  const confirmText =
    asset === "USDT"
      ? `${t("deposit_confirm_chk_usdt")} ${network}`
      : t("deposit_confirm_chk_pi");

  const totalSteps = asset === "PI" ? 1 : 2;
  const headerStep = asset === "PI" ? 1 : step;
  const showNetwork = asset === "USDT" && step === 1;
  const showAmount = (asset === "USDT" && step === 2) || asset === "PI";

  if (!asset) {
    return (
      <WalletFlowShell title={t("deposit")}>
        <p className="text-center text-[color:var(--fd-muted)]">…</p>
      </WalletFlowShell>
    );
  }

  return (
    <WalletFlowShell
      title={t("deposit")}
      subtitle={`${t("deposit_step")} ${headerStep}/${totalSteps}`}
      step={headerStep}
      totalSteps={totalSteps}
    >
      {routesLoading ? (
        <FlowCard>
          <p className="text-sm text-[color:var(--fd-muted)]">{t("deposit_loading")}</p>
        </FlowCard>
      ) : null}
      {routesError ? (
        <FlowCard className="border-rose-400/30 bg-rose-500/10">
          <p className="text-sm text-rose-300">{routesError}</p>
        </FlowCard>
      ) : null}
      {unavailableMsg ? (
        <FlowCard className="border-rose-400/30 bg-rose-500/10">
          <p className="text-sm text-rose-300">{unavailableMsg}</p>
        </FlowCard>
      ) : null}
      {routesReady && isAdmin && asset === "USDT" && enabledUsdt && usdtNeedsSetup ? (
        <FlowCard className="border-amber-400/30 bg-amber-500/10">
          <p className="text-sm text-amber-300">{t("deposit_binance_setup_hint")}</p>
        </FlowCard>
      ) : null}

      {showNetwork ? (
        <section>
          <NetworkPicker
            label={t("deposit_step_usdt_network")}
            value={network}
            onChange={pickNetwork}
          />
          <p className="mt-3 text-center text-xs font-semibold text-emerald-300">{network}</p>
          <FlowPrimaryBtn onClick={() => setStep(2)}>{t("continue")}</FlowPrimaryBtn>
          <FlowHubLink label={t("wallet_title")} />
        </section>
      ) : null}

      {showAmount ? (
        <section className="space-y-3">
          {asset === "USDT" ? (
            <FlowCard>
              <label className="block">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[color:var(--fd-muted)]">
                  {t("deposit_declared_amount_label")}
                </span>
                <input
                  value={declaredAmountUsdt}
                  onChange={(e) => setDeclaredAmountUsdt(e.target.value)}
                  inputMode="decimal"
                  placeholder="1"
                  className={`${walletInputClass} mt-2 text-lg font-bold`}
                />
              </label>
              <label className="mt-3 block">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[color:var(--fd-muted)]">
                  {t("deposit_user_note_label")}
                </span>
                <input
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  className={`${walletInputClass} mt-2`}
                />
              </label>
            </FlowCard>
          ) : (
            <FlowCard>
              <div className="mb-3 flex items-center gap-3">
                <WalletAssetIcon asset="PI" size={44} />
                <p className="text-sm font-bold text-[color:var(--fd-text)]">
                  Pi · {t("deposit_network_pi_main")}
                </p>
              </div>
              <label className="block">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[color:var(--fd-muted)]">
                  {t("deposit_declared_amount_pi_label")}
                </span>
                <input
                  value={declaredAmountPi}
                  onChange={(e) => setDeclaredAmountPi(e.target.value)}
                  inputMode="decimal"
                  placeholder="10"
                  className={`${walletInputClass} mt-2 text-lg font-bold`}
                />
              </label>
              <label className="mt-3 block">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[color:var(--fd-muted)]">
                  {t("deposit_pi_memo_label")}
                </span>
                <input
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  placeholder={t("deposit_pi_memo_placeholder")}
                  className={`${walletInputClass} mt-2`}
                />
              </label>
            </FlowCard>
          )}

          {hasValidAmount ? (
            <FlowCard className="border-emerald-400/30 bg-emerald-500/8">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-400/80">
                {t("deposit_recap_title")}
              </p>
              <dl className="mt-2 space-y-1.5 text-sm text-[color:var(--fd-text)]">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[color:var(--fd-muted)]">{t("wallet_transfer_asset")}</dt>
                  <dd className="font-bold">{asset}</dd>
                </div>
                {asset === "USDT" ? (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-[color:var(--fd-muted)]">{t("deposit_step_usdt_network")}</dt>
                    <dd className="font-bold">{network}</dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[color:var(--fd-muted)]">
                    {asset === "PI" ? t("deposit_declared_amount_pi_label") : t("deposit_declared_amount_label")}
                  </dt>
                  <dd className="font-bold tabular-nums">
                    {declaredAmount} {asset === "PI" ? "π" : asset}
                  </dd>
                </div>
                {userNote.trim() ? (
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-[color:var(--fd-muted)]">{t("deposit_user_note_label")}</dt>
                    <dd className="max-w-[60%] text-right text-xs">{userNote.trim()}</dd>
                  </div>
                ) : null}
              </dl>
            </FlowCard>
          ) : null}

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-[#0a1018]/90 p-4">
            <input
              type="checkbox"
              checked={acceptedRisk}
              onChange={(e) => setAcceptedRisk(e.target.checked)}
              className="size-5 shrink-0 accent-emerald-400"
            />
            <span className="flex items-center gap-2 text-sm font-semibold text-[color:var(--fd-text)]">
              <IconAlert className="h-5 w-5 shrink-0 text-amber-400" />
              {confirmText}
            </span>
          </label>

          {error ? (
            <WalletErrorBanner>
              <span className="whitespace-pre-wrap">{error}</span>
            </WalletErrorBanner>
          ) : null}

          <FlowPrimaryBtn
            disabled={
              !acceptedRisk ||
              loading ||
              !routesReady ||
              !routeEnabled ||
              (asset === "USDT" &&
                (!declaredAmountUsdt.trim() ||
                  Number(declaredAmountUsdt.trim().replace(",", ".")) <= 0)) ||
              (asset === "PI" &&
                (!declaredAmountPi.trim() ||
                  Number(declaredAmountPi.trim().replace(",", ".")) <= 0))
            }
            onClick={() => void createIntent()}
          >
            {loading ? t("deposit_loading") : t("deposit_show_addr")}
          </FlowPrimaryBtn>
          {asset === "USDT" ? (
            <FlowBackLink onClick={() => setStep(1)} label={t("back")} />
          ) : (
            <FlowHubLink label={t("wallet_title")} />
          )}
        </section>
      ) : null}
    </WalletFlowShell>
  );
}

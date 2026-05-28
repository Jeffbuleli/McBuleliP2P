"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { NetworkId } from "@/lib/networks";
import { NetworkPicker } from "@/components/wallet/network-picker";
import { clientErrorText } from "@/lib/client-error-text";
import { formatAuthClientError } from "@/lib/format-auth-client-error";
import { useI18n } from "@/components/i18n-provider";
import { IconAlert } from "@/components/icons/flow-icons";
import {
  FlowBackLink,
  FlowCard,
  FlowHubLink,
  FlowPrimaryBtn,
  WalletFlowShell,
} from "@/components/wallet/wallet-flow-shell";

type Step = 1 | 2 | 3;
type PickAsset = "USDT" | "PI";

export default function DepositWizardPage() {
  const { t } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [asset, setAsset] = useState<PickAsset>("USDT");

  useEffect(() => {
    const a = sp.get("asset");
    if (a === "PI" || a === "USDT") setAsset(a);
  }, [sp]);
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

  const anyEnabled = enabledUsdt === true || enabledPi === true;
  const routesReady = !routesLoading;
  const noneEnabled = routesReady && !anyEnabled;

  const unavailableMsg = (() => {
    if (!noneEnabled) return null;
    if (!isAdmin) return t("deposit_unavailable");
    if (enabledUsdt === false && enabledPi === false) {
      return t("deposit_unavailable_both");
    }
    if (enabledUsdt === false) return t("deposit_unavailable_usdt");
    return t("deposit_unavailable_pi");
  })();

  function pickNetwork(id: NetworkId) {
    setNetwork(id);
    setAcceptedRisk(false);
  }

  async function createIntent() {
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
        if (
          msg.startsWith("deposit_") ||
          msg.startsWith("wallet_binance_")
        ) {
          const detail =
            typeof rec.detail === "string" && rec.detail.trim()
              ? rec.detail.trim()
              : "";
          const base = clientErrorText(t, msg);
          const showDetail =
            detail &&
            msg === "deposit_provider_unavailable" &&
            process.env.NODE_ENV === "development";
          setError(showDetail ? `${base} (${detail})` : base);
          return;
        }
        setError(
          formatAuthClientError(data) ||
            "Could not create deposit. Check server configuration.",
        );
        return;
      }
      const id = data.deposit?.id as string | undefined;
      if (id) router.push(`/app/deposit/${id}`);
    } finally {
      setLoading(false);
    }
  }

  const confirmText =
    asset === "USDT"
      ? `${t("deposit_confirm_chk_usdt")} ${network}`
      : t("deposit_confirm_chk_pi");

  const stepSubtitle = `${t("deposit_step")} ${step}/3`;

  return (
    <WalletFlowShell
      title={t("deposit")}
      subtitle={stepSubtitle}
      step={step}
      totalSteps={3}
    >
      {routesLoading ? (
        <p className="fd-card px-3 py-2 text-sm text-[color:var(--fd-muted)]">
          {t("deposit_loading")}
        </p>
      ) : null}
      {routesError ? (
        <p className="fd-card px-3 py-2 text-sm text-rose-800">{routesError}</p>
      ) : null}
      {unavailableMsg ? (
        <p className="fd-card px-3 py-2 text-sm text-rose-800">{unavailableMsg}</p>
      ) : null}
      {routesReady && isAdmin && enabledUsdt && usdtNeedsSetup ? (
        <p className="fd-card border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {t("deposit_binance_setup_hint")}
        </p>
      ) : null}
      {step === 1 && (
        <section>
          <p className="mb-3 text-center text-xs font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
            {t("deposit_pick_asset")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={!routesReady || enabledUsdt !== true}
              onClick={() => {
                setAsset("USDT");
                setStep(2);
              }}
              className="fd-card flex flex-col items-center gap-2 p-4 active:scale-[0.98] disabled:opacity-45"
            >
              <Image src="/assets/crypto/usdt.png" alt="" width={48} height={48} className="rounded-full" />
              <span className="text-sm font-bold text-[color:var(--fd-text)]">USDT</span>
              <span className="text-center text-[10px] leading-tight text-[color:var(--fd-muted)]">
                {t("asset_usdt_full")}
              </span>
            </button>
            <button
              type="button"
              disabled={!routesReady || enabledPi !== true}
              onClick={() => {
                setAsset("PI");
                setStep(3);
              }}
              className="fd-card flex flex-col items-center gap-2 p-4 active:scale-[0.98] disabled:opacity-45"
            >
              <Image src="/assets/crypto/pi.png" alt="" width={48} height={48} className="rounded-full" />
              <span className="text-sm font-bold text-[color:var(--fd-text)]">Pi</span>
              <span className="text-center text-[10px] leading-tight text-[color:var(--fd-muted)]">
                {t("asset_pi_network")}
              </span>
            </button>
          </div>
        </section>
      )}

      {step === 2 && asset === "USDT" && (
        <section>
          <NetworkPicker
            label={t("deposit_step_usdt_network")}
            value={network}
            onChange={pickNetwork}
          />
          <p className="mt-3 text-center text-xs font-semibold text-[color:var(--fd-primary)]">
            {network}
          </p>
          <FlowPrimaryBtn onClick={() => setStep(3)}>{t("continue")}</FlowPrimaryBtn>
          <FlowBackLink onClick={() => setStep(1)} label={t("back")} />
        </section>
      )}

      {step === 3 && (
        <section className="space-y-3">
          {asset === "USDT" ? (
            <FlowCard>
              <label className="block">
                <span className="text-xs font-bold uppercase text-[color:var(--fd-muted)]">
                  {t("deposit_declared_amount_label")}
                </span>
                <input
                  value={declaredAmountUsdt}
                  onChange={(e) => setDeclaredAmountUsdt(e.target.value)}
                  inputMode="decimal"
                  placeholder="20"
                  className="mt-2 w-full rounded-xl border border-[color:var(--fd-border)] bg-white px-4 py-3 text-lg font-bold tabular-nums text-[color:var(--fd-text)] outline-none focus:ring-2 focus:ring-[color:var(--fd-primary)]/30"
                />
              </label>
              <label className="mt-3 block">
                <span className="text-xs font-bold uppercase text-[color:var(--fd-muted)]">
                  {t("deposit_user_note_label")}
                </span>
                <input
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[color:var(--fd-border)] bg-white px-4 py-2.5 text-sm text-[color:var(--fd-text)] outline-none focus:ring-2 focus:ring-[color:var(--fd-primary)]/30"
                />
              </label>
            </FlowCard>
          ) : (
            <FlowCard>
              <div className="mb-3 flex items-center gap-3">
                <Image src="/assets/crypto/pi.png" alt="" width={44} height={44} className="rounded-full" />
                <p className="text-sm font-bold text-[color:var(--fd-text)]">
                  Pi · {t("deposit_network_pi_main")}
                </p>
              </div>
              <label className="block">
                <span className="text-xs font-bold uppercase text-[color:var(--fd-muted)]">
                  {t("deposit_declared_amount_pi_label")}
                </span>
                <input
                  value={declaredAmountPi}
                  onChange={(e) => setDeclaredAmountPi(e.target.value)}
                  inputMode="decimal"
                  placeholder="10"
                  className="mt-2 w-full rounded-xl border border-[color:var(--fd-border)] bg-white px-4 py-3 text-lg font-bold tabular-nums text-[color:var(--fd-text)] outline-none focus:ring-2 focus:ring-[color:var(--fd-primary)]/30"
                />
              </label>
              <label className="mt-3 block">
                <span className="text-xs font-bold uppercase text-[color:var(--fd-muted)]">
                  {t("deposit_pi_memo_label")}
                </span>
                <input
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  placeholder={t("deposit_pi_memo_placeholder")}
                  className="mt-2 w-full rounded-xl border border-[color:var(--fd-border)] bg-white px-4 py-2.5 text-sm text-[color:var(--fd-text)] outline-none focus:ring-2 focus:ring-[color:var(--fd-primary)]/30"
                />
              </label>
            </FlowCard>
          )}

          <label className="fd-card flex cursor-pointer items-center gap-3 p-4">
            <input
              type="checkbox"
              checked={acceptedRisk}
              onChange={(e) => setAcceptedRisk(e.target.checked)}
              className="size-5 shrink-0 accent-[color:var(--fd-primary)]"
            />
            <span className="flex items-center gap-2 text-sm font-semibold text-[color:var(--fd-text)]">
              <IconAlert className="h-5 w-5 shrink-0 text-amber-700" />
              {confirmText}
            </span>
          </label>

          {error ? (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p>
          ) : null}

          <FlowPrimaryBtn
            disabled={
              !acceptedRisk ||
              loading ||
              !routesReady ||
              (asset === "USDT" && enabledUsdt !== true) ||
              (asset === "PI" && enabledPi !== true) ||
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
          <FlowBackLink
            onClick={() => setStep(asset === "USDT" ? 2 : 1)}
            label={t("back")}
          />
        </section>
      )}

      <FlowHubLink label={t("wallet_title")} />
    </WalletFlowShell>
  );
}


"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { NetworkId } from "@/lib/networks";
import { NetworkPicker } from "@/components/wallet/network-picker";
import { clientErrorText } from "@/lib/client-error-text";
import { formatAuthClientError } from "@/lib/format-auth-client-error";
import { useI18n } from "@/components/i18n-provider";
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
  const [step, setStep] = useState<Step>(1);
  const [asset, setAsset] = useState<PickAsset>("USDT");
  const [network, setNetwork] = useState<NetworkId>("TRC20");
  const [acceptedRisk, setAcceptedRisk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabledUsdt, setEnabledUsdt] = useState<boolean | null>(null);
  const [enabledPi, setEnabledPi] = useState<boolean | null>(null);
  const [declaredAmountUsdt, setDeclaredAmountUsdt] = useState("");
  const [userNote, setUserNote] = useState("");
  const [binanceEnv, setBinanceEnv] = useState<"demo" | "live" | null>(null);
  const [binanceConfigWarn, setBinanceConfigWarn] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/config/deposit-routes");
        const data = await res.json();
        setEnabledUsdt(Boolean(data.usdtBinance));
        setEnabledPi(Boolean(data.piManual));
        const env = data.binanceEnv;
        setBinanceEnv(env === "demo" || env === "live" ? env : null);
        if (
          data.usdtBinance &&
          data.binanceSpotOk === true &&
          data.binanceEnableWithdrawals === false
        ) {
          setBinanceConfigWarn(t("wallet_binance_error_wallet_permission"));
        } else {
          setBinanceConfigWarn(null);
        }
      } catch {
        setEnabledUsdt(false);
        setEnabledPi(false);
        setBinanceEnv(null);
        setBinanceConfigWarn(null);
      }
    })();
  }, [t]);

  const anyEnabled = enabledUsdt === true || enabledPi === true;

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
          setError(t("deposit_declared_below_min", { min: rec.min }));
          return;
        }
        if (msg.startsWith("deposit_") || msg.startsWith("wallet_binance_")) {
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

  const confirmLabel =
    asset === "USDT" ? `${network}` : "Pi";

  const stepSubtitle = `${t("deposit_step")} ${step}/3`;

  const envBadge =
    binanceEnv && enabledUsdt ? (
      <span
        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
          binanceEnv === "demo"
            ? "bg-amber-100 text-amber-900"
            : "bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]"
        }`}
      >
        {binanceEnv === "demo" ? t("wallet_binance_env_demo") : t("wallet_binance_env_live")}
      </span>
    ) : null;

  return (
    <WalletFlowShell
      title={t("deposit")}
      subtitle={stepSubtitle}
      step={step}
      totalSteps={3}
      headerBadge={envBadge}
    >
      {!anyEnabled ? (
        <p className="fd-card px-3 py-2 text-sm text-rose-800">{t("deposit_unavailable")}</p>
      ) : null}
      {binanceConfigWarn ? (
        <p className="fd-card border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-snug text-amber-950">
          {binanceConfigWarn}
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
              disabled={enabledUsdt !== true}
              onClick={() => {
                setAsset("USDT");
                setStep(2);
              }}
              className="fd-card flex flex-col items-center gap-2 p-4 active:scale-[0.98] disabled:opacity-45"
            >
              <Image src="/assets/crypto/usdt.png" alt="" width={48} height={48} className="rounded-full" />
              <span className="text-sm font-bold text-[color:var(--fd-text)]">USDT</span>
            </button>
            <button
              type="button"
              disabled={enabledPi !== true}
              onClick={() => {
                setAsset("PI");
                setStep(3);
              }}
              className="fd-card flex flex-col items-center gap-2 p-4 active:scale-[0.98] disabled:opacity-45"
            >
              <Image src="/assets/crypto/pi.png" alt="" width={48} height={48} className="rounded-full" />
              <span className="text-sm font-bold text-[color:var(--fd-text)]">Pi</span>
            </button>
          </div>
        </section>
      )}

      {step === 2 && asset === "USDT" && (
        <section>
          <NetworkPicker
            label={t("deposit_network")}
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
            <FlowCard className="flex items-center gap-3">
              <Image src="/assets/crypto/pi.png" alt="" width={44} height={44} className="rounded-full" />
              <p className="text-sm font-bold text-[color:var(--fd-text)]">Pi · {t("deposit_network_pi_main")}</p>
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
              <span className="text-lg" aria-hidden>
                ⚠️
              </span>
              {t("deposit_confirm_chk")} <strong>{confirmLabel}</strong>
            </span>
          </label>

          {error ? (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p>
          ) : null}

          <FlowPrimaryBtn
            disabled={
              !acceptedRisk ||
              loading ||
              (asset === "USDT" && enabledUsdt !== true) ||
              (asset === "PI" && enabledPi !== true) ||
              (asset === "USDT" &&
                (!declaredAmountUsdt.trim() ||
                  Number(declaredAmountUsdt.trim().replace(",", ".")) <= 0))
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


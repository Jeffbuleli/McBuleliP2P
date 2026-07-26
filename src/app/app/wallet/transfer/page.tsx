"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { type WalletAsset } from "@/lib/wallet-types";
import { clientErrorText } from "@/lib/client-error-text";
import { formatAuthClientError } from "@/lib/format-auth-client-error";
import { parseWalletPayRecipient } from "@/lib/wallet-pay-uri";
import { WalletQrScanner } from "@/components/wallet/wallet-qr-scanner";
import { WalletAssetIcon } from "@/components/wallet/wallet-asset-icon";
import { ProcessingSheet } from "@/components/wallet/processing-sheet";
import { WalletStepUpField } from "@/components/wallet/wallet-step-up-field";
import { WalletPasskeyStepUpButton } from "@/components/wallet/wallet-passkey-step-up-button";
import { transferProgressSteps } from "@/lib/transaction-steps";
import {
  FlowCard,
  FlowHubLink,
  FlowPrimaryBtn,
  WalletFlowShell,
} from "@/components/wallet/wallet-flow-shell";
import { StatusOutcomeBanner } from "@/components/wallet/transaction-progress";

const TRANSFER_ASSETS = ["USDT", "PI", "USD", "CDF"] as const satisfies readonly WalletAsset[];

type TransferAsset = (typeof TRANSFER_ASSETS)[number];

type RecipientMode = "email" | "pay";

type RecipientPreview = {
  userId: string;
  displayName: string;
  emailMasked: string;
  email?: string;
};

function TransferForm() {
  const { t } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const [asset, setAsset] = useState<TransferAsset>("USDT");
  const [mode, setMode] = useState<RecipientMode>("email");
  const [email, setEmail] = useState("");
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [processingOpen, setProcessingOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [preview, setPreview] = useState<RecipientPreview | null>(null);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [passkeyCount, setPasskeyCount] = useState(0);
  const [totpCode, setTotpCode] = useState("");
  const [stepUpViaPasskey, setStepUpViaPasskey] = useState(false);

  const assetParam = sp.get("asset");
  const assetLocked =
    Boolean(assetParam) &&
    (TRANSFER_ASSETS as readonly string[]).includes(assetParam!);

  useEffect(() => {
    const a = sp.get("asset");
    if (a && (TRANSFER_ASSETS as readonly string[]).includes(a)) {
      setAsset(a as (typeof TRANSFER_ASSETS)[number]);
    }
    const to = sp.get("to");
    if (to) {
      const id = parseWalletPayRecipient(to);
      if (id) {
        setMode("pay");
        setRecipientId(id);
      }
    }
  }, [sp]);

  useEffect(() => {
    if (mode === "pay" && !recipientId && !done) {
      setScannerOpen(true);
    }
  }, [mode, recipientId, done]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/auth/security");
        if (!res.ok) return;
        const data = await res.json();
        setTotpEnabled(Boolean(data.totpEnabled));
        setPasskeyCount(typeof data.passkeyCount === "number" ? data.passkeyCount : 0);
      } catch {
        /* optional */
      }
    })();
  }, []);

  function onScanned(raw: string) {
    const id = parseWalletPayRecipient(raw);
    setScannerOpen(false);
    if (!id) {
      setErr("wallet_transfer_invalid_recipient");
      return;
    }
    setErr(null);
    setRecipientId(id);
  }

  function switchMode(next: RecipientMode) {
    setMode(next);
    setErr(null);
    setPreview(null);
    if (next === "email") {
      setScannerOpen(false);
      setRecipientId(null);
    } else if (!recipientId) {
      setScannerOpen(true);
    }
  }

  const canSubmit =
    mode === "email"
      ? email.trim().includes("@") && amount.trim() && Number(amount) > 0
      : Boolean(recipientId) && amount.trim() && Number(amount) > 0;

  const needsStepUp = totpEnabled || passkeyCount > 0;
  const stepUpReady =
    stepUpViaPasskey || (totpEnabled && totpCode.trim().length >= 6);

  async function openConfirm() {
    setErr(null);
    setConfirmError(null);
    setTotpCode("");
    setStepUpViaPasskey(false);
    setLoading(true);
    try {
      const qs = new URLSearchParams(
        mode === "email"
          ? { email: email.trim() }
          : { userId: recipientId! },
      );
      const res = await fetch(`/api/wallet/transfer/resolve?${qs}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(
          typeof data.error === "string" ? data.error : "wallet_transfer_failed",
        );
        return;
      }
      setPreview(data.recipient as RecipientPreview);
      setShowConfirm(true);
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    setErr(null);
    setConfirmError(null);
    setLoading(true);
    try {
      const body: Record<string, unknown> =
        mode === "email"
          ? { recipientEmail: email.trim(), asset, amount, memo }
          : { recipientUserId: recipientId, asset, amount, memo };
      if (totpEnabled && totpCode.trim()) {
        body.totpCode = totpCode.trim();
      }
      const res = await fetch("/api/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errCode =
          typeof data === "object" && data && "error" in data
            ? String((data as { error?: unknown }).error ?? "")
            : "";
        const msg = formatAuthClientError(data, t);
        const keepModal =
          errCode === "step_up_required" ||
          errCode === "totp_required" ||
          errCode === "totp_invalid" ||
          errCode === "passkey_invalid" ||
          errCode === "passkey_not_found" ||
          errCode === "challenge_expired";
        if (keepModal) {
          setConfirmError(msg);
        } else {
          setErr(
            typeof data.error === "string" ? data.error : "wallet_transfer_failed",
          );
          setShowConfirm(false);
        }
        return;
      }
      if (data.recipient) {
        setPreview(data.recipient as RecipientPreview);
      }
      setShowConfirm(false);
      setTotpCode("");
      setStepUpViaPasskey(false);
      setDone(true);
      setProcessingOpen(true);
      window.setTimeout(() => {
        router.push("/app/wallet/history");
        router.refresh();
      }, 1800);
    } finally {
      setLoading(false);
    }
  }

  const subtitle =
    mode === "pay" ? t("wallet_mcbuleli_pay") : t("wallet_action_send");

  const recipientLabel = preview
    ? preview.email ?? `${preview.displayName} · ${preview.emailMasked}`
    : null;

  return (
    <>
      <WalletFlowShell title={t("wallet_transfer_title")} subtitle={subtitle}>
        {assetLocked ? (
          <FlowCard>
            <div className="flex items-center justify-center gap-3 rounded-xl bg-[color:var(--fd-mint)] px-4 py-3 ring-1 ring-[color:var(--fd-primary)]/20">
              <WalletAssetIcon asset={asset} size={36} />
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
                  {t("wallet_transfer_asset")}
                </p>
                <p className="text-base font-extrabold text-[color:var(--fd-text)]">{asset}</p>
              </div>
            </div>
          </FlowCard>
        ) : (
          <FlowCard>
            <p className="mb-2 text-center text-xs font-bold uppercase text-[color:var(--fd-muted)]">
              {t("wallet_transfer_asset")}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {TRANSFER_ASSETS.map((a) => {
                const active = asset === a;
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAsset(a)}
                    className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 ${
                      active ? "bg-emerald-50 ring-2 ring-[color:var(--fd-primary)]" : "bg-stone-50"
                    }`}
                  >
                    <WalletAssetIcon asset={a} size={32} />
                    <span className="text-[10px] font-bold">{a}</span>
                  </button>
                );
              })}
            </div>
          </FlowCard>
        )}

        {done ? (
          <StatusOutcomeBanner
            variant="success"
            title={t("wallet_transfer_success")}
            detail={`${amount} ${asset}${recipientLabel ? ` → ${recipientLabel}` : ""}`}
          />
        ) : null}

        <FlowCard className="mt-3 space-y-3">
          <div className="flex gap-2 rounded-xl bg-stone-100 p-1">
            <button
              type="button"
              onClick={() => switchMode("email")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold ${
                mode === "email"
                  ? "bg-white text-[color:var(--fd-primary)] shadow-sm"
                  : "text-[color:var(--fd-muted)]"
              }`}
            >
              {t("wallet_transfer_mode_email")}
            </button>
            <button
              type="button"
              onClick={() => switchMode("pay")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold ${
                mode === "pay"
                  ? "bg-white text-[color:var(--fd-primary)] shadow-sm"
                  : "text-[color:var(--fd-muted)]"
              }`}
            >
              {t("wallet_mcbuleli_pay")}
            </button>
          </div>

          {mode === "email" ? (
            <label className="block">
              <span className="text-xs font-bold uppercase text-[color:var(--fd-muted)]">
                {t("wallet_transfer_email")}
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[color:var(--fd-border)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--fd-primary)]/30"
                autoComplete="email"
              />
            </label>
          ) : recipientId ? (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-[color:var(--fd-primary)]/25 bg-[color:var(--fd-mint)] px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
                  McBuleli Pay
                </p>
                <p className="truncate font-mono text-xs font-semibold text-[color:var(--fd-text)]">
                  {recipientId.slice(0, 8)}…{recipientId.slice(-4)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRecipientId(null);
                  setScannerOpen(true);
                }}
                className="shrink-0 text-xs font-bold text-[color:var(--fd-primary)] underline-offset-2 hover:underline"
              >
                {t("wallet_scan_again")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[color:var(--fd-primary)]/40 bg-[color:var(--fd-mint)] px-4 py-8 active:scale-[0.99]"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                <svg className="h-8 w-8 text-[color:var(--fd-primary)]" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M4 7V5a2 2 0 012-2h2M16 3h2a2 2 0 012 2v2M20 17v2a2 2 0 01-2 2h-2M8 21H6a2 2 0 01-2-2v-2M7 12h10"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="text-sm font-bold text-[color:var(--fd-primary)]">
                {t("wallet_scan_pay")}
              </span>
            </button>
          )}

          {(mode === "email" || recipientId) && (
            <>
              <label className="block">
                <span className="text-xs font-bold uppercase text-[color:var(--fd-muted)]">
                  {t("wallet_transfer_amount")}
                </span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  className="mt-1.5 w-full rounded-xl border border-[color:var(--fd-border)] px-3 py-2.5 text-lg font-bold tabular-nums outline-none focus:ring-2 focus:ring-[color:var(--fd-primary)]/30"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase text-[color:var(--fd-muted)]">
                  {t("wallet_memo_motif")}
                </span>
                <input
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder={t("wallet_memo_motif_ph")}
                  className="mt-1.5 w-full rounded-xl border border-[color:var(--fd-border)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--fd-primary)]/30"
                />
              </label>
            </>
          )}
        </FlowCard>

        {err ? (
          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {clientErrorText(t, err)}
          </p>
        ) : null}

        <FlowPrimaryBtn disabled={loading || !canSubmit || done} onClick={() => void openConfirm()}>
          {loading && !showConfirm ? "…" : t("wallet_transfer_review")}
        </FlowPrimaryBtn>

        <p className="mt-2 text-center text-[10px] text-[color:var(--fd-muted)]">
          <Link href="/app/wallet/pay-info" className="underline-offset-2 hover:underline">
            {t("wallet_pay_docs_link")}
          </Link>
        </p>

        <FlowHubLink label={t("wallet_title")} />

        {showConfirm && preview ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
            <div className="w-full max-w-md rounded-2xl bg-[color:var(--fd-card)] p-5 shadow-xl">
              <p className="text-lg font-bold text-[color:var(--fd-text)]">
                {t("wallet_transfer_review")}
              </p>
              <div className="mt-4 space-y-2 text-sm text-[color:var(--fd-muted)]">
                <p>
                  <span className="text-[10px] font-bold uppercase tracking-wide">
                    {t("wallet_transfer_to")}
                  </span>
                  <br />
                  <strong className="text-[color:var(--fd-text)]">{preview.displayName}</strong>
                  <br />
                  <span className="break-all text-xs">
                    {preview.email ?? preview.emailMasked}
                  </span>
                </p>
                <p className="font-bold tabular-nums text-[color:var(--fd-text)]">
                  {amount} {asset}
                </p>
                {memo.trim() ? (
                  <p className="text-xs">
                    {t("wallet_memo_motif")}: {memo.trim()}
                  </p>
                ) : null}
                <p className="text-[10px] leading-relaxed">{t("wallet_transfer_confirm_hint")}</p>
              </div>
              {needsStepUp ? (
                <div className="mt-3">
                  {passkeyCount > 0 ? (
                    <WalletPasskeyStepUpButton
                      verified={stepUpViaPasskey}
                      onVerified={() => {
                        setStepUpViaPasskey(true);
                        setConfirmError(null);
                      }}
                      onError={setConfirmError}
                      disabled={loading}
                    />
                  ) : null}
                  {totpEnabled ? (
                    <>
                      {passkeyCount > 0 ? (
                        <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wide text-[color:var(--fd-muted)]">
                          {t("withdraw_step_up_or")}
                        </p>
                      ) : null}
                      <WalletStepUpField value={totpCode} onChange={setTotpCode} />
                    </>
                  ) : null}
                </div>
              ) : null}
              {confirmError ? (
                <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-900">
                  {confirmError}
                </p>
              ) : null}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirm(false);
                    setConfirmError(null);
                    setTotpCode("");
                    setStepUpViaPasskey(false);
                  }}
                  className="min-h-[48px] rounded-xl border border-[color:var(--fd-border)] font-semibold"
                >
                  {t("back")}
                </button>
                <button
                  type="button"
                  disabled={loading || (needsStepUp && !stepUpReady)}
                  onClick={() => void submit()}
                  className="min-h-[48px] rounded-xl bg-[color:var(--fd-primary)] font-bold text-white disabled:opacity-50"
                >
                  {loading ? "…" : t("wallet_transfer_confirm")}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <ProcessingSheet
          open={processingOpen}
          title={t("wallet_action_send")}
          steps={transferProgressSteps(true)}
          onClose={() => setProcessingOpen(false)}
        />
      </WalletFlowShell>

      <WalletQrScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={onScanned}
      />
    </>
  );
}

export default function WalletTransferPage() {
  const { t } = useI18n();
  return (
    <Suspense
      fallback={
        <WalletFlowShell title={t("wallet_transfer_title")} subtitle={t("wallet_action_send")}>
          <p className="py-8 text-center text-sm text-[color:var(--fd-muted)]">…</p>
        </WalletFlowShell>
      }
    >
      <TransferForm />
    </Suspense>
  );
}

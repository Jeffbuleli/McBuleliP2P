"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { WALLET_ASSETS, type WalletAsset } from "@/lib/wallet-types";
import { clientErrorText } from "@/lib/client-error-text";
import { parseWalletPayRecipient } from "@/lib/wallet-pay-uri";
import { ProcessingSheet } from "@/components/wallet/processing-sheet";
import { transferProgressSteps } from "@/lib/transaction-steps";
import {
  FlowCard,
  FlowHubLink,
  FlowPrimaryBtn,
  WalletFlowShell,
} from "@/components/wallet/wallet-flow-shell";
import { StatusOutcomeBanner } from "@/components/wallet/transaction-progress";

const TRANSFER_ASSETS = ["USDT", "PI"] as const satisfies readonly WalletAsset[];

const ASSET_ICON: Partial<Record<WalletAsset, string>> = {
  USDT: "/assets/crypto/usdt.png",
  PI: "/assets/crypto/pi.png",
};

type RecipientMode = "email" | "qr";

export default function WalletTransferPage() {
  const { t } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const [asset, setAsset] = useState<WalletAsset>("USDT");
  const [mode, setMode] = useState<RecipientMode>("email");
  const [email, setEmail] = useState("");
  const [recipientRaw, setRecipientRaw] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [processingOpen, setProcessingOpen] = useState(false);

  useEffect(() => {
    const a = sp.get("asset");
    if (a && (TRANSFER_ASSETS as readonly string[]).includes(a)) {
      setAsset(a as (typeof TRANSFER_ASSETS)[number]);
    }
    const to = sp.get("to");
    if (to) {
      const id = parseWalletPayRecipient(to);
      if (id) {
        setMode("qr");
        setRecipientRaw(id);
      }
    }
  }, [sp]);

  const parsedRecipientId = parseWalletPayRecipient(recipientRaw);
  const canSubmit =
    mode === "email"
      ? email.trim().includes("@") && amount.trim()
      : Boolean(parsedRecipientId) && amount.trim();

  async function submit() {
    setErr(null);
    setLoading(true);
    try {
      const body =
        mode === "email"
          ? { recipientEmail: email.trim(), asset, amount, memo }
          : {
              recipientUserId: parsedRecipientId,
              asset,
              amount,
              memo,
            };
      const res = await fetch("/api/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "wallet_transfer_failed");
        return;
      }
      setDone(true);
      setProcessingOpen(true);
      window.setTimeout(() => {
        router.push("/app/wallet");
        router.refresh();
      }, 1800);
    } finally {
      setLoading(false);
    }
  }

  return (
    <WalletFlowShell title={t("wallet_transfer_title")} subtitle={t("wallet_action_send")}>
      <FlowCard>
        <p className="mb-2 text-center text-xs font-bold uppercase text-[color:var(--fd-muted)]">
          {t("wallet_transfer_asset")}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {TRANSFER_ASSETS.map((a) => {
            const icon = ASSET_ICON[a];
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
                {icon ? (
                  <Image src={icon} alt="" width={32} height={32} className="rounded-full" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200 text-xs font-bold">
                    {a.slice(0, 2)}
                  </span>
                )}
                <span className="text-[10px] font-bold">{a}</span>
              </button>
            );
          })}
        </div>
      </FlowCard>

      {done ? (
        <StatusOutcomeBanner
          variant="success"
          title={t("wallet_transfer_submit")}
          detail={`${amount} ${asset}`}
        />
      ) : null}

      <FlowCard className="mt-3 space-y-3">
        <div className="flex gap-2 rounded-xl bg-stone-100 p-1">
          <button
            type="button"
            onClick={() => setMode("email")}
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
            onClick={() => setMode("qr")}
            className={`flex-1 rounded-lg py-2 text-xs font-bold ${
              mode === "qr"
                ? "bg-white text-[color:var(--fd-primary)] shadow-sm"
                : "text-[color:var(--fd-muted)]"
            }`}
          >
            {t("wallet_transfer_mode_qr")}
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
        ) : (
          <>
            <label className="block">
              <span className="text-xs font-bold uppercase text-[color:var(--fd-muted)]">
                {t("wallet_transfer_recipient_id")}
              </span>
              <input
                value={recipientRaw}
                onChange={(e) => setRecipientRaw(e.target.value)}
                placeholder={t("wallet_transfer_recipient_id_ph")}
                className="mt-1.5 w-full rounded-xl border border-[color:var(--fd-border)] px-3 py-2.5 font-mono text-xs outline-none focus:ring-2 focus:ring-[color:var(--fd-primary)]/30"
                autoComplete="off"
              />
            </label>
            <p className="text-center text-[11px] text-[color:var(--fd-muted)]">
              {t("wallet_transfer_qr_hint")}{" "}
              <Link
                href="/app/profile"
                className="font-bold text-[color:var(--fd-primary)] underline-offset-2 hover:underline"
              >
                {t("profile_pay_qr_title")}
              </Link>
            </p>
          </>
        )}

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
      </FlowCard>

      {err ? (
        <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {clientErrorText(t, err)}
        </p>
      ) : null}

      <FlowPrimaryBtn disabled={loading || !canSubmit} onClick={() => void submit()}>
        {loading ? "…" : t("wallet_transfer_submit")}
      </FlowPrimaryBtn>

      <FlowHubLink label={t("wallet_title")} />

      <ProcessingSheet
        open={processingOpen}
        title={t("wallet_action_send")}
        steps={transferProgressSteps(true)}
        onClose={() => setProcessingOpen(false)}
      />
    </WalletFlowShell>
  );
}

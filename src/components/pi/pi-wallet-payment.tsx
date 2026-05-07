"use client";

import { useState } from "react";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import { piAuthenticateForPayments, piInit } from "@/lib/pi-browser";
import { useI18n } from "@/components/i18n-provider";

type PiPaymentArgs = {
  amount: number;
  memo: string;
  metadata?: Record<string, unknown>;
};

export function PiWalletPaymentSection() {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function pay() {
    setMsg(null);
    setBusy(true);
    try {
      let cancelled = false;
      const Pi = await piInit();
      if (typeof Pi.createPayment !== "function") {
        setMsg(t("pi_pay_no_sdk"));
        return;
      }
      await piAuthenticateForPayments(Pi);
      const payment: PiPaymentArgs = {
        amount: Number(process.env.NEXT_PUBLIC_PI_TEST_PAYMENT_AMOUNT ?? "0.1"),
        memo: t("pi_pay_memo_wallet"),
        metadata: { purpose: "wallet_test" },
      };

      await Promise.resolve(
        Pi.createPayment!(payment, {
          onReadyForServerApproval: async (paymentId: string) => {
            const res = await fetchWithDeadline(
              "/api/payments/pi/approve",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId }),
                credentials: "same-origin",
              },
              45_000,
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              throw new Error(
                typeof data === "object" &&
                  data !== null &&
                  "message" in data &&
                  typeof (data as { message: unknown }).message === "string"
                  ? (data as { message: string }).message
                  : "approve_failed",
              );
            }
          },
          onReadyForServerCompletion: async (
            paymentId: string,
            txid: string,
          ) => {
            const res = await fetchWithDeadline(
              "/api/payments/pi/complete",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId, txid }),
                credentials: "same-origin",
              },
              45_000,
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              throw new Error(
                typeof data === "object" &&
                  data !== null &&
                  "message" in data &&
                  typeof (data as { message: unknown }).message === "string"
                  ? (data as { message: string }).message
                  : "complete_failed",
              );
            }
          },
          onCancel: () => {
            cancelled = true;
            setMsg(t("pi_pay_cancelled"));
          },
        }),
      );
      if (!cancelled) setMsg(t("pi_pay_success"));
    } catch (e) {
      const m =
        e instanceof Error ? e.message : t("pi_pay_failed");
      setMsg(m);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 rounded-[1.75rem] border border-stone-700/50 bg-stone-950/65 p-4 shadow-lg shadow-black/40 backdrop-blur-xl">
      <p className="text-sm font-bold text-stone-100">{t("pi_pay_section_title")}</p>
      <p className="mt-1 text-[11px] leading-snug text-stone-400">
        {t("pi_pay_section_hint")}
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void pay()}
        className="mt-3 w-full rounded-2xl border border-emerald-700/40 bg-emerald-950/40 py-3 text-sm font-semibold text-emerald-100 disabled:opacity-50"
      >
        {busy ? t("pi_pay_busy") : t("pi_pay_cta")}
      </button>
      {msg ? (
        <p className="mt-2 text-xs text-stone-300">{msg}</p>
      ) : null}
    </div>
  );
}

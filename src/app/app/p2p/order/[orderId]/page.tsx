"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import type { Messages } from "@/i18n/messages";
import { interpolate } from "@/i18n/messages";

type OrderDetail = {
  id: string;
  adId: string;
  side: string;
  asset: string;
  fiatCurrency: string;
  price: string;
  fiatAmount: string;
  cryptoAmount: string;
  status: string;
  expiresAt: string;
  paidMarkedAt: string | null;
  releasedAt: string | null;
  cancelledAt: string | null;
  paymentSnapshot: string;
  makerMasked: string;
  takerMasked: string;
  role: "maker" | "taker";
  youAreSeller: boolean;
  youArePayer: boolean;
  youAreBuyer: boolean;
  createdAt: string;
  paymentReference: string | null;
  paymentProofNote: string | null;
  disputeReason: string | null;
  disputedAt: string | null;
  refundedAt: string | null;
  platformFeeCrypto: string | null;
  buyerReceivedCrypto: string | null;
  counterpartyId: string;
  hasRated: boolean;
  canRate: boolean;
  chatAllowsNewMessages: boolean;
};

type ChatMsg = {
  id: string;
  body: string;
  createdAt: string;
  senderMasked: string;
  own: boolean;
};

function statusLabelKey(s: string): keyof Messages {
  const m: Record<string, keyof Messages> = {
    awaiting_payment: "p2p_order_status_awaiting_payment",
    paid: "p2p_order_status_paid",
    disputed: "p2p_order_status_disputed",
    released: "p2p_order_status_released",
    cancelled: "p2p_order_status_cancelled",
    expired: "p2p_order_status_expired",
    refunded: "p2p_order_status_refunded",
  };
  return m[s] ?? "p2p_order_status_awaiting_payment";
}

export default function P2pOrderPage() {
  const params = useParams();
  const orderId = typeof params.orderId === "string" ? params.orderId : "";
  const { t, locale } = useI18n();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [disputeText, setDisputeText] = useState("");
  const [showDispute, setShowDispute] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/p2p/orders/${orderId}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(typeof data.error === "string" ? data.error : "p2p_order_not_found");
      setOrder(null);
      return;
    }
    setErr(null);
    setOrder(data as OrderDetail);
  }, [orderId]);

  const loadMessages = useCallback(async () => {
    const res = await fetch(`/api/p2p/orders/${orderId}/messages`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    setMessages((data.messages as ChatMsg[]) ?? []);
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    void load();
  }, [orderId, load]);

  useEffect(() => {
    if (!orderId || !order) return;
    if (!["awaiting_payment", "paid", "disputed"].includes(order.status)) return;
    const id = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(id);
  }, [orderId, order, load]);

  useEffect(() => {
    if (!orderId || !order) return;
    void loadMessages();
  }, [orderId, order?.status, loadMessages]);

  useEffect(() => {
    if (!orderId) return;
    const id = window.setInterval(() => void loadMessages(), 10000);
    return () => window.clearInterval(id);
  }, [orderId, loadMessages]);

  const loc = locale === "fr" ? "fr-FR" : "en-US";

  const expiresDisplay = useMemo(() => {
    if (!order) return "";
    return new Date(order.expiresAt).toLocaleString(loc, {
      timeZone: "UTC",
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [order, loc]);

  async function postAction(
    body: Record<string, string | undefined> & { action: string },
  ) {
    setActionErr(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/p2p/orders/${orderId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionErr(typeof data.error === "string" ? data.error : "p2p_action_not_allowed");
        return;
      }
      setShowDispute(false);
      setDisputeText("");
      await load();
      await loadMessages();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function sendChat() {
    const text = chatDraft.trim();
    if (!text) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/p2p/orders/${orderId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionErr(typeof data.error === "string" ? data.error : "p2p_action_not_allowed");
        return;
      }
      setChatDraft("");
      await loadMessages();
    } finally {
      setBusy(false);
    }
  }

  async function sendRating() {
    setActionErr(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/p2p/orders/${orderId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stars: ratingStars,
          comment: ratingComment.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionErr(typeof data.error === "string" ? data.error : "p2p_action_not_allowed");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  const actionErrMsg = useMemo(() => {
    if (!actionErr) return null;
    if (actionErr.startsWith("p2p_") || actionErr.startsWith("wallet_")) {
      return t(actionErr as keyof Messages);
    }
    return actionErr;
  }, [actionErr, t]);

  if (err) {
    return (
      <div className="mx-auto max-w-lg space-y-4 pb-10 pt-1">
        <Link href="/app/p2p" className="text-sm font-medium text-emerald-800 underline">
          ← {t("p2p_title")}
        </Link>
        <p className="text-sm text-rose-700">{t(err as keyof Messages)}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center text-sm text-stone-500">
        {t("deposit_loading")}
      </div>
    );
  }

  const showPaymentAndCrypto =
    order.status === "awaiting_payment" ||
    order.status === "paid" ||
    order.status === "disputed";

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-10 pt-1">
      <Link
        href="/app/p2p"
        className="text-sm font-medium text-emerald-800 underline dark:text-emerald-400"
      >
        ← {t("p2p_title")}
      </Link>

      <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">
        {t("p2p_order_page")}
      </h1>

      <p className="text-xs font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
        {t(statusLabelKey(order.status))}
      </p>

      <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm dark:border-stone-700 dark:bg-stone-900">
        <p>
          <strong>
            {Number(order.fiatAmount).toLocaleString(loc)} {order.fiatCurrency}
          </strong>{" "}
          →{" "}
          <strong>
            {order.cryptoAmount} {order.asset}
          </strong>
        </p>
        <p className="mt-2 text-xs text-stone-600 dark:text-stone-400">
          {t("p2p_maker")}: {order.makerMasked} · {t("p2p_taker")}: {order.takerMasked}
        </p>
        {(order.status === "awaiting_payment" || order.status === "expired") && (
          <p className="mt-2 text-xs text-stone-600 dark:text-stone-400">
            {t("p2p_order_expires")} (UTC): {expiresDisplay}
          </p>
        )}
        {order.status === "released" &&
        order.buyerReceivedCrypto &&
        order.platformFeeCrypto &&
        Number(order.platformFeeCrypto) > 0 ? (
          <p className="mt-2 text-xs text-amber-900 dark:text-amber-200">
            {interpolate(t("p2p_fee_line"), {
              fee: order.platformFeeCrypto,
              net: order.buyerReceivedCrypto,
              asset: order.asset,
            })}
          </p>
        ) : null}
        {order.status === "disputed" && order.disputeReason ? (
          <p className="mt-2 text-xs text-rose-800 dark:text-rose-200">
            <strong>{t("p2p_order_status_disputed")}:</strong> {order.disputeReason}
          </p>
        ) : null}
        {order.paymentReference || order.paymentProofNote ? (
          <div className="mt-2 text-xs text-stone-600 dark:text-stone-400">
            {order.paymentReference ? (
              <p>
                {t("p2p_payment_ref")}: {order.paymentReference}
              </p>
            ) : null}
            {order.paymentProofNote ? (
              <p className="mt-1 whitespace-pre-wrap">{order.paymentProofNote}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
          {t("p2p_order_your_role")}
        </h2>
        <ul className="list-disc pl-5 text-sm text-stone-700 dark:text-stone-300">
          {order.youAreSeller ? <li>{t("p2p_order_seller")}</li> : null}
          {order.youAreBuyer ? <li>{t("p2p_order_buyer")}</li> : null}
          {order.youArePayer ? <li>{t("p2p_order_payer")}</li> : null}
        </ul>
      </section>

      {showPaymentAndCrypto ? (
        <>
          <section>
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
              {t("p2p_order_payment_title")}
            </h2>
            <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-800 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-200">
              {order.paymentSnapshot}
            </pre>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
              {t("p2p_order_crypto_title")}
            </h2>
            <p className="mt-1 text-sm tabular-nums text-stone-800 dark:text-stone-200">
              {order.cryptoAmount} {order.asset}
            </p>
          </section>
        </>
      ) : null}

      <section className="rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
          {t("p2p_chat_title")}
        </h2>
        <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto text-xs">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`rounded-lg px-2 py-1.5 ${
                m.own ? "bg-emerald-50 text-right dark:bg-emerald-950/40" : "bg-stone-100 dark:bg-stone-800"
              }`}
            >
              <span className="font-medium text-stone-600 dark:text-stone-400">{m.senderMasked}</span>
              <p className="whitespace-pre-wrap text-stone-900 dark:text-stone-100">{m.body}</p>
            </li>
          ))}
        </ul>
        {order.chatAllowsNewMessages ? (
          <div className="mt-2 flex gap-2">
            <input
              value={chatDraft}
              onChange={(e) => setChatDraft(e.target.value)}
              placeholder={t("p2p_chat_placeholder")}
              className="min-w-0 flex-1 rounded-xl border border-stone-300 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void sendChat()}
              className="shrink-0 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
            >
              {t("p2p_chat_send")}
            </button>
          </div>
        ) : (
          <p className="mt-2 text-xs text-stone-500">{t("p2p_chat_closed")}</p>
        )}
      </section>

      {actionErrMsg ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
          {actionErrMsg}
        </p>
      ) : null}

      {order.status === "awaiting_payment" && order.youArePayer ? (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
            {t("p2p_payment_ref")}
            <input
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
            />
          </label>
          <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
            {t("p2p_payment_proof_note")}
            <textarea
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void postAction({
                action: "mark_paid",
                paymentReference: paymentRef.trim() || undefined,
                paymentProofNote: paymentNote.trim() || undefined,
              })
            }
            className="w-full rounded-2xl bg-emerald-700 py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            {t("p2p_order_mark_paid")}
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        {order.status === "paid" && order.youAreSeller ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void postAction({ action: "release" })}
            className="w-full rounded-2xl bg-emerald-700 py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            {t("p2p_order_release")}
          </button>
        ) : null}
        {order.status === "paid" ? (
          <div className="space-y-2">
            {!showDispute ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowDispute(true)}
                className="w-full rounded-2xl border border-amber-600 py-3 text-sm font-bold text-amber-950 dark:text-amber-100"
              >
                {t("p2p_dispute_open")}
              </button>
            ) : (
              <>
                <textarea
                  value={disputeText}
                  onChange={(e) => setDisputeText(e.target.value)}
                  rows={3}
                  placeholder={t("p2p_dispute_reason_placeholder")}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void postAction({ action: "open_dispute", reason: disputeText })}
                  className="w-full rounded-2xl bg-amber-700 py-3 text-sm font-bold text-white disabled:opacity-40"
                >
                  {t("p2p_dispute_submit")}
                </button>
              </>
            )}
          </div>
        ) : null}
        {order.status === "awaiting_payment" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void postAction({ action: "cancel" })}
            className="w-full rounded-2xl border border-stone-300 py-3 text-sm font-bold text-stone-800 dark:border-stone-600 dark:text-stone-200"
          >
            {t("p2p_order_cancel")}
          </button>
        ) : null}
      </div>

      {order.canRate ? (
        <section className="rounded-2xl border border-emerald-900/20 bg-emerald-50/60 p-4 dark:border-emerald-800/40 dark:bg-emerald-950/30">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">
            {t("p2p_rate_title")}
          </h2>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRatingStars(n)}
                className={`h-10 w-10 rounded-lg text-lg font-bold ${
                  ratingStars >= n
                    ? "bg-amber-500 text-stone-950"
                    : "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300"
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <label className="mt-2 block text-xs font-medium text-stone-700 dark:text-stone-300">
            {t("p2p_rate_comment")}
            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => void sendRating()}
            className="mt-3 w-full rounded-2xl bg-emerald-700 py-2.5 text-sm font-bold text-white disabled:opacity-40"
          >
            {t("p2p_rate_submit")}
          </button>
        </section>
      ) : null}

      {order.hasRated ? (
        <p className="text-center text-xs text-stone-500">{t("p2p_rating_thanks")}</p>
      ) : null}

      <p className="text-xs text-stone-500 dark:text-stone-400">{t("p2p_disclaimer")}</p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { P2pConfirmDialog } from "@/components/p2p/p2p-confirm-dialog";
import { P2pOrderTimeline } from "@/components/p2p/p2p-order-timeline";
import {
  P2pStatusIcon,
  p2pStatusBadgeClasses,
  p2pStatusLabelKey,
} from "@/components/p2p/p2p-status-badge";
import type { Messages } from "@/i18n/messages";
import { interpolate } from "@/i18n/messages";
import { clientErrorText } from "@/lib/client-error-text";

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

const FIXED_BOTTOM_OFFSET = "bottom-[calc(4.35rem+env(safe-area-inset-bottom))]";

export function P2pOrderScreen() {
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
  const [nowTick, setNowTick] = useState(0);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState("");

  const [modal, setModal] = useState<null | "paid" | "release" | "cancel" | "dispute">(null);

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

  useEffect(() => {
    if (!order || order.status !== "awaiting_payment") return;
    const id = window.setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [order]);

  const loc = locale === "fr" ? "fr-FR" : "en-US";

  const expiresDisplay = useMemo(() => {
    if (!order) return "";
    return new Date(order.expiresAt).toLocaleString(loc, {
      timeZone: "UTC",
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [order, loc]);

  const countdown = useMemo(() => {
    if (!order || order.status !== "awaiting_payment") return null;
    const end = new Date(order.expiresAt).getTime();
    const left = end - Date.now();
    if (left <= 0) return { expired: true as const, label: "" };
    const s = Math.floor(left / 1000);
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    const label =
      hh > 0
        ? `${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
        : `${mm}:${String(ss).padStart(2, "0")}`;
    return { expired: false as const, label };
  }, [order, nowTick]);

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
      setModal(null);
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
    return clientErrorText(t, actionErr);
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

  const shortId = order.id.replace(/-/g, "").slice(0, 10);
  const roleBuy = order.youAreBuyer;
  const roleBannerClass = roleBuy
    ? "border-emerald-600 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white"
    : "border-amber-600 bg-gradient-to-r from-amber-700 to-amber-600 text-white";

  const showStickyChat = order.chatAllowsNewMessages;

  return (
    <div
      className={`mx-auto max-w-lg pt-1 ${showStickyChat ? "pb-[calc(11rem+env(safe-area-inset-bottom))]" : "pb-10"}`}
    >
      <Link
        href="/app/p2p"
        className="text-sm font-medium text-emerald-800 underline dark:text-emerald-400"
      >
        ← {t("p2p_title")}
      </Link>

      <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs leading-snug text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100">
        {t("p2p_trust_top_banner")}
      </div>

      <div className={`mt-4 rounded-2xl border-2 px-4 py-3 shadow-md ${roleBannerClass}`}>
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-90">
          {roleBuy ? t("p2p_role_banner_buy") : t("p2p_role_banner_sell")}
        </p>
        <p className="mt-1 text-xs opacity-95">
          {roleBuy ? t("p2p_role_sub_buy") : t("p2p_role_sub_sell")}
        </p>
      </div>

      <header className="mt-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
            {t("p2p_header_order_id")}
          </p>
          <p className="font-mono text-sm font-bold text-stone-900 dark:text-stone-100">
            {t("p2p_order_short_id")}
            {shortId}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${p2pStatusBadgeClasses(order.status)}`}
        >
          <P2pStatusIcon status={order.status} />
          {t(p2pStatusLabelKey(order.status))}
        </span>
      </header>

      <div className="mt-5">
        <P2pOrderTimeline status={order.status} />
      </div>

      {showPaymentAndCrypto || order.status === "awaiting_payment" ? (
        <section
          className="mt-4 overflow-hidden rounded-2xl border-2 border-emerald-800/25 bg-gradient-to-b from-emerald-50/90 to-white shadow-md dark:border-emerald-700/40 dark:from-emerald-950/50 dark:to-stone-900"
          aria-label={t("p2p_escrow_card_title")}
        >
          <div className="flex items-center gap-3 border-b border-emerald-900/10 bg-emerald-900/[0.06] px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-950/40">
            <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-inner dark:bg-emerald-500">
              <svg className="h-7 w-7 animate-pulse" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm-3 8V7a3 3 0 016 0v3H9z" />
              </svg>
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-900 dark:text-emerald-100">
                {t("p2p_escrow_card_title")}
              </p>
              <p className="text-sm font-bold tabular-nums text-emerald-950 dark:text-emerald-50">
                {interpolate(t("p2p_escrow_locked_amount"), {
                  amount: order.cryptoAmount,
                  asset: order.asset,
                })}
              </p>
              <p className="text-[11px] text-emerald-800/90 dark:text-emerald-200/90">
                {t("p2p_escrow_secured")}
              </p>
            </div>
          </div>
          <div className="px-4 py-3 text-sm text-stone-800 dark:text-stone-200">
            <strong>
              {Number(order.fiatAmount).toLocaleString(loc)} {order.fiatCurrency}
            </strong>{" "}
            →{" "}
            <strong>
              {order.cryptoAmount} {order.asset}
            </strong>
          </div>
        </section>
      ) : null}

      {order.status === "awaiting_payment" && countdown && (
        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-950/40">
          <p className="text-xs font-semibold text-amber-950 dark:text-amber-100">
            {t("p2p_countdown_label")}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-amber-900 dark:text-amber-50">
            {countdown.expired ? t("p2p_countdown_expired") : countdown.label}
          </p>
          <p className="mt-1 text-[11px] text-amber-900/80 dark:text-amber-200/80">
            {t("p2p_order_expires")} (UTC): {expiresDisplay}
          </p>
        </div>
      )}

      <section className="mt-4 text-xs text-stone-600 dark:text-stone-400">
        <p>
          <span className="font-semibold text-stone-800 dark:text-stone-200">{t("p2p_maker")}:</span>{" "}
          {order.makerMasked}
        </p>
        <p>
          <span className="font-semibold text-stone-800 dark:text-stone-200">{t("p2p_taker")}:</span>{" "}
          {order.takerMasked}
        </p>
      </section>

      {showPaymentAndCrypto ? (
        <>
          <section className="mt-6">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50">
              {t("p2p_section_payment")}
            </h2>
            <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-800 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-200">
              {order.paymentSnapshot}
            </pre>
          </section>

          <section className="mt-4">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50">
              {t("p2p_order_crypto_title")}
            </h2>
            <p className="mt-1 text-sm tabular-nums text-stone-800 dark:text-stone-200">
              {order.cryptoAmount} {order.asset}
            </p>
          </section>
        </>
      ) : null}

      {order.status === "released" &&
      order.buyerReceivedCrypto &&
      order.platformFeeCrypto &&
      Number(order.platformFeeCrypto) > 0 ? (
        <p className="mt-4 text-xs text-amber-900 dark:text-amber-200">
          {interpolate(t("p2p_fee_line"), {
            fee: order.platformFeeCrypto,
            net: order.buyerReceivedCrypto,
            asset: order.asset,
          })}
        </p>
      ) : null}

      {order.status === "disputed" && order.disputeReason ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100">
          <strong>{t("p2p_order_status_disputed")}:</strong> {order.disputeReason}
        </p>
      ) : null}

      {order.paymentReference || order.paymentProofNote ? (
        <div className="mt-4 text-xs text-stone-600 dark:text-stone-400">
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

      <section className="mt-8 space-y-4">
        <div className="flex items-start gap-2 rounded-xl border border-rose-200/80 bg-rose-50/70 px-3 py-2 text-xs text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-100">
          <span aria-hidden>⚠️</span>
          <span>{t("p2p_trust_release_warning")}</span>
        </div>

        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50">{t("p2p_section_actions")}</h2>

        {order.status === "awaiting_payment" && order.youArePayer ? (
          <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
              {t("p2p_payment_ref")}
              <input
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100"
              />
            </label>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
              {t("p2p_payment_proof_note")}
              <textarea
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100"
              />
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() => setModal("paid")}
              className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 disabled:opacity-40"
            >
              {t("p2p_order_mark_paid")}
            </button>
          </div>
        ) : null}

        {order.status === "paid" && order.youAreSeller ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => setModal("release")}
            className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg disabled:opacity-40"
          >
            {t("p2p_order_release")}
          </button>
        ) : null}

        {order.status === "paid" ? (
          <div className="space-y-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setModal("dispute")}
              className="w-full rounded-2xl border-2 border-amber-500 py-3 text-sm font-bold text-amber-950 dark:text-amber-100"
            >
              {t("p2p_dispute_open")}
            </button>
          </div>
        ) : null}

        {order.status === "awaiting_payment" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => setModal("cancel")}
            className="w-full rounded-2xl border border-stone-300 py-3 text-sm font-bold text-stone-800 dark:border-stone-600 dark:text-stone-200"
          >
            {t("p2p_order_cancel")}
          </button>
        ) : null}
      </section>

      {actionErrMsg ? (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
          {actionErrMsg}
        </p>
      ) : null}

      {order.canRate ? (
        <section className="mt-8 rounded-2xl border border-emerald-900/20 bg-emerald-50/60 p-4 dark:border-emerald-800/40 dark:bg-emerald-950/30">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">{t("p2p_rate_title")}</h2>
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
        <p className="mt-6 text-center text-xs text-stone-500">{t("p2p_rating_thanks")}</p>
      ) : null}

      {!showStickyChat && messages.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">{t("p2p_chat_title")}</h2>
          <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto text-xs">
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
          <p className="mt-2 text-xs text-stone-500">{t("p2p_chat_closed")}</p>
        </section>
      ) : null}

      <p className="mt-8 text-xs text-stone-500 dark:text-stone-400">{t("p2p_disclaimer")}</p>

      {showStickyChat ? (
        <div
          className={`fixed left-1/2 z-40 w-full max-w-lg -translate-x-1/2 px-4 ${FIXED_BOTTOM_OFFSET}`}
          aria-label={t("p2p_chat_title")}
        >
          <div className="rounded-t-2xl border border-stone-200 bg-white/98 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md dark:border-stone-700 dark:bg-stone-950/98">
            <div className="max-h-36 space-y-2 overflow-y-auto px-3 pt-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg px-2 py-1.5 text-xs ${
                    m.own ? "ml-6 bg-emerald-50 text-right dark:bg-emerald-950/40" : "mr-6 bg-stone-100 dark:bg-stone-800"
                  }`}
                >
                  <span className="font-medium text-stone-600 dark:text-stone-400">{m.senderMasked}</span>
                  <p className="whitespace-pre-wrap text-stone-900 dark:text-stone-100">{m.body}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t border-stone-100 p-3 dark:border-stone-800">
              <input
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                placeholder={t("p2p_chat_placeholder")}
                className="min-w-0 flex-1 rounded-xl border border-stone-300 px-3 py-2.5 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void sendChat()}
                className="shrink-0 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
              >
                {t("p2p_chat_send")}
              </button>
            </div>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-3 opacity-90 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">{t("p2p_chat_title")}</h2>
          <p className="mt-2 text-xs text-stone-500">{t("p2p_chat_closed")}</p>
        </section>
      ) : null}

      <P2pConfirmDialog
        open={modal === "paid"}
        title={t("p2p_confirm_mark_paid_title")}
        body={t("p2p_confirm_mark_paid_body")}
        confirmLabel={t("p2p_order_mark_paid")}
        cancelLabel={t("p2p_confirm_common_cancel")}
        busy={busy}
        onClose={() => setModal(null)}
        onConfirm={() =>
          void postAction({
            action: "mark_paid",
            paymentReference: paymentRef.trim() || undefined,
            paymentProofNote: paymentNote.trim() || undefined,
          })
        }
      />

      <P2pConfirmDialog
        open={modal === "release"}
        title={t("p2p_confirm_release_title")}
        body={
          <span>
            {t("p2p_confirm_release_body")}{" "}
            <strong className="text-stone-900 dark:text-stone-100">
              {order.cryptoAmount} {order.asset}
            </strong>
          </span>
        }
        confirmLabel={t("p2p_order_release")}
        cancelLabel={t("p2p_confirm_common_cancel")}
        busy={busy}
        onClose={() => setModal(null)}
        onConfirm={() => void postAction({ action: "release" })}
      />

      <P2pConfirmDialog
        open={modal === "cancel"}
        title={t("p2p_confirm_cancel_title")}
        body={t("p2p_confirm_cancel_body")}
        confirmLabel={t("p2p_order_cancel")}
        cancelLabel={t("p2p_confirm_common_cancel")}
        danger
        busy={busy}
        onClose={() => setModal(null)}
        onConfirm={() => void postAction({ action: "cancel" })}
      />

      <P2pConfirmDialog
        open={modal === "dispute"}
        title={t("p2p_confirm_dispute_title")}
        body={t("p2p_confirm_dispute_body")}
        confirmLabel={t("p2p_dispute_submit")}
        cancelLabel={t("p2p_confirm_common_cancel")}
        danger
        busy={busy}
        onClose={() => setModal(null)}
        onConfirm={() => void postAction({ action: "open_dispute", reason: disputeText })}
        extra={
          <textarea
            value={disputeText}
            onChange={(e) => setDisputeText(e.target.value)}
            rows={4}
            placeholder={t("p2p_dispute_reason_placeholder")}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
          />
        }
      />
    </div>
  );
}

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { P2pConfirmDialog } from "@/components/p2p/p2p-confirm-dialog";
import { P2pOrderSummary } from "@/components/p2p/p2p-order-summary";
import { P2pOrderTimeline } from "@/components/p2p/p2p-order-timeline";
import {
  P2pStatusIcon,
  p2pStatusBadgeClasses,
  p2pStatusLabelKey,
} from "@/components/p2p/p2p-status-badge";
import { P2pIconAlert, P2pIconEscrow, P2pIconStar } from "@/components/p2p/p2p-icons";
import type { Messages } from "@/i18n/messages";
import { interpolate } from "@/i18n/messages";
import { clientErrorText } from "@/lib/client-error-text";
import { isP2pCryptoQuoteCurrency } from "@/lib/p2p-config";
import { p2pFlowHint, p2pOrderFlowHintKey } from "@/lib/p2p-ui";
import { StatusOutcomeBanner } from "@/components/wallet/transaction-progress";
import { ChatAvatarBubble } from "@/components/profile/user-avatar-mark";

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
  paymentProofImage: { id: string; mime: string; sizeBytes: number; dataUrl: string | null } | null;
  disputeReason: string | null;
  disputedAt: string | null;
  refundedAt: string | null;
  platformFeeCrypto: string | null;
  buyerReceivedCrypto: string | null;
  counterpartyId: string;
  hasRated: boolean;
  canRate: boolean;
  chatAllowsNewMessages: boolean;
  viewerAvatarUrl?: string | null;
};

type ChatMsg = {
  id: string;
  body: string;
  createdAt: string;
  senderMasked: string;
  senderRole: string;
  senderAvatarUrl?: string | null;
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
  const [proofBusy, setProofBusy] = useState(false);
  const [proofErr, setProofErr] = useState<string | null>(null);
  const [proofOk, setProofOk] = useState(false);
  const [disputeText, setDisputeText] = useState("");
  const [nowTick, setNowTick] = useState(0);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const chatListRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

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

  const loadProof = useCallback(async () => {
    const res = await fetch(`/api/p2p/orders/${orderId}/proof`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    setOrder((cur) =>
      cur
        ? {
            ...cur,
            paymentProofImage: data.proof ?? null,
          }
        : cur,
    );
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
    if (!orderId || !order) return;
    void loadProof();
  }, [orderId, order?.status, loadProof]);

  useEffect(() => {
    if (!orderId) return;
    const id = window.setInterval(() => void loadMessages(), 10000);
    return () => window.clearInterval(id);
  }, [orderId, loadMessages]);

  useEffect(() => {
    // keep latest message visible
    const el = document.getElementById("p2p-chat-scroll");
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    if (!order || order.status !== "awaiting_payment") return;
    const id = window.setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [order]);

  const loc = locale === "fr" ? "fr-FR" : "en-US";

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
      await loadProof();
      await loadMessages();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function uploadProof(file: File) {
    setProofErr(null);
    setProofOk(false);
    setProofBusy(true);
    try {
      const mime = file.type || "application/octet-stream";
      if (!mime.startsWith("image/")) {
        setProofErr("p2p_proof_invalid");
        return;
      }
      const maxBytes = Number(process.env.NEXT_PUBLIC_P2P_PROOF_MAX_BYTES ?? "250000");
      const limit = Number.isFinite(maxBytes) && maxBytes > 50_000 ? Math.floor(maxBytes) : 250_000;
      if (file.size > limit) {
        setProofErr("p2p_proof_too_large");
        return;
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onerror = () => reject(new Error("read_failed"));
        r.onload = () => resolve(String(r.result || ""));
        r.readAsDataURL(file);
      });
      const res = await fetch(`/api/p2p/orders/${orderId}/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl, mime, sizeBytes: file.size }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProofErr(typeof data.error === "string" ? data.error : "p2p_proof_invalid");
        return;
      }
      setProofOk(true);
      await loadProof();
    } finally {
      setProofBusy(false);
    }
  }

  async function sendChat() {
    const text = chatDraft.trim();
    if (!text) return;
    setBusy(true);
    try {
      const optimistic: ChatMsg = {
        id: `tmp_${Date.now()}`,
        body: text,
        createdAt: new Date().toISOString(),
        senderMasked: "You",
        senderRole: "user",
        senderAvatarUrl: order?.viewerAvatarUrl ?? null,
        own: true,
      };
      setMessages((cur) => [...cur, optimistic]);
      const res = await fetch(`/api/p2p/orders/${orderId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionErr(typeof data.error === "string" ? data.error : "p2p_action_not_allowed");
        setMessages((cur) => cur.filter((m) => m.id !== optimistic.id));
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

  const proofErrMsg = useMemo(() => {
    if (!proofErr) return null;
    return clientErrorText(t, proofErr);
  }, [proofErr, t]);

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
  const cryptoQuote = isP2pCryptoQuoteCurrency(order.fiatCurrency);
  const roleHint = p2pFlowHint(
    t,
    p2pOrderFlowHintKey({
      youAreBuyer: order.youAreBuyer,
      quoteCurrency: order.fiatCurrency,
    }),
    order.fiatCurrency,
  );
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

      <div className={`mt-4 flex items-center gap-3 rounded-2xl border-2 px-4 py-3 shadow-md ${roleBannerClass}`}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
          <P2pIconEscrow className="h-5 w-5" />
        </span>
        <p className="text-sm font-semibold">{roleHint}</p>
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

      <div className="wallet-theme mt-4 space-y-3">
        <P2pOrderTimeline status={order.status} quoteCurrency={order.fiatCurrency} />

        {order.status === "released" ? (
          <StatusOutcomeBanner
            variant="success"
            title={t("p2p_order_status_released")}
            detail={`${order.cryptoAmount} ${order.asset}`}
          />
        ) : null}
        {order.status === "cancelled" || order.status === "expired" ? (
          <StatusOutcomeBanner variant="failed" title={t(p2pStatusLabelKey(order.status))} />
        ) : null}
        {order.status === "disputed" ? (
          <StatusOutcomeBanner variant="pending" title={t("p2p_order_status_disputed")} />
        ) : null}
        {order.status === "refunded" ? (
          <StatusOutcomeBanner variant="failed" title={t("p2p_order_status_refunded")} />
        ) : null}

        {(showPaymentAndCrypto || order.status === "awaiting_payment") && (
          <P2pOrderSummary
            fiatAmount={order.fiatAmount}
            fiatCurrency={order.fiatCurrency}
            cryptoAmount={order.cryptoAmount}
            asset={order.asset}
            locale={locale}
          />
        )}
      </div>

      {order.status === "awaiting_payment" && countdown && !cryptoQuote ? (
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-amber-600/40 bg-amber-950/30 px-4 py-3">
          <span className="font-mono text-3xl font-bold tabular-nums text-amber-200">
            {countdown.expired ? "—" : countdown.label}
          </span>
          <p className="text-xs text-amber-200/80">
            {countdown.expired ? t("p2p_countdown_expired") : t("p2p_countdown_label")}
          </p>
        </div>
      ) : null}

      {showPaymentAndCrypto && !cryptoQuote ? (
        <section className="mt-4">
          <pre className="whitespace-pre-wrap rounded-2xl border border-stone-700 bg-stone-900 p-3 text-xs text-stone-300">
            {order.paymentSnapshot}
          </pre>
          <p className="mt-1 text-[10px] text-stone-500">
            {order.makerMasked} · {order.takerMasked}
          </p>
        </section>
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
        {order.youAreSeller && !cryptoQuote && order.status === "paid" ? (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200/80 bg-rose-50/70 px-3 py-2 text-xs text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-100">
            <P2pIconAlert className="h-4 w-4 shrink-0" />
            <span>{t("p2p_trust_release_warning_fiat")}</span>
          </div>
        ) : null}

        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50">{t("p2p_section_actions")}</h2>

        {order.status === "awaiting_payment" && order.youArePayer && !cryptoQuote ? (
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

            <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3 dark:border-stone-700 dark:bg-stone-950/40">
              <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                {t("p2p_proof_title")}
              </p>
              <p className="mt-1 text-[11px] text-stone-600 dark:text-stone-400">
                {t("p2p_proof_hint")}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={proofBusy}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadProof(f);
                      e.currentTarget.value = "";
                    }}
                  />
                  {proofBusy ? "…" : t("p2p_proof_upload")}
                </label>
                {order.paymentProofImage?.dataUrl ? (
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    {t("p2p_proof_uploaded")}
                  </span>
                ) : null}
                {proofOk ? (
                  <span className="text-xs text-emerald-700 dark:text-emerald-300">
                    {t("p2p_proof_uploaded")}
                  </span>
                ) : null}
              </div>
              {proofErrMsg ? (
                <p className="mt-2 text-xs text-rose-700 dark:text-rose-200">{proofErrMsg}</p>
              ) : null}
              {order.paymentProofImage?.dataUrl ? (
                <div className="mt-3 overflow-hidden rounded-xl border border-stone-200 dark:border-stone-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={order.paymentProofImage.dataUrl}
                    alt={t("p2p_proof_title")}
                    className="max-h-64 w-full object-contain bg-white dark:bg-stone-950"
                  />
                </div>
              ) : null}
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={() => setModal("paid")}
              className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 disabled:opacity-40"
            >
              {t("p2p_mark_paid_payer")}
            </button>
          </div>
        ) : null}

        {order.status === "paid" && order.youAreSeller && !cryptoQuote ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => setModal("release")}
            className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg disabled:opacity-40"
          >
            {t("p2p_order_release_fiat")}
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
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  ratingStars >= n
                    ? "bg-amber-500 text-stone-950"
                    : "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300"
                }`}
                aria-label={`${n}`}
              >
                <P2pIconStar filled={ratingStars >= n} className="h-5 w-5" />
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
                <div
                  className={`flex items-start gap-2 ${m.own ? "flex-row-reverse" : ""}`}
                >
                  <ChatAvatarBubble
                    label={m.senderMasked}
                    avatarUrl={m.senderAvatarUrl}
                    own={m.own}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium text-stone-600 dark:text-stone-400">
                        {m.senderMasked}
                        {m.senderRole === "agent" || m.senderRole === "super_admin" ? (
                          <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-200">
                            Support
                          </span>
                        ) : null}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {new Date(m.createdAt).toLocaleTimeString(loc, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap text-stone-900 dark:text-stone-100">
                      {m.body}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-stone-500">{t("p2p_chat_closed")}</p>
        </section>
      ) : null}

      {showStickyChat ? (
        <div
          className={`fixed left-1/2 z-40 w-full max-w-lg -translate-x-1/2 px-4 ${FIXED_BOTTOM_OFFSET}`}
          aria-label={t("p2p_chat_title")}
        >
          <div className="rounded-t-2xl border border-stone-200 bg-white/98 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md dark:border-stone-700 dark:bg-stone-950/98">
            <div id="p2p-chat-scroll" ref={chatListRef} className="max-h-36 space-y-2 overflow-y-auto px-3 pt-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg px-2 py-1.5 text-xs ${
                    m.own ? "ml-6 bg-emerald-50 text-right dark:bg-emerald-950/40" : "mr-6 bg-stone-100 dark:bg-stone-800"
                  }`}
                >
                  <div
                    className={`flex items-start gap-2 ${m.own ? "flex-row-reverse" : ""}`}
                  >
                    <ChatAvatarBubble
                      label={m.senderMasked}
                      avatarUrl={m.senderAvatarUrl}
                      own={m.own}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium text-stone-600 dark:text-stone-400">
                          {m.senderMasked}
                          {m.senderRole === "agent" || m.senderRole === "super_admin" ? (
                            <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-200">
                              Support
                            </span>
                          ) : null}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {new Date(m.createdAt).toLocaleTimeString(loc, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap text-stone-900 dark:text-stone-100">
                        {m.body}
                      </p>
                    </div>
                  </div>
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
                disabled={busy || !chatDraft.trim()}
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

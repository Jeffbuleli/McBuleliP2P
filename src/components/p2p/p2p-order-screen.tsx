"use client";

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
import { P2pIconAlert, P2pIconStar } from "@/components/p2p/p2p-icons";
import type { Messages } from "@/i18n/messages";
import { interpolate } from "@/i18n/messages";
import { clientErrorText } from "@/lib/client-error-text";
import { isP2pCryptoQuoteCurrency } from "@/lib/p2p-config";
import { p2pFlowHint, p2pOrderFlowHintKey } from "@/lib/p2p-ui";
import {
  FlowError,
  FlowField,
  FlowInput,
  FlowPrimaryBtn,
  FlowSection,
  FlowTextarea,
  FlowUploadZone,
  P2pFlowShell,
} from "@/components/p2p/p2p-flow-ui";
import { P2pProofPreview } from "@/components/p2p/p2p-proof-preview";
import { prepareP2pProofFile } from "@/lib/p2p-proof-image";
import { StatusOutcomeBanner } from "@/components/wallet/transaction-progress";
import { P2pOrderChat, type P2pChatMessage } from "@/components/p2p/p2p-order-chat";

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
  const [messages, setMessages] = useState<P2pChatMessage[]>([]);
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
    if (!res.ok) {
      if (typeof data.error === "string") setProofErr(data.error);
      return;
    }
    const proof = data.proof as OrderDetail["paymentProofImage"];
    setOrder((cur) => (cur ? { ...cur, paymentProofImage: proof ?? null } : cur));
  }, [orderId]);

  const loadMessages = useCallback(async () => {
    const res = await fetch(`/api/p2p/orders/${orderId}/messages`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    setMessages((data.messages as P2pChatMessage[]) ?? []);
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
      const prepared = await prepareP2pProofFile(file);
      const res = await fetch(`/api/p2p/orders/${orderId}/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prepared),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProofErr(typeof data.error === "string" ? data.error : "p2p_proof_invalid");
        return;
      }
      setProofOk(true);
      const proof = data.proof as OrderDetail["paymentProofImage"] | undefined;
      if (proof?.dataUrl) {
        setOrder((cur) => (cur ? { ...cur, paymentProofImage: proof } : cur));
      } else {
        await loadProof();
      }
    } catch (e) {
      const key = e instanceof Error ? e.message : "p2p_proof_invalid";
      setProofErr(key.startsWith("p2p_") ? key : "p2p_proof_invalid");
    } finally {
      setProofBusy(false);
    }
  }

  async function sendChat() {
    const text = chatDraft.trim();
    if (!text) return;
    setBusy(true);
    try {
      const optimistic: P2pChatMessage = {
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
      <P2pFlowShell title={t("p2p_order_page")} subtitle={t("p2p_order_subtitle")}>
        <FlowError>{t(err as keyof Messages)}</FlowError>
      </P2pFlowShell>
    );
  }

  if (!order) {
    return (
      <P2pFlowShell title={t("p2p_order_page")} subtitle={t("p2p_order_subtitle")}>
        <p className="py-10 text-center text-sm text-[color:var(--fd-muted)]">{t("deposit_loading")}</p>
      </P2pFlowShell>
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
  const showStickyChat = order.chatAllowsNewMessages;
  const statusBadge = (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${p2pStatusBadgeClasses(order.status)}`}
    >
      <P2pStatusIcon status={order.status} />
      {t(p2pStatusLabelKey(order.status))}
    </span>
  );

  return (
    <div className={showStickyChat ? "pb-[calc(11rem+env(safe-area-inset-bottom))]" : ""}>
      <P2pFlowShell
        title={`${t("p2p_order_short_id")}${shortId}`}
        subtitle={roleHint}
        headerBadge={statusBadge}
      >
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

      {order.status === "awaiting_payment" && countdown && !cryptoQuote ? (
        <div className="fd-card flex items-center gap-3 px-4 py-3">
          <span className="font-mono text-3xl font-bold tabular-nums text-[color:var(--fd-text)]">
            {countdown.expired ? "—" : countdown.label}
          </span>
          <p className="text-xs text-[color:var(--fd-muted)]">
            {countdown.expired ? t("p2p_countdown_expired") : t("p2p_countdown_label")}
          </p>
        </div>
      ) : null}

      {showPaymentAndCrypto && !cryptoQuote ? (
        <FlowSection title={t("p2p_section_payment")} hint={`${order.makerMasked} · ${order.takerMasked}`}>
          <pre className="whitespace-pre-wrap rounded-2xl border border-[color:var(--fd-border)] bg-stone-50/80 p-3 text-xs text-[color:var(--fd-text)]">
            {order.paymentSnapshot}
          </pre>
        </FlowSection>
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

      {order.paymentProofImage?.dataUrl &&
      !cryptoQuote &&
      !(order.status === "awaiting_payment" && order.youArePayer) ? (
        <P2pProofPreview dataUrl={order.paymentProofImage.dataUrl} />
      ) : null}

      {order.paymentReference || order.paymentProofNote ? (
        <div className="text-xs text-[color:var(--fd-muted)]">
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

      <FlowSection title={t("p2p_section_actions")}>
        {order.youAreSeller && !cryptoQuote && order.status === "paid" ? (
          <FlowError>
            <span className="inline-flex items-center gap-2">
              <P2pIconAlert className="h-4 w-4 shrink-0" />
              {t("p2p_trust_release_warning_fiat")}
            </span>
          </FlowError>
        ) : null}

        {order.status === "awaiting_payment" && order.youArePayer && !cryptoQuote ? (
          <div className="space-y-3">
            <FlowField label={t("p2p_payment_ref")}>
              <FlowInput value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} />
            </FlowField>
            <FlowField label={t("p2p_payment_proof_note")}>
              <FlowTextarea value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} rows={2} />
            </FlowField>
            <FlowUploadZone
              label={t("p2p_proof_upload")}
              hint={t("p2p_proof_hint")}
              busy={proofBusy}
              hasFile={!!order.paymentProofImage?.dataUrl || proofOk}
              onPick={(f) => void uploadProof(f)}
            />
            {proofErrMsg ? <FlowError>{proofErrMsg}</FlowError> : null}
            {order.paymentProofImage?.dataUrl ? (
              <div className="overflow-hidden rounded-2xl border border-[color:var(--fd-border)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={order.paymentProofImage.dataUrl}
                  alt={t("p2p_proof_title")}
                  className="max-h-64 w-full object-contain bg-white"
                />
              </div>
            ) : null}
            <FlowPrimaryBtn disabled={busy} onClick={() => setModal("paid")}>
              {t("p2p_mark_paid_payer")}
            </FlowPrimaryBtn>
          </div>
        ) : null}

        {order.status === "paid" && order.youAreSeller && !cryptoQuote ? (
          <FlowPrimaryBtn disabled={busy} onClick={() => setModal("release")}>
            {t("p2p_order_release_fiat")}
          </FlowPrimaryBtn>
        ) : null}

        {order.status === "paid" ? (
          <FlowPrimaryBtn disabled={busy} variant="ghost" onClick={() => setModal("dispute")}>
            {t("p2p_dispute_open")}
          </FlowPrimaryBtn>
        ) : null}

        {order.status === "awaiting_payment" ? (
          <FlowPrimaryBtn disabled={busy} variant="ghost" onClick={() => setModal("cancel")}>
            {t("p2p_order_cancel")}
          </FlowPrimaryBtn>
        ) : null}
      </FlowSection>

      {actionErrMsg ? <FlowError>{actionErrMsg}</FlowError> : null}

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
        <P2pOrderChat
          messages={messages}
          draft={chatDraft}
          onDraftChange={setChatDraft}
          onSend={() => void sendChat()}
          busy={busy}
          canSend={false}
          locale={locale}
          title={t("p2p_chat_title")}
          placeholder={t("p2p_chat_placeholder")}
          sendLabel={t("p2p_chat_send")}
          closedHint={t("p2p_chat_closed")}
        />
      ) : null}

      </P2pFlowShell>

      {showStickyChat ? (
        <P2pOrderChat
          messages={messages}
          draft={chatDraft}
          onDraftChange={setChatDraft}
          onSend={() => void sendChat()}
          busy={busy}
          canSend
          locale={locale}
          title={t("p2p_chat_title")}
          placeholder={t("p2p_chat_placeholder")}
          sendLabel={t("p2p_chat_send")}
          closedHint={t("p2p_chat_closed")}
          sticky
          listRef={chatListRef}
        />
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

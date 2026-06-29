"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { P2pConfirmDialog } from "@/components/p2p/p2p-confirm-dialog";
import { P2pConfirmSheet } from "@/components/p2p/p2p-confirm-sheet";
import { P2pProcedureBanner } from "@/components/p2p/p2p-procedure-banner";
import { P2pReportSheet } from "@/components/p2p/p2p-report-sheet";
import { P2pSafetyTips } from "@/components/p2p/p2p-safety-tips";
import { P2pOrderSummary } from "@/components/p2p/p2p-order-summary";
import { P2pOrderTimeline } from "@/components/p2p/p2p-order-timeline";
import {
  P2pStatusIcon,
  p2pStatusBadgeClasses,
  p2pStatusLabelKey,
} from "@/components/p2p/p2p-status-badge";
import { P2pIconStar } from "@/components/p2p/p2p-icons";
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
import { P2pPaymentPickChips } from "@/components/p2p/p2p-payment-pick";
import { P2pInfoCard } from "@/components/p2p/p2p-info-card";
import { P2pIllusPayFiat, P2pIllusVerify } from "@/components/p2p/p2p-illustrations";
import { p2pPaymentNameMismatch } from "@/lib/p2p-name-match";
import { extractMomoPhoneFromPaymentDetail } from "@/lib/p2p-momo-qr";
import { P2pMomoPayQr } from "@/components/p2p/p2p-momo-pay-qr";
import { UserAvatarMark } from "@/components/profile/user-avatar-mark";
import {
  parsePaymentSnapshotLines,
  paymentSnapshotLineDetail,
  paymentSnapshotLineLabel,
} from "@/lib/p2p-payment-snapshot";

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
  autoReleaseAt: string | null;
  releasedAt: string | null;
  cancelledAt: string | null;
  paymentSnapshot: string;
  makerMasked: string;
  takerMasked: string;
  counterpartyName: string;
  counterpartyAvatarUrl: string | null;
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
  disputeResponseDueAt: string | null;
  refundedAt: string | null;
  platformFeeCrypto: string | null;
  buyerReceivedCrypto: string | null;
  counterpartyId: string;
  counterpartyVerifiedName: string | null;
  counterpartyKycApproved: boolean;
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
  const [showReport, setShowReport] = useState(false);
  const [reportOk, setReportOk] = useState(false);
  const [paidChecks, setPaidChecks] = useState<Record<string, boolean>>({});
  const [releaseChecks, setReleaseChecks] = useState<Record<string, boolean>>({});
  const [payLineId, setPayLineId] = useState("0");
  const [disputeEvidence, setDisputeEvidence] = useState<
    { id: string; dataUrl: string }[]
  >([]);
  const [disputeEvidenceBusy, setDisputeEvidenceBusy] = useState(false);

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

  const loadDisputeEvidence = useCallback(async () => {
    const res = await fetch(`/api/p2p/orders/${orderId}/dispute-evidence`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    setDisputeEvidence(
      ((data.items as { id: string; dataUrl: string }[]) ?? []).map((x) => ({
        id: x.id,
        dataUrl: x.dataUrl,
      })),
    );
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
    if (!orderId || !order || order.status !== "disputed") return;
    void loadDisputeEvidence();
  }, [orderId, order?.status, loadDisputeEvidence]);

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

  useEffect(() => {
    if (!order || order.status !== "paid" || !order.autoReleaseAt) return;
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

  const releaseCountdown = useMemo(() => {
    if (!order || order.status !== "paid" || !order.autoReleaseAt) return null;
    const end = new Date(order.autoReleaseAt).getTime();
    const left = end - Date.now();
    if (left <= 0) return { expired: true as const, label: "" };
    const s = Math.floor(left / 1000);
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return { expired: false as const, label: `${mm}:${String(ss).padStart(2, "0")}` };
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

  async function uploadDisputeEvidence(file: File) {
    setDisputeEvidenceBusy(true);
    try {
      const prepared = await prepareP2pProofFile(file);
      const res = await fetch(`/api/p2p/orders/${orderId}/dispute-evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prepared),
      });
      if (res.ok) void loadDisputeEvidence();
    } finally {
      setDisputeEvidenceBusy(false);
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

  const payLines = useMemo(
    () => parsePaymentSnapshotLines(order?.paymentSnapshot ?? ""),
    [order?.paymentSnapshot],
  );
  const payPickOptions = useMemo(
    () =>
      payLines.map((line, i) => ({
        id: String(i),
        label: paymentSnapshotLineLabel(line),
      })),
    [payLines],
  );
  const activePayLine = payLines[Number(payLineId)] ?? payLines[0] ?? order?.paymentSnapshot ?? "";
  const momoPhone = useMemo(() => {
    const detail = paymentSnapshotLineDetail(activePayLine) || activePayLine;
    return extractMomoPhoneFromPaymentDetail(detail);
  }, [activePayLine]);

  const paidChecklist = useMemo(
    () => [
      { id: "account", label: t("p2p_check_paid_account") },
      { id: "amount", label: t("p2p_check_paid_amount") },
      { id: "inorder", label: t("p2p_check_paid_inorder") },
    ],
    [t],
  );

  const releaseChecklist = useMemo(
    () => [
      { id: "fiat", label: t("p2p_check_release_account") },
      { id: "name", label: t("p2p_check_release_name") },
      { id: "external", label: t("p2p_check_release_no_external") },
    ],
    [t],
  );

  function togglePaidCheck(id: string) {
    setPaidChecks((c) => ({ ...c, [id]: !c[id] }));
  }

  function toggleReleaseCheck(id: string) {
    setReleaseChecks((c) => ({ ...c, [id]: !c[id] }));
  }

  const nameMismatch = useMemo(() => {
    if (!order) return false;
    const ref = order.paymentReference || paymentRef;
    return p2pPaymentNameMismatch(ref, order.counterpartyVerifiedName);
  }, [order, paymentRef]);

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

        <P2pProcedureBanner
          ctx={{
            status: order.status,
            youArePayer: order.youArePayer,
            youAreSeller: order.youAreSeller,
            youAreBuyer: order.youAreBuyer,
            cryptoQuote,
          }}
        />

        {!cryptoQuote && ["awaiting_payment", "paid", "disputed"].includes(order.status) ? (
          <P2pSafetyTips className="mt-1" />
        ) : null}

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
            {countdown.expired ? "-" : countdown.label}
          </span>
          <p className="text-xs text-[color:var(--fd-muted)]">
            {countdown.expired ? t("p2p_countdown_expired") : t("p2p_countdown_label")}
          </p>
        </div>
      ) : null}

      {order.status === "paid" && releaseCountdown && !cryptoQuote ? (
        <div className="fd-card flex items-center gap-3 px-3 py-2.5">
          <span className="font-mono text-2xl font-bold tabular-nums text-[color:var(--fd-text)]">
            {releaseCountdown.expired ? "-" : releaseCountdown.label}
          </span>
          <p className="text-[10px] leading-snug text-[color:var(--fd-muted)]">
            {order.youAreSeller
              ? t("p2p_release_countdown_seller")
              : t("p2p_release_countdown_buyer")}
          </p>
        </div>
      ) : null}

      {order.status === "awaiting_payment" && order.youArePayer && !cryptoQuote ? (
        <P2pInfoCard
          compact
          variant="warn"
          illustration={<P2pIllusPayFiat className="h-8 w-8" />}
          title={t("p2p_card_momo_title")}
          subtitle={t("p2p_card_inorder_sub")}
        />
      ) : null}

      {order.status === "paid" && order.youAreSeller && !cryptoQuote ? (
        <P2pInfoCard
          compact
          variant="warn"
          illustration={<P2pIllusVerify className="h-8 w-8" />}
          title={t("p2p_card_verify_title")}
          subtitle={t("p2p_card_verify_sub")}
        />
      ) : null}

      {showPaymentAndCrypto && !cryptoQuote ? (
        <FlowSection title={t("p2p_section_payment")}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
            <UserAvatarMark
              email={order.counterpartyName}
              avatarUrl={order.counterpartyAvatarUrl}
              sizeClass="h-8 w-8"
              variant="profile"
            />
            <div className="min-w-0">
            <span className="truncate text-sm font-bold text-[color:var(--fd-text)] block">
              {order.counterpartyName}
            </span>
            {order.counterpartyVerifiedName && order.counterpartyKycApproved ? (
              <span className="text-[10px] font-semibold text-[color:var(--fd-primary)]">
                {t("p2p_verified_name")}: {order.counterpartyVerifiedName}
              </span>
            ) : null}
            </div>
            </div>
            <button
              type="button"
              onClick={() => setShowReport(true)}
              className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700"
            >
              {t("p2p_report_btn")}
            </button>
          </div>
          <P2pPaymentPickChips
            options={payPickOptions}
            value={payLineId}
            onChange={setPayLineId}
            accent={order.youAreBuyer ? "buy" : "sell"}
          />
          <p className="whitespace-pre-wrap rounded-2xl border border-[color:var(--fd-border)] bg-stone-50/80 p-3 text-xs font-medium text-[color:var(--fd-text)]">
            {paymentSnapshotLineDetail(activePayLine) || activePayLine}
          </p>
          {order.status === "awaiting_payment" &&
          order.youArePayer &&
          momoPhone &&
          !cryptoQuote ? (
            <div className="mt-3">
              <P2pMomoPayQr
                phone={momoPhone}
                amount={order.fiatAmount}
                currency={order.fiatCurrency}
                orderId={order.id}
                payeeName={order.counterpartyVerifiedName ?? order.counterpartyName}
              />
            </div>
          ) : null}
        </FlowSection>
      ) : null}

      {nameMismatch && order.youAreSeller && order.status === "paid" ? (
        <P2pInfoCard
          compact
          variant="warn"
          illustration={<P2pIllusVerify className="h-8 w-8" />}
          title={t("p2p_name_mismatch_title")}
          subtitle={t("p2p_name_mismatch_sub")}
        />
      ) : null}

      {reportOk ? (
        <p className="text-center text-[10px] font-semibold text-[color:var(--fd-primary)]">
          {t("p2p_report_sent")}
        </p>
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
        <div className="mt-4 space-y-2">
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100">
            <strong>{t("p2p_order_status_disputed")}:</strong> {order.disputeReason}
          </p>
          {order.disputeResponseDueAt ? (
            <p className="text-[10px] font-semibold text-[color:var(--fd-muted)]">
              {interpolate(t("p2p_dispute_response_due"), {
                when: new Date(order.disputeResponseDueAt).toLocaleString(loc, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              })}
            </p>
          ) : null}
          {disputeEvidence.length > 0 ? (
            <ul className="flex gap-2 overflow-x-auto pb-1">
              {disputeEvidence.map((ev) => (
                <li key={ev.id} className="shrink-0">
                  <img
                    src={ev.dataUrl}
                    alt=""
                    className="h-16 w-16 rounded-lg object-cover ring-1 ring-[color:var(--fd-border)]"
                  />
                </li>
              ))}
            </ul>
          ) : null}
          <FlowUploadZone
            label={t("p2p_dispute_evidence_add")}
            busy={disputeEvidenceBusy}
            onPick={(f) => void uploadDisputeEvidence(f)}
          />
        </div>
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

      <FlowSection>
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
            <FlowPrimaryBtn disabled={busy} onClick={() => {
              setPaidChecks({});
              setModal("paid");
            }}>
              {t("p2p_mark_paid_payer")}
            </FlowPrimaryBtn>
          </div>
        ) : null}

        {order.status === "paid" && order.youAreSeller && !cryptoQuote ? (
          <FlowPrimaryBtn disabled={busy} onClick={() => {
            setReleaseChecks({});
            setModal("release");
          }}>
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
          chatAntiScamHint={t("p2p_chat_antiscam_hint")}
          sticky
          listRef={chatListRef}
        />
      ) : null}

      <P2pConfirmSheet
        open={modal === "paid"}
        variant="buy"
        illustration={<P2pIllusPayFiat />}
        title={t("p2p_confirm_mark_paid_title")}
        subtitle={t("p2p_confirm_mark_paid_body")}
        checklist={paidChecklist}
        checked={paidChecks}
        onToggle={togglePaidCheck}
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

      <P2pConfirmSheet
        open={modal === "release"}
        variant="warn"
        illustration={<P2pIllusVerify />}
        title={t("p2p_confirm_release_title")}
        subtitle={interpolate(t("p2p_confirm_release_amount"), {
          amount: order.cryptoAmount,
          asset: order.asset,
        })}
        checklist={releaseChecklist}
        checked={releaseChecks}
        onToggle={toggleReleaseCheck}
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

      <P2pReportSheet
        open={showReport}
        reportedUserId={order.counterpartyId}
        orderId={order.id}
        onClose={() => setShowReport(false)}
        onSubmitted={() => setReportOk(true)}
      />
    </div>
  );
}

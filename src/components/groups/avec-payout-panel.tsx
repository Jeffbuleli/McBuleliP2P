"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { AvecIconReward } from "@/components/groups/avec-icons";
import { avecCls } from "@/components/groups/avec-ui";
import type { AvecMemberRow } from "@/components/groups/avec-member-list";
import { clientErrorText } from "@/lib/client-error-text";
import { p2pDisplayName } from "@/lib/p2p-display";

type PendingPayout = {
  id: string;
  toUserId: string;
  beneficiaryDisplay: string;
  initiatorDisplay: string;
  amountUsdt: number;
  requiredApprovals: number;
  approvalCount: number;
  approvers: { userId: string; displayName: string }[];
  myApproved: boolean;
  createdAt: string;
};

function ApprovalBar({ count, required }: { count: number; required: number }) {
  const pct = required > 0 ? Math.min(100, (count / required) * 100) : 0;
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-amber-200/80">
      <div
        className="h-full rounded-full bg-amber-700 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function AvecPayoutPanel({
  groupId,
  members,
  myUserId,
  onDone,
}: {
  groupId: string;
  members: AvecMemberRow[];
  myUserId?: string;
  onDone: () => void;
}) {
  const { t, locale } = useI18n();
  const [toUserId, setToUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingPayout[]>([]);
  const [requiredApprovals, setRequiredApprovals] = useState(2);
  const [canManage, setCanManage] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  const approved = members.filter((m) => m.status === "approved");
  const loc = locale === "fr" ? "fr-FR" : "en-US";

  const loadPending = useCallback(async () => {
    const res = await fetch(`/api/groups/${groupId}/payouts`, { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return;
    setPending((j.pending ?? []) as PendingPayout[]);
    const mc = (j.managerCount as number) ?? 3;
    const req =
      (j.pending?.[0]?.requiredApprovals as number | undefined) ??
      Math.max(1, Math.ceil((mc * 2) / 3));
    setRequiredApprovals(req);
    setCanManage(Boolean(j.canManage));
  }, [groupId]);

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  async function propose() {
    const n = Number(amount.replace(",", "."));
    if (!toUserId || !Number.isFinite(n) || n <= 0) return;
    setBusy(true);
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/payouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId, amountUsdt: n }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      setInfo(t("group_payout_proposed"));
      setAmount("");
      await loadPending();
      onDone();
    } finally {
      setBusy(false);
    }
  }

  async function reject(requestId: string, reason: string) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/payouts/${requestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      setInfo(t("group_payout_rejected_ok"));
      setPending([]);
      await loadPending();
      onDone();
    } finally {
      setBusy(false);
    }
  }

  async function approve(requestId: string) {
    setBusy(true);
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/payouts/${requestId}/approve`,
        { method: "POST" },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      if ((j as { executed?: boolean }).executed) {
        setInfo(t("group_payout_success"));
        setPending([]);
      } else {
        setInfo(t("group_payout_approval_recorded"));
      }
      await loadPending();
      onDone();
    } finally {
      setBusy(false);
    }
  }

  const active = pending[0];

  return (
    <div className={avecCls.section}>
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
          <AvecIconReward className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={avecCls.sectionTitle}>{t("avec_payout_title")}</p>
          <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-900">
            2/3 · {requiredApprovals} {t("avec_payout_pill_approvals")}
          </span>
        </div>
      </div>

      {active ? (
        <div className="mb-3 rounded-2xl border-2 border-amber-200/80 bg-amber-50/80 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-900">
            {t("group_payout_pending_title")}
          </p>
          <p className="mt-2 text-lg font-black tabular-nums text-[color:var(--fd-text)]">
            {active.amountUsdt.toFixed(2)}{" "}
            <span className="text-sm font-bold">USDT</span>
            <span className="text-sm font-bold text-amber-800"> → {active.beneficiaryDisplay}</span>
          </p>
          <p className="text-[10px] text-[color:var(--fd-muted)]">
            {active.initiatorDisplay}
          </p>
          <p className="text-[10px] font-semibold text-amber-900">
            {t("group_payout_approvals_progress", {
              count: active.approvalCount,
              required: active.requiredApprovals,
            })}
          </p>
          <ApprovalBar count={active.approvalCount} required={active.requiredApprovals} />
          {canManage ? (
            <div className="mt-3 space-y-2">
              {!active.myApproved ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void approve(active.id)}
                  className={avecCls.btnPrimary}
                >
                  {t("group_payout_approve_btn")}
                </button>
              ) : (
                <p className="text-xs font-semibold text-emerald-800">
                  {t("group_payout_you_approved")}
                </p>
              )}
              {!showReject ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setShowReject(true)}
                  className="w-full rounded-lg border border-rose-200 py-1.5 text-[10px] font-bold text-rose-700"
                >
                  ✕ {t("group_reject_btn")}
                </button>
              ) : (
                <>
                  <input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={t("group_reject_reason_placeholder")}
                    className={`${avecCls.input} !py-1.5 text-xs`}
                  />
                  <button
                    type="button"
                    disabled={busy || rejectReason.trim().length < 3}
                    onClick={() => void reject(active.id, rejectReason.trim())}
                    className="w-full rounded-lg bg-rose-700 py-2 text-xs font-bold text-white"
                  >
                    {t("group_reject_confirm")}
                  </button>
                </>
              )}
            </div>
          ) : null}
        </div>
      ) : canManage ? (
        <div className="space-y-2">
          <select
            value={toUserId}
            onChange={(e) => setToUserId(e.target.value)}
            className={avecCls.input}
          >
            <option value="">{t("avec_payout_select")}</option>
            {approved.map((m) => (
              <option key={m.userId} value={m.userId}>
                {p2pDisplayName({
                  email: m.email,
                  displayName: m.displayName ?? null,
                  avatarUrl: m.avatarUrl ?? null,
                  piUsername: null,
                })}
              </option>
            ))}
          </select>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="USDT"
            className={avecCls.input}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void propose()}
            className={avecCls.btnPrimary}
          >
            {t("group_payout_propose_btn")}
          </button>
        </div>
      ) : (
        <p className="text-xs text-[color:var(--fd-muted)]">{t("avec_treasury_managers_only")}</p>
      )}

      {info ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-800" role="status">
          <span aria-hidden>✓</span>
          {info}
        </p>
      ) : null}
      {err ? (
        <p className="mt-2 text-xs text-rose-700">{clientErrorText(t, err)}</p>
      ) : null}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
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
    <div className="space-y-3">
      <div className={avecCls.section}>
        <p className={avecCls.sectionTitle}>{t("avec_payout_title")}</p>
        <p className="mb-2 text-[10px] leading-relaxed text-[color:var(--fd-muted)]">
          {t("avec_payout_approval_rule", {
            required: requiredApprovals,
            total: Math.max(requiredApprovals, 3),
          })}
        </p>

        {active ? (
          <div className="mb-3 rounded-2xl border-2 border-amber-200/80 bg-amber-50/80 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-900">
              {t("group_payout_pending_title")}
            </p>
            <p className="mt-2 text-sm font-bold text-[color:var(--fd-text)]">
              {active.amountUsdt.toFixed(2)} USDT → {active.beneficiaryDisplay}
            </p>
            <p className="mt-1 text-[10px] text-[color:var(--fd-muted)]">
              {t("group_payout_initiated_by")}: {active.initiatorDisplay}
            </p>
            <p className="mt-1 text-[10px] text-[color:var(--fd-muted)]">
              {t("group_payout_approvals_progress", {
                count: active.approvalCount,
                required: active.requiredApprovals,
              })}
            </p>
            {active.approvers.length > 0 ? (
              <p className="mt-1 text-[10px] font-semibold text-[color:var(--fd-primary)]">
                {t("group_payout_approved_by")}:{" "}
                {active.approvers.map((a) => a.displayName).join(" · ")}
              </p>
            ) : null}
            <p className="mt-1 text-[9px] text-[color:var(--fd-muted)]">
              {new Date(active.createdAt).toLocaleString(loc)}
            </p>
            {canManage && !active.myApproved ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void approve(active.id)}
                className={`${avecCls.btnPrimary} mt-3`}
              >
                {t("group_payout_approve_btn")}
              </button>
            ) : active.myApproved ? (
              <p className="mt-2 text-xs font-semibold text-emerald-800">
                {t("group_payout_you_approved")}
              </p>
            ) : null}
          </div>
        ) : canManage ? (
          <>
            <select
              value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
              className={`${avecCls.input} mb-2`}
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
              className={`${avecCls.btnPrimary} mt-3`}
            >
              {t("group_payout_propose_btn")}
            </button>
          </>
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
    </div>
  );
}

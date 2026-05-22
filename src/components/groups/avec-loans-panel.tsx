"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { avecCls } from "@/components/groups/avec-ui";
import type { AvecMemberRow } from "@/components/groups/avec-member-list";
import { clientErrorText } from "@/lib/client-error-text";
import { p2pDisplayName } from "@/lib/p2p-display";

type PendingLoan = {
  id: string;
  borrowerUserId: string;
  borrowerDisplay: string;
  amountUsdt: number;
  maxAllowedUsdt: number;
  memberSavedUsdt: number;
  requiredApprovals: number;
  approvalCount: number;
  myApproved: boolean;
  approvers: { displayName: string }[];
};

type ActiveLoan = {
  id: string;
  borrowerUserId: string;
  borrowerDisplay: string;
  outstandingUsdt: number;
};

export function AvecLoansPanel({
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
  const { t } = useI18n();
  const [borrowerId, setBorrowerId] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingLoan | null>(null);
  const [active, setActive] = useState<ActiveLoan[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [repayAmount, setRepayAmount] = useState<Record<string, string>>({});

  const approved = members.filter((m) => m.status === "approved");

  const load = useCallback(async () => {
    const res = await fetch(`/api/groups/${groupId}/loans`, { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return;
    setPending((j.pending?.[0] as PendingLoan) ?? null);
    setActive((j.active ?? []) as ActiveLoan[]);
    setCanManage(Boolean(j.canManage));
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function propose() {
    const n = Number(amount.replace(",", "."));
    if (!borrowerId || !Number.isFinite(n) || n <= 0) return;
    setBusy(true);
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/loans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ borrowerUserId: borrowerId, amountUsdt: n }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      setInfo(t("group_loan_proposed"));
      setAmount("");
      await load();
      onDone();
    } finally {
      setBusy(false);
    }
  }

  async function approve(loanId: string) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/loans/${loanId}/approve`, {
        method: "POST",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      if ((j as { executed?: boolean }).executed) {
        setInfo(t("group_loan_disbursed"));
        setPending(null);
      } else {
        setInfo(t("group_loan_approval_recorded"));
      }
      await load();
      onDone();
    } finally {
      setBusy(false);
    }
  }

  async function repay(loanId: string, outstanding: number) {
    const raw = repayAmount[loanId] ?? String(outstanding);
    const n = Number(raw.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/loans/${loanId}/repay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsdt: n }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      setInfo(t("group_loan_repay_ok"));
      await load();
      onDone();
    } finally {
      setBusy(false);
    }
  }

  const myActive = active.filter((l) => l.borrowerUserId === myUserId);

  return (
    <div className={avecCls.section}>
      <p className={avecCls.sectionTitle}>{t("avec_loans_title")}</p>
      <p className="mb-2 text-[10px] text-[color:var(--fd-muted)]">
        {t("avec_loans_rule", { mult: 3 })}
      </p>

      {pending ? (
        <div className="mb-3 rounded-2xl border-2 border-cyan-200/80 bg-cyan-50/60 p-3">
          <p className="text-[10px] font-bold uppercase text-cyan-900">
            {t("group_loan_pending_title")}
          </p>
          <p className="mt-1 text-sm font-bold">
            {pending.amountUsdt.toFixed(2)} USDT → {pending.borrowerDisplay}
          </p>
          <p className="text-[10px] text-[color:var(--fd-muted)]">
            {t("group_loan_max_allowed", { max: pending.maxAllowedUsdt.toFixed(2) })}
            {" · "}
            {t("group_loan_approvals_progress", {
              count: pending.approvalCount,
              required: pending.requiredApprovals,
            })}
          </p>
          {canManage && !pending.myApproved ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void approve(pending.id)}
              className={`${avecCls.btnPrimary} mt-2`}
            >
              {t("group_loan_approve_btn")}
            </button>
          ) : null}
        </div>
      ) : canManage ? (
        <div className="mb-3 space-y-2">
          <select
            value={borrowerId}
            onChange={(e) => setBorrowerId(e.target.value)}
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
            placeholder="USDT"
            inputMode="decimal"
            className={avecCls.input}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void propose()}
            className={avecCls.btnPrimary}
          >
            {t("group_loan_propose_btn")}
          </button>
        </div>
      ) : null}

      {active.length > 0 ? (
        <ul className="space-y-2">
          {active.map((l) => (
            <li
              key={l.id}
              className="rounded-xl border border-[color:var(--fd-border)] px-3 py-2"
            >
              <p className="text-xs font-bold">{l.borrowerDisplay}</p>
              <p className="text-[10px] text-[color:var(--fd-muted)]">
                {t("group_loan_outstanding")}: {l.outstandingUsdt.toFixed(2)} USDT
              </p>
              {(canManage || l.borrowerUserId === myUserId) && l.outstandingUsdt > 0 ? (
                <div className="mt-2 flex gap-2">
                  <input
                    value={repayAmount[l.id] ?? l.outstandingUsdt.toFixed(2)}
                    onChange={(e) =>
                      setRepayAmount((s) => ({ ...s, [l.id]: e.target.value }))
                    }
                    className={`${avecCls.input} !py-1.5 text-xs`}
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void repay(l.id, l.outstandingUsdt)}
                    className="shrink-0 rounded-lg bg-cyan-800 px-3 py-1.5 text-[10px] font-bold text-white"
                  >
                    {t("group_loan_repay_btn")}
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[10px] text-[color:var(--fd-muted)]">{t("group_loans_empty")}</p>
      )}

      {myActive.length > 0 && !canManage ? (
        <p className="mt-2 text-[10px] font-semibold text-cyan-800">
          {t("group_loan_my_active", { n: myActive.length })}
        </p>
      ) : null}

      {info ? (
        <p className="mt-2 text-xs font-semibold text-emerald-800">{info}</p>
      ) : null}
      {err ? (
        <p className="mt-2 text-xs text-rose-700">{clientErrorText(t, err)}</p>
      ) : null}
    </div>
  );
}

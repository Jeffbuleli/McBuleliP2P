"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { AvecIconLoan } from "@/components/groups/avec-icons";
import { avecCls } from "@/components/groups/avec-ui";
import type { AvecMemberRow } from "@/components/groups/avec-member-list";
import { clientErrorText } from "@/lib/client-error-text";
import { p2pDisplayName } from "@/lib/p2p-display";

type PendingLoan = {
  id: string;
  borrowerDisplay: string;
  amountUsdt: number;
  requiredApprovals: number;
  approvalCount: number;
  myApproved: boolean;
};

type RequestedLoan = {
  id: string;
  borrowerDisplay: string;
  amountUsdt: number;
};

type ActiveLoan = {
  id: string;
  borrowerUserId: string;
  borrowerDisplay: string;
  outstandingUsdt: number;
  interestAccruedUsdt: number;
  penaltyUsdt: number;
  totalDueUsdt: number;
  isOverdue: boolean;
  daysUntilPenalty: number;
};

type HistoryLoan = {
  id: string;
  borrowerDisplay: string;
  principalUsdt: number;
  status: string;
  rejectionReason: string | null;
};

function RatePills() {
  const { t } = useI18n();
  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[9px] font-bold text-cyan-900">
        10% / 30j
      </span>
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-900">
        +20% · J+37
      </span>
      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[9px] font-bold text-stone-600">
        max 90j
      </span>
      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-bold text-violet-900">
        2/3
      </span>
    </div>
  );
}

function RejectBlock({ busy, onReject }: { busy: boolean; onReject: (reason: string) => void }) {
  const { t } = useI18n();
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen(true)}
        className="mt-2 rounded-lg border border-rose-200 px-3 py-1.5 text-[10px] font-bold text-rose-700"
      >
        ✕ {t("group_reject_btn")}
      </button>
    );
  }
  return (
    <div className="mt-2 space-y-1">
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={t("group_reject_reason_placeholder")}
        className={`${avecCls.input} !py-1.5 text-xs`}
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy || reason.trim().length < 3}
          onClick={() => {
            onReject(reason.trim());
            setOpen(false);
            setReason("");
          }}
          className="rounded-lg bg-rose-700 px-3 py-1.5 text-[10px] font-bold text-white"
        >
          {t("group_reject_confirm")}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-[10px] text-[color:var(--fd-muted)]">
          {t("group_reject_cancel")}
        </button>
      </div>
    </div>
  );
}

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
  const [memberAmount, setMemberAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [requested, setRequested] = useState<RequestedLoan[]>([]);
  const [pending, setPending] = useState<PendingLoan | null>(null);
  const [active, setActive] = useState<ActiveLoan[]>([]);
  const [history, setHistory] = useState<HistoryLoan[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [myMaxLoan, setMyMaxLoan] = useState(0);
  const [repayAmount, setRepayAmount] = useState<Record<string, string>>({});

  const approved = members.filter((m) => m.status === "approved");

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch(`/api/groups/${groupId}/loans`, { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return;
    setRequested((j.requested ?? []) as RequestedLoan[]);
    setPending((j.pending?.[0] as PendingLoan) ?? null);
    setActive((j.active ?? []) as ActiveLoan[]);
    setHistory((j.history ?? []) as HistoryLoan[]);
    setCanManage(Boolean(j.canManage));
    setMyMaxLoan(Number(j.myMaxLoanUsdt) || 0);
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

  async function requestLoan() {
    const n = Number(memberAmount.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/loans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsdt: n }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      setInfo(t("group_loan_request_sent"));
      setMemberAmount("");
      await load();
      onDone();
    } finally {
      setBusy(false);
    }
  }

  async function acceptRequest(loanId: string) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/loans/${loanId}/accept`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      setInfo(t("group_loan_request_accepted"));
      await load();
      onDone();
    } finally {
      setBusy(false);
    }
  }

  async function rejectLoan(loanId: string, reason: string) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/loans/${loanId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      setInfo(t("group_loan_rejected_ok"));
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
      const res = await fetch(`/api/groups/${groupId}/loans/${loanId}/approve`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      setInfo(
        (j as { executed?: boolean }).executed
          ? t("group_loan_disbursed")
          : t("group_loan_approval_recorded"),
      );
      await load();
      onDone();
    } finally {
      setBusy(false);
    }
  }

  async function repay(loanId: string, totalDue: number) {
    const raw = repayAmount[loanId] ?? String(totalDue);
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
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-900">
          <AvecIconLoan className="h-5 w-5" />
        </span>
        <p className={avecCls.sectionTitle}>{t("avec_loans_title")}</p>
      </div>

      <RatePills />

      {!canManage && !pending && requested.length === 0 ? (
        <div className="mb-3 rounded-2xl border border-cyan-200/60 bg-cyan-50/50 p-3">
          <p className="mb-2 text-xs font-bold text-cyan-900">{t("group_loan_request_title")}</p>
          <p className="mb-2 text-[10px] tabular-nums text-[color:var(--fd-muted)]">
            max {myMaxLoan.toFixed(0)} USDT
          </p>
          <input
            value={memberAmount}
            onChange={(e) => setMemberAmount(e.target.value)}
            placeholder="USDT"
            inputMode="decimal"
            className={avecCls.input}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void requestLoan()}
            className={`${avecCls.btnPrimary} mt-2`}
          >
            {t("group_loan_request_btn")}
          </button>
        </div>
      ) : null}

      {requested.map((r) => (
        <div key={r.id} className="mb-3 rounded-2xl border-2 border-amber-300 bg-amber-50/80 p-3">
          <p className="text-[10px] font-bold uppercase text-amber-900">
            {t("group_loan_member_request_title")}
          </p>
          <p className="text-lg font-black tabular-nums">
            {r.amountUsdt.toFixed(2)} <span className="text-xs">USDT</span> · {r.borrowerDisplay}
          </p>
          {canManage ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void acceptRequest(r.id)}
                className={avecCls.btnPrimary}
              >
                {t("group_loan_accept_request_btn")}
              </button>
              <RejectBlock busy={busy} onReject={(reason) => void rejectLoan(r.id, reason)} />
            </div>
          ) : null}
        </div>
      ))}

      {pending ? (
        <div className="mb-3 rounded-2xl border-2 border-cyan-300 bg-cyan-50/70 p-3">
          <p className="text-[10px] font-bold uppercase text-cyan-900">
            {t("group_loan_pending_title")}
          </p>
          <p className="text-lg font-black tabular-nums">
            {pending.amountUsdt.toFixed(2)} USDT → {pending.borrowerDisplay}
          </p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cyan-100">
            <div
              className="h-full rounded-full bg-cyan-600"
              style={{
                width: `${Math.round((pending.approvalCount / Math.max(1, pending.requiredApprovals)) * 100)}%`,
              }}
            />
          </div>
          {canManage && !pending.myApproved ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void approve(pending.id)}
                className={avecCls.btnPrimary}
              >
                {t("group_loan_approve_btn")}
              </button>
              <RejectBlock busy={busy} onReject={(reason) => void rejectLoan(pending.id, reason)} />
            </div>
          ) : null}
        </div>
      ) : canManage && requested.length === 0 ? (
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
          <button type="button" disabled={busy} onClick={() => void propose()} className={avecCls.btnPrimary}>
            {t("group_loan_propose_btn")}
          </button>
        </div>
      ) : null}

      {active.length > 0 ? (
        <ul className="space-y-2">
          {active.map((l) => (
            <li
              key={l.id}
              className="rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2"
            >
              <p className="text-xs font-bold">{l.borrowerDisplay}</p>
              <div className="mt-1 flex flex-wrap gap-1 text-[9px] font-semibold">
                <span className="rounded bg-stone-100 px-1.5 py-0.5">
                  {l.outstandingUsdt.toFixed(2)} cap.
                </span>
                <span className="rounded bg-cyan-50 px-1.5 py-0.5 text-cyan-800">
                  +{l.interestAccruedUsdt.toFixed(2)} int.
                </span>
                {l.penaltyUsdt > 0 ? (
                  <span className="rounded bg-rose-50 px-1.5 py-0.5 text-rose-800">
                    +{l.penaltyUsdt.toFixed(2)} pén.
                  </span>
                ) : l.daysUntilPenalty > 0 && l.daysUntilPenalty < 20 ? (
                  <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-800">
                    J+{Math.ceil(l.daysUntilPenalty)} pén.
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm font-black tabular-nums text-cyan-900">
                {l.totalDueUsdt.toFixed(2)} USDT
              </p>
              {(canManage || l.borrowerUserId === myUserId) && l.totalDueUsdt > 0 ? (
                <div className="mt-2 flex gap-2">
                  <input
                    value={repayAmount[l.id] ?? l.totalDueUsdt.toFixed(2)}
                    onChange={(e) => setRepayAmount((s) => ({ ...s, [l.id]: e.target.value }))}
                    className={`${avecCls.input} !py-1.5 text-xs`}
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void repay(l.id, l.totalDueUsdt)}
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
        <p className="py-2 text-center text-[10px] text-[color:var(--fd-muted)]">{t("group_loans_empty")}</p>
      )}

      {history.length > 0 ? (
        <ul className="mt-2 max-h-24 space-y-1 overflow-y-auto border-t border-[color:var(--fd-border)] pt-2">
          {history.map((h) => (
            <li key={h.id} className="text-[9px] text-[color:var(--fd-muted)]">
              {h.borrowerDisplay} · {h.principalUsdt.toFixed(0)} USDT ·{" "}
              {h.status === "rejected" ? "✕" : "✓"}
              {h.rejectionReason ? ` — ${h.rejectionReason}` : ""}
            </li>
          ))}
        </ul>
      ) : null}

      {info ? <p className="mt-2 text-xs font-semibold text-emerald-800">{info}</p> : null}
      {err ? <p className="mt-2 text-xs text-rose-700">{clientErrorText(t, err)}</p> : null}
    </div>
  );
}

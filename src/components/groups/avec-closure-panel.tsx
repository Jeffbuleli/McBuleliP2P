"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { AvecIconClosure, AvecIconSolidarity } from "@/components/groups/avec-icons";
import { avecCls } from "@/components/groups/avec-ui";
import { clientErrorText } from "@/lib/client-error-text";
import type { ClosureSnapshot } from "@/lib/avec/group-cycle-closure";

type ClosureState = {
  canManage: boolean;
  cycleStatus: string;
  cycleNumber: number;
  pending: {
    id: string;
    cycleNumber: number;
    distributableUsdt: number;
    requiredApprovals: number;
    approvalCount: number;
    myApproved: boolean;
    snapshot: ClosureSnapshot;
    initiatorDisplay: string;
  } | null;
  collectiveVote: {
    proposalId: string;
    voteClosesAt: string;
    snapshot: ClosureSnapshot;
    distributableUsdt: number;
    cycleNumber: number;
  } | null;
};

function ClosurePills() {
  const { t } = useI18n();
  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-bold text-violet-900">
        {t("group_gov_collective_badge")}
      </span>
      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-900">
        <AvecIconSolidarity className="h-3 w-3" />
        {t("avec_closure_pill_social")}
      </span>
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-900">
        {t("avec_closure_pill_shares")}
      </span>
    </div>
  );
}

function ApprovalBar({ count, required }: { count: number; required: number }) {
  const pct = required > 0 ? Math.min(100, (count / required) * 100) : 0;
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-violet-200/80">
      <div
        className="h-full rounded-full bg-violet-700 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function AvecClosurePanel({
  groupId,
  isAdmin,
  onDone,
}: {
  groupId: string;
  isAdmin: boolean;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [state, setState] = useState<ClosureState | null>(null);
  const [preview, setPreview] = useState<ClosureSnapshot | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/groups/${groupId}/closure`, { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return;
    setState(j as ClosureState);
    const pendingSnap = (j as ClosureState).pending?.snapshot;
    if (pendingSnap) setPreview(pendingSnap);
    else if ((j as ClosureState).cycleStatus === "active" && (j as ClosureState).canManage) {
      const pr = await fetch(`/api/groups/${groupId}/closure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preview: true }),
      });
      const pj = await pr.json().catch(() => ({}));
      if (pr.ok && (pj as { snapshot?: ClosureSnapshot }).snapshot) {
        setPreview((pj as { snapshot: ClosureSnapshot }).snapshot);
      }
    }
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function propose() {
    setBusy(true);
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/closure`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      if ((j as { governance?: boolean }).governance) {
        setInfo(t("group_gov_closure_vote_started"));
      } else {
        setInfo(t("group_closure_proposed"));
      }
      await load();
      onDone();
    } finally {
      setBusy(false);
    }
  }

  async function approve(requestId: string) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/closure/${requestId}/approve`, {
        method: "POST",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      if ((j as { executed?: boolean }).executed) {
        setInfo(t("group_closure_executed"));
      } else {
        setInfo(t("group_closure_approval_recorded"));
      }
      await load();
      onDone();
    } finally {
      setBusy(false);
    }
  }

  async function startNext() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/cycle/start`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      setInfo(t("group_cycle_started", { n: (j as { cycleNumber?: number }).cycleNumber ?? "" }));
      await load();
      onDone();
    } finally {
      setBusy(false);
    }
  }

  const snap =
    state?.collectiveVote?.snapshot ??
    state?.pending?.snapshot ??
    preview;
  const status = state?.cycleStatus ?? "active";
  const statusLabel =
    status === "closed"
      ? t("group_closure_status_closed")
      : status === "closing"
        ? t("group_closure_status_closing")
        : t("group_closure_status_active");

  return (
    <div className={avecCls.section}>
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-900">
          <AvecIconClosure className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={avecCls.sectionTitle}>{t("avec_closure_title")}</p>
          <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-900">
            {statusLabel} · #{state?.cycleNumber ?? "—"}
          </p>
        </div>
      </div>

      <ClosurePills />

      {status === "closed" && isAdmin ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void startNext()}
          className={`${avecCls.btnPrimary} mb-3`}
        >
          {t("group_cycle_start_btn")}
        </button>
      ) : null}

      {state?.collectiveVote ? (
        <div className="mb-3 rounded-2xl border-2 border-violet-200/80 bg-violet-50/60 p-3">
          <p className="text-[10px] font-bold uppercase text-violet-900">
            {t("group_gov_closure_vote_open")}
          </p>
          <p className="mt-1 text-lg font-black tabular-nums text-violet-950">
            {state.collectiveVote.distributableUsdt.toFixed(2)}{" "}
            <span className="text-sm font-bold">USDT</span>
          </p>
          <p className="text-[10px] font-semibold text-violet-800">
            {t("group_gov_vote_closes_at")}:{" "}
            {new Date(state.collectiveVote.voteClosesAt).toLocaleString()}
          </p>
          <p className="mt-2 text-[10px] text-violet-900">{t("group_gov_vote_in_dialogue")}</p>
        </div>
      ) : state?.pending ? (
        <div className="mb-3 rounded-2xl border-2 border-violet-200/80 bg-violet-50/60 p-3">
          <p className="text-[10px] font-bold uppercase text-violet-900">
            {t("group_closure_pending_title")}
          </p>
          <p className="mt-1 text-lg font-black tabular-nums text-violet-950">
            {state.pending.distributableUsdt.toFixed(2)}{" "}
            <span className="text-sm font-bold">USDT</span>
          </p>
          <p className="text-[10px] font-semibold text-violet-800">
            {t("group_closure_approvals_progress", {
              count: state.pending.approvalCount,
              required: state.pending.requiredApprovals,
            })}
          </p>
          <ApprovalBar
            count={state.pending.approvalCount}
            required={state.pending.requiredApprovals}
          />
          {state.canManage && !state.pending.myApproved ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void approve(state.pending!.id)}
              className={`${avecCls.btnPrimary} mt-3`}
            >
              {t("group_closure_approve_btn")}
            </button>
          ) : null}
        </div>
      ) : state?.canManage && status === "active" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void propose()}
          className={`${avecCls.btnPrimary} mb-3`}
        >
          {t("group_closure_propose_btn")}
        </button>
      ) : null}

      {snap && snap.members.length > 0 ? (
        <div className="space-y-1.5">
          {snap.members.map((m) => (
            <div
              key={m.userId}
              className="flex items-center justify-between gap-2 rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-bold">{m.displayName}</p>
                <p className="text-[10px] text-[color:var(--fd-muted)]">
                  {m.sharesTotal} {t("group_closure_shares_short")}
                </p>
              </div>
              <p className="shrink-0 text-sm font-black tabular-nums text-[color:var(--fd-primary)]">
                {m.payoutUsdt.toFixed(2)}
              </p>
            </div>
          ))}
          <p className="text-center text-[10px] font-semibold text-[color:var(--fd-muted)]">
            {snap.finalShareValueUsdt.toFixed(4)} USDT / {t("group_closure_shares_short")}
          </p>
        </div>
      ) : null}

      {status === "closed" ? (
        <a
          href={`/api/groups/${groupId}/closure/report`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-violet-800 underline"
        >
          {t("group_closure_report_link")}
        </a>
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

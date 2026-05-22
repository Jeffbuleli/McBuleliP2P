"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
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
};

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
      setInfo(t("group_closure_proposed"));
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

  const snap = state?.pending?.snapshot ?? preview;
  const status = state?.cycleStatus ?? "active";

  return (
    <div className={avecCls.section}>
      <p className={avecCls.sectionTitle}>{t("avec_closure_title")}</p>
      <p className="mb-2 text-[10px] text-[color:var(--fd-muted)]">
        {t("avec_closure_rule")}
      </p>

      <p className="mb-2 text-xs font-semibold text-violet-900">
        {t("group_closure_status_label")}:{" "}
        {status === "closed"
          ? t("group_closure_status_closed")
          : status === "closing"
            ? t("group_closure_status_closing")
            : t("group_closure_status_active")}
        {state ? ` · ${t("group_closure_cycle")} #${state.cycleNumber}` : null}
      </p>

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

      {state?.pending ? (
        <div className="mb-3 rounded-2xl border-2 border-violet-200/80 bg-violet-50/60 p-3">
          <p className="text-[10px] font-bold uppercase text-violet-900">
            {t("group_closure_pending_title")}
          </p>
          <p className="mt-1 text-sm font-bold">
            {state.pending.distributableUsdt.toFixed(2)} USDT ·{" "}
            {t("group_closure_approvals_progress", {
              count: state.pending.approvalCount,
              required: state.pending.requiredApprovals,
            })}
          </p>
          {state.canManage && !state.pending.myApproved ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void approve(state.pending!.id)}
              className={`${avecCls.btnPrimary} mt-2`}
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
        <div className="overflow-x-auto rounded-xl border border-[color:var(--fd-border)]">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-[color:var(--fd-border)] bg-[color:var(--fd-card)]">
                <th className="px-2 py-1.5 text-left">{t("group_closure_member")}</th>
                <th className="px-2 py-1.5 text-right">{t("group_closure_shares")}</th>
                <th className="px-2 py-1.5 text-right">{t("group_closure_payout")}</th>
              </tr>
            </thead>
            <tbody>
              {snap.members.map((m) => (
                <tr key={m.userId} className="border-b border-[color:var(--fd-border)]/60">
                  <td className="px-2 py-1.5 font-medium">{m.displayName}</td>
                  <td className="px-2 py-1.5 text-right">{m.sharesTotal}</td>
                  <td className="px-2 py-1.5 text-right font-bold">
                    {m.payoutUsdt.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-2 py-1.5 text-[10px] text-[color:var(--fd-muted)]">
            {t("group_closure_final_share")}: {snap.finalShareValueUsdt.toFixed(4)} USDT
          </p>
        </div>
      ) : null}

      {status === "closed" ? (
        <a
          href={`/api/groups/${groupId}/closure/report`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-xs font-bold text-violet-800 underline"
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

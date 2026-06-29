"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { WithdrawalStatus } from "@/lib/status";
import { activityNetworkLabel } from "@/lib/activity-network-label";
import { useI18n } from "@/components/i18n-provider";
import { parsePiTxidOrUrl, piExplorerUrlFromTxid } from "@/lib/pi-explorer";
import { adminCls, AdminBackLink } from "@/components/admin/admin-ui";

type W = {
  id: string;
  userId: string;
  asset: string;
  networkCanonical: string;
  networkCex: string;
  toAddress: string;
  memoTo: string | null;
  amount: string;
  fee: string;
  status: string;
  txid: string | null;
  assignedToUserId: string | null;
  createdAt: string;
};

export default function AdminWithdrawalDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [userEmail, setUserEmail] = useState("");
  const [assigneeEmail, setAssigneeEmail] = useState<string | null>(null);
  const [w, setW] = useState<W | null>(null);
  const [viewer, setViewer] = useState<{ id: string; role: string } | null>(null);
  const [txid, setTxid] = useState("");
  const [agentNote, setAgentNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/withdrawals/${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.message ?? "-");
      setW(null);
      return;
    }
    setW(data.withdrawal);
    setUserEmail(data.userEmail ?? "");
    setAssigneeEmail(data.assigneeEmail ?? null);
    setViewer(data.viewer ?? null);
  }, [id]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  async function claim() {
    setMsg(null);
    const res = await fetch(`/api/admin/withdrawals/${id}/claim`, {
      method: "POST",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.message ?? "-");
      return;
    }
    setW(data.withdrawal);
    void load();
  }

  async function complete() {
    setMsg(null);
    const parsedPi =
      w?.asset === "PI" && txid.trim()
        ? parsePiTxidOrUrl(txid.trim())
        : null;
    const res = await fetch(`/api/admin/withdrawals/${id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        txid: parsedPi?.txid ?? txid,
        agentNote: agentNote || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.message ?? "-");
      return;
    }
    router.push("/admin/withdrawals");
  }

  async function reject() {
    setMsg(null);
    const res = await fetch(`/api/admin/withdrawals/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.message ?? "-");
      return;
    }
    router.push("/admin/withdrawals");
  }

  if (loading) {
    return <p className={adminCls.muted}>…</p>;
  }
  if (!w) {
    return (
      <div className={adminCls.page}>
        <p className={adminCls.error}>
          {msg ?? "-"}{" "}
          <Link href="/admin/withdrawals" className={adminCls.back}>
            {t("admin_back")}
          </Link>
        </p>
      </div>
    );
  }

  const pending = w.status === WithdrawalStatus.PENDING_AGENT;
  const processing = w.status === WithdrawalStatus.PROCESSING;
  const totalDebit = (Number(w.amount) + Number(w.fee)).toFixed(8);
  const networkLine = activityNetworkLabel(locale, w.networkCanonical);
  const canAct =
    viewer &&
    (viewer.role === "super_admin" || w.assignedToUserId === viewer.id);
  const showActions = processing && canAct;
  const explorerUrl =
    w.asset === "PI" && (w.txid || txid.trim())
      ? piExplorerUrlFromTxid((parsePiTxidOrUrl(w.txid ?? txid)?.txid ?? w.txid ?? txid).trim())
      : null;

  return (
    <div className={`${adminCls.page} pb-12`}>
      <AdminBackLink href="/admin/withdrawals">{t("admin_back")}</AdminBackLink>

      <div className={adminCls.card}>
        <p className={`text-xs uppercase ${adminCls.muted}`}>User</p>
        <p className="font-medium text-[color:var(--fd-text)]">{userEmail}</p>
        <p className={`mt-3 text-xs uppercase ${adminCls.muted}`}>{t("admin_asset")}</p>
        <p className={`text-lg font-semibold ${adminCls.h2}`}>{w.asset}</p>
        <p className={`mt-3 text-xs uppercase ${adminCls.muted}`}>{t("admin_net_fee")}</p>
        <p className="text-lg font-semibold text-[color:var(--fd-primary)]">
          {w.amount} + {w.fee} {w.asset} → {totalDebit} {w.asset}
        </p>
        <p className={`mt-3 text-xs uppercase ${adminCls.muted}`}>{t("admin_network")}</p>
        <p className="text-[color:var(--fd-text)]">{networkLine}</p>
        <p className={`mt-1 text-xs ${adminCls.muted}`}>{w.networkCex}</p>
        <p className={`mt-3 text-xs uppercase ${adminCls.muted}`}>{t("admin_dest")}</p>
        <p className="break-all font-mono text-sm text-emerald-700">
          {w.toAddress}
        </p>
        {w.memoTo ? (
          <p className="mt-2 font-mono text-sm text-rose-700">Memo: {w.memoTo}</p>
        ) : null}
        <p className={`mt-3 text-xs ${adminCls.muted}`}>
          {w.status === WithdrawalStatus.PENDING_AGENT && t("status_pending")}
          {w.status === WithdrawalStatus.PROCESSING && (
            <>
              {t("admin_processing_label")}
              {assigneeEmail ? ` · ${assigneeEmail}` : ""}
            </>
          )}
        </p>
        {w.txid ? (
          <div className="mt-2">
            <p className={`font-mono text-sm ${adminCls.muted}`}>TXID: {w.txid}</p>
            {explorerUrl ? (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-sm font-semibold text-emerald-700 underline"
              >
                Open Explorer
              </a>
            ) : null}
          </div>
        ) : null}
      </div>

      {pending ? (
        <button type="button" onClick={() => void claim()} className={`w-full ${adminCls.btnPrimary}`}>
          {t("admin_claim")}
        </button>
      ) : null}

      {processing && !canAct ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t("admin_release_hint")}
          {assigneeEmail ? ` (${assigneeEmail})` : ""}
        </div>
      ) : null}

      {showActions ? (
        <>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            {t("admin_txid")} → {t("admin_mark_sent")}
          </div>
          <label className={`block text-sm ${adminCls.muted}`}>
            {t("admin_txid")}
            <input
              value={txid}
              onChange={(e) => setTxid(e.target.value)}
              className={`mt-1 w-full font-mono ${adminCls.input}`}
            />
          </label>
          {w.asset === "PI" && txid.trim() ? (
            (() => {
              const p = parsePiTxidOrUrl(txid.trim());
              const url = p?.url ?? null;
              return url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-sm font-semibold text-emerald-700 underline"
                >
                  Open Explorer
                </a>
              ) : (
                <p className="text-xs text-rose-700">Invalid Pi TXID/URL.</p>
              );
            })()
          ) : null}
          <label className={`block text-sm ${adminCls.muted}`}>
            {t("admin_note")}
            <textarea
              value={agentNote}
              onChange={(e) => setAgentNote(e.target.value)}
              className={`mt-1 w-full ${adminCls.input}`}
              rows={2}
            />
          </label>
          <button
            type="button"
            disabled={txid.trim().length < 8}
            onClick={() => void complete()}
            className={`w-full ${adminCls.btnPrimary} disabled:opacity-40`}
          >
            {t("admin_mark_sent")}
          </button>

          <div className="border-t border-[color:var(--fd-border)] pt-6">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className={`mb-2 w-full ${adminCls.input}`}
              rows={2}
            />
            <button
              type="button"
              disabled={rejectReason.trim().length < 3}
              onClick={() => void reject()}
              className="w-full rounded-xl border border-rose-300 bg-rose-50 py-3 font-semibold text-rose-800 disabled:opacity-40"
            >
              {t("admin_reject")}
            </button>
          </div>
        </>
      ) : null}

      {msg ? <p className={adminCls.error}>{msg}</p> : null}
    </div>
  );
}

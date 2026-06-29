"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminDataTable,
  type AdminTableColumn,
} from "@/components/admin/admin-data-table";
import { adminCls } from "@/components/admin/admin-ui";
import type { AdminTopTraderPayoutRow, TopTraderProgramInfo } from "@/lib/community/top-trader-types";

type Payload = {
  ok: boolean;
  payouts: AdminTopTraderPayoutRow[];
  program: TopTraderProgramInfo;
  pendingWeek: {
    weekLabel: string;
    weekStartAt: string;
    weekEndAt: string;
    settled: boolean;
  } | null;
};

type Dict = {
  admin_top_trader_title: string;
  admin_top_trader_subtitle: string;
  admin_top_trader_run_payout: string;
  admin_top_trader_run_confirm: string;
  admin_top_trader_col_week: string;
  admin_top_trader_col_winner: string;
  admin_top_trader_col_pnl: string;
  admin_top_trader_col_prize: string;
  admin_top_trader_col_status: string;
  admin_top_trader_col_paid: string;
  admin_top_trader_refresh: string;
  admin_top_trader_loading: string;
  admin_top_trader_error: string;
  admin_top_trader_program_status: string;
  admin_top_trader_pending_week: string;
  admin_top_trader_view_community: string;
};

function usdt(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function statusBadge(status: string) {
  const base = "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase";
  if (status === "paid") return `${base} bg-emerald-100 text-emerald-800`;
  if (status === "pending_kyc") return `${base} bg-amber-100 text-amber-900`;
  if (status === "no_winner") return `${base} bg-stone-100 text-stone-600`;
  return `${base} bg-slate-100 text-slate-700`;
}

export function AdminTopTraderClient({ d }: { d: Dict }) {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/admin/community/top-trader");
    const json = (await res.json().catch(() => ({}))) as Payload & {
      message?: string;
    };
    if (!res.ok) {
      setErr(json.message ?? d.admin_top_trader_error);
      return;
    }
    setData(json);
  }, [d.admin_top_trader_error]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runPayout() {
    if (!window.confirm(d.admin_top_trader_run_confirm)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/community/top-trader", {
        method: "POST",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(json.message ?? d.admin_top_trader_error);
        return;
      }
      window.alert(
        `Status: ${json.status ?? "ok"}${json.weekLabel ? ` · ${json.weekLabel}` : ""}`,
      );
      await load();
    } finally {
      setBusy(false);
    }
  }

  const columns = useMemo((): AdminTableColumn<AdminTopTraderPayoutRow>[] => {
    return [
      {
        id: "week",
        header: d.admin_top_trader_col_week,
        cell: (r) => (
          <span className="font-semibold text-[color:var(--fd-text)]">
            {r.weekLabel}
          </span>
        ),
      },
      {
        id: "winner",
        header: d.admin_top_trader_col_winner,
        cell: (r) =>
          r.winnerUserId ? (
            <Link
              href={`/admin/users/${r.winnerUserId}`}
              className="font-medium text-[color:var(--fd-primary)] hover:underline"
            >
              {r.winnerDisplayName ?? r.winnerUserId.slice(0, 8)}
              {r.winnerHandle ? ` @${r.winnerHandle}` : ""}
            </Link>
          ) : (
            <span className="text-[color:var(--fd-muted)]">-</span>
          ),
      },
      {
        id: "pnl",
        header: d.admin_top_trader_col_pnl,
        cell: (r) => (
          <span className="tabular-nums">
            {r.weeklyPnlUsdt != null ? `${usdt(r.weeklyPnlUsdt)} USDT` : "-"}
          </span>
        ),
      },
      {
        id: "prize",
        header: d.admin_top_trader_col_prize,
        cell: (r) => (
          <span className="tabular-nums font-semibold">
            {usdt(r.prizeUsdt)} USDT
          </span>
        ),
      },
      {
        id: "status",
        header: d.admin_top_trader_col_status,
        cell: (r) => <span className={statusBadge(r.status)}>{r.status}</span>,
      },
      {
        id: "paid",
        header: d.admin_top_trader_col_paid,
        cell: (r) =>
          r.paidAt ? (
            <span className="text-xs tabular-nums text-[color:var(--fd-muted)]">
              {new Date(r.paidAt).toLocaleString()}
            </span>
          ) : (
            "-"
          ),
      },
    ];
  }, [d]);

  if (!data && !err) {
    return (
      <p className="text-sm text-[color:var(--fd-muted)]">
        {d.admin_top_trader_loading}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {err ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {err}
        </p>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className={adminCls.card}>
              <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
                {d.admin_top_trader_program_status}
              </p>
              <p className="mt-1 text-lg font-black capitalize text-[color:var(--fd-text)]">
                {data.program.status}
              </p>
              <p className="mt-1 text-sm text-[color:var(--fd-muted)]">
                {data.program.weekLabel} · {usdt(data.program.prizeUsdt)} USDT
              </p>
            </div>
            <div className={adminCls.card}>
              <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
                {d.admin_top_trader_pending_week}
              </p>
              {data.pendingWeek ? (
                <>
                  <p className="mt-1 text-lg font-black text-[color:var(--fd-text)]">
                    {data.pendingWeek.weekLabel}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--fd-muted)]">
                    {data.pendingWeek.settled ? "Settled" : "Awaiting payout"}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-[color:var(--fd-muted)]">-</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={adminCls.btnPrimary}
              disabled={busy}
              onClick={() => void runPayout()}
            >
              {d.admin_top_trader_run_payout}
            </button>
            <button
              type="button"
              className={adminCls.btnSecondary}
              disabled={busy}
              onClick={() => void load()}
            >
              {d.admin_top_trader_refresh}
            </button>
            <Link
              href="/app/community/traders?tab=top_trader"
              className={adminCls.btnSecondary}
            >
              {d.admin_top_trader_view_community}
            </Link>
          </div>

          <AdminDataTable
            rows={data.payouts}
            columns={columns}
            rowKey={(r) => r.id}
            emptyMessage="-"
          />
        </>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { groupAuditLabel } from "@/components/groups/group-audit-entry";
import { AvecBarChart } from "@/components/groups/avec-charts";
import { IlluReports } from "@/components/groups/avec-illustrations";
import { avecCls } from "@/components/groups/avec-ui";
import { walletEntryLabel } from "@/lib/wallet-history-labels";
import { ListPagination, useListPagination } from "@/components/ui/list-pagination";

type LedgerRow = {
  id: string;
  entryType: string;
  amount: string;
  createdAt: string;
  meta: Record<string, unknown> | null;
};

type ProofRow = {
  id: string;
  senderEmail: string;
  body: string;
  attachmentUrl: string | null;
  createdAt: string;
};

type AuditRow = {
  id: string;
  action: string;
  createdAt: string;
};

export function AvecReportsPanel({ groupId }: { groupId: string }) {
  const { t, locale } = useI18n();
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [proofs, setProofs] = useState<ProofRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [role, setRole] = useState("member");

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/groups/${groupId}/activity`, { cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setLedger((j.ledger ?? []) as LedgerRow[]);
      setProofs((j.proofs ?? []) as ProofRow[]);
      setAudit((j.audit ?? []) as AuditRow[]);
      setRole(j.role ?? "member");
    })();
  }, [groupId]);

  const loc = locale === "fr" ? "fr-FR" : "en-US";
  const showAudit = role === "admin" || role === "co_admin";
  const ledgerPag = useListPagination(ledger, 10);

  const monthlyBars = useMemo(() => {
    const bars = Array.from({ length: 6 }, () => 0);
    const now = Date.now();
    for (const e of ledger) {
      const age = now - new Date(e.createdAt).getTime();
      const m = Math.floor(age / (30 * 86400000));
      if (m >= 0 && m < 6) {
        bars[5 - m] += Math.abs(Number(e.amount) || 0);
      }
    }
    return bars;
  }, [ledger]);

  const govAudit = useMemo(
    () =>
      audit.filter((a) =>
        a.action.startsWith("gov_"),
      ),
    [audit],
  );

  return (
    <div className="space-y-3">
      <div className={`${avecCls.section} flex items-center gap-3`}>
        <IlluReports className="h-14 w-20 shrink-0 text-[color:var(--fd-primary)] opacity-80" />
        <div>
          <p className={avecCls.sectionTitle}>{t("avec_tab_reports")}</p>
          <p className="text-[10px] text-[color:var(--fd-muted)]">{t("avec_reports_intro")}</p>
        </div>
      </div>

      <div className={avecCls.section}>
        <p className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {t("avec_reports_activity_chart")}
        </p>
        <AvecBarChart values={monthlyBars} maxHeight={64} />
      </div>

      <div className={avecCls.section}>
        <p className={avecCls.sectionTitle}>{t("avec_reports_ledger")}</p>
        {ledger.length === 0 ? (
          <p className="text-xs text-[color:var(--fd-muted)]">{t("group_dash_ledger_empty")}</p>
        ) : (
          <>
            <ul className="space-y-2">
              {ledgerPag.slice.map((x) => (
                <li
                  key={x.id}
                  className="flex justify-between gap-2 border-b border-[color:var(--fd-border)] pb-2 last:border-0"
                >
                  <div>
                    <p className="text-xs font-semibold text-[color:var(--fd-text)]">
                      {walletEntryLabel(t, x.entryType)}
                    </p>
                    <p className="text-[10px] text-[color:var(--fd-muted)]">
                      {new Date(x.createdAt).toLocaleString(loc)}
                    </p>
                  </div>
                  <p className="font-mono text-xs font-bold tabular-nums text-[color:var(--fd-primary)]">
                    {Number(x.amount).toFixed(2)} USDT
                  </p>
                </li>
              ))}
            </ul>
            <ListPagination
              page={ledgerPag.page}
              pageSize={ledgerPag.pageSize}
              totalPages={ledgerPag.totalPages}
              total={ledgerPag.total}
              onPageChange={ledgerPag.setPage}
              onPageSizeChange={ledgerPag.setPageSize}
            />
          </>
        )}
      </div>

      {govAudit.length > 0 ? (
        <div className={avecCls.section}>
          <p className={avecCls.sectionTitle}>{t("avec_reports_governance")}</p>
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {govAudit.map((a) => (
              <li key={a.id} className="text-[10px] text-[color:var(--fd-muted)]">
                <span className="font-semibold text-violet-800">
                  {groupAuditLabel(t, a.action)}
                </span>
                {" · "}
                {new Date(a.createdAt).toLocaleString(loc)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {proofs.length > 0 ? (
        <div className={avecCls.section}>
          <p className={avecCls.sectionTitle}>{t("avec_reports_proofs")}</p>
          <ul className="space-y-2">
            {proofs.map((p) => (
              <li key={p.id} className="rounded-xl border border-[color:var(--fd-border)] p-2">
                <p className="text-xs font-semibold">{p.senderEmail}</p>
                <p className="text-[10px] text-[color:var(--fd-muted)]">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {showAudit && audit.length > 0 ? (
        <div className={avecCls.section}>
          <p className={avecCls.sectionTitle}>{t("group_settings_audit_log")}</p>
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {audit.slice(0, 40).map((a) => (
              <li key={a.id} className="text-[10px] text-[color:var(--fd-muted)]">
                <span className="font-semibold text-[color:var(--fd-primary)]">
                  {groupAuditLabel(t, a.action)}
                </span>
                {" · "}
                {new Date(a.createdAt).toLocaleString(loc)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

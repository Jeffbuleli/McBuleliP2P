"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { avecCls } from "@/components/groups/avec-ui";

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

  return (
    <div className="space-y-3">
      <div className={avecCls.section}>
        <p className={avecCls.sectionTitle}>{t("avec_reports_ledger")}</p>
        <p className="mb-2 text-[10px] text-[color:var(--fd-muted)]">{t("avec_reports_ledger_sub")}</p>
        {ledger.length === 0 ? (
          <p className="text-xs text-[color:var(--fd-muted)]">{t("group_dash_ledger_empty")}</p>
        ) : (
          <ul className="space-y-2">
            {ledger.map((x) => (
              <li
                key={x.id}
                className="flex justify-between gap-2 border-b border-[color:var(--fd-border)] pb-2 last:border-0"
              >
                <div>
                  <p className="text-xs font-semibold text-[color:var(--fd-text)]">{x.entryType}</p>
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
        )}
      </div>

      {proofs.length > 0 ? (
        <div className={avecCls.section}>
          <p className={avecCls.sectionTitle}>{t("avec_reports_proofs")}</p>
          <ul className="space-y-2">
            {proofs.map((p) => (
              <li key={p.id} className="rounded-xl border border-[color:var(--fd-border)] p-2">
                <p className="text-xs font-semibold">{p.senderEmail}</p>
                <p className="text-[10px] text-[color:var(--fd-muted)]">{p.body}</p>
                {p.attachmentUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.attachmentUrl} alt="" className="mt-2 max-h-24 rounded-lg" />
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {showAudit && audit.length > 0 ? (
        <div className={avecCls.section}>
          <p className={avecCls.sectionTitle}>{t("group_settings_audit_log")}</p>
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {audit.map((a) => (
              <li key={a.id} className="text-[10px] text-[color:var(--fd-muted)]">
                <span className="font-semibold text-[color:var(--fd-primary)]">{a.action}</span>
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

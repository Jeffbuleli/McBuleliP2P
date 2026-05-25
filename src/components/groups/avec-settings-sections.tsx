"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useI18n } from "@/components/i18n-provider";
import { GroupAuditEntry } from "@/components/groups/group-audit-entry";
import { avecCls } from "@/components/groups/avec-ui";
import { groupRoleLabel } from "@/lib/group-role-label";
import { ListPagination, useListPagination } from "@/components/ui/list-pagination";
import { p2pDisplayName } from "@/lib/p2p-display";
import type { Messages } from "@/i18n/messages";

type Tab = "subscription" | "billing" | "governance" | "audit";

type MemberRow = {
  userId: string;
  role: string;
  status: string;
  email: string;
  displayName?: string | null;
};

function subscriptionLabel(t: (k: keyof Messages) => string, status: string): string {
  const map: Record<string, keyof Messages> = {
    active: "admin_subscription_state_active",
    overdue: "admin_subscription_state_overdue",
    suspended: "admin_subscription_state_suspended",
  };
  const key = map[status?.toLowerCase?.() ?? ""];
  return key ? t(key) : status;
}

export function AvecSettingsSections({
  locale,
  subscriptionStatus,
  nextBillingAt,
  invoices,
  audit,
  approvedMembers,
  canAdmin,
  busy,
  selected,
  onSelectedChange,
  onSaveCoAdmins,
  reminderBlock,
}: {
  locale: string;
  subscriptionStatus: string;
  nextBillingAt: string | null;
  invoices: any[] | null;
  audit: any[] | null;
  approvedMembers: MemberRow[];
  canAdmin: boolean;
  busy: boolean;
  selected: Record<string, boolean>;
  onSelectedChange: (next: Record<string, boolean>) => void;
  onSaveCoAdmins: () => void;
  reminderBlock: ReactNode;
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("subscription");
  const loc = locale === "fr" ? "fr-FR" : "en-US";

  const sortedAudit = useMemo(
    () =>
      [...(audit ?? [])].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [audit],
  );
  const sortedInvoices = useMemo(
    () =>
      [...(invoices ?? [])].sort(
        (a, b) =>
          new Date(b.attemptedAt ?? b.createdAt ?? 0).getTime() -
          new Date(a.attemptedAt ?? a.createdAt ?? 0).getTime(),
      ),
    [invoices],
  );

  const auditPag = useListPagination(sortedAudit, 10);
  const invoicePag = useListPagination(sortedInvoices, 10);

  const tabs: { id: Tab; label: string }[] = [
    { id: "subscription", label: t("group_settings_subscription") },
    { id: "billing", label: t("group_settings_payment_history") },
    ...(canAdmin
      ? [{ id: "governance" as Tab, label: t("group_settings_admin_panel") }]
      : []),
    { id: "audit", label: t("group_settings_audit_log") },
  ];

  const sortedMembers = useMemo(() => {
    const order = (r: string) =>
      r === "admin" ? 0 : r === "co_admin" ? 1 : 2;
    return [...approvedMembers].sort(
      (a, b) => order(a.role) - order(b.role) || a.email.localeCompare(b.email),
    );
  }, [approvedMembers]);

  return (
    <div className="space-y-3">
      {reminderBlock}

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-1 scrollbar-none">
        {tabs.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setTab(x.id)}
            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wide ${
              tab === x.id
                ? "bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]"
                : "text-[color:var(--fd-muted)]"
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      {tab === "subscription" ? (
        <div className={avecCls.section}>
          <p className={avecCls.sectionTitle}>{t("group_settings_subscription")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-[color:var(--fd-mint)] px-2.5 py-0.5 text-[10px] font-bold text-[color:var(--fd-primary)]">
              {subscriptionLabel(t, subscriptionStatus)}
            </span>
            <span className="text-[10px] text-[color:var(--fd-muted)]">
              {t("group_dash_next_billing")}:{" "}
              {nextBillingAt ? new Date(nextBillingAt).toLocaleDateString(loc) : "—"}
            </span>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-[color:var(--fd-muted)]">
            {t("group_settings_subscription_note")}
          </p>
        </div>
      ) : null}

      {tab === "billing" ? (
        <div className={avecCls.section}>
          <p className={avecCls.sectionTitle}>{t("group_settings_payment_history")}</p>
          {invoices === null ? (
            <p className="mt-2 text-[color:var(--fd-muted)]">…</p>
          ) : sortedInvoices.length === 0 ? (
            <p className="mt-2 text-xs text-[color:var(--fd-muted)]">—</p>
          ) : (
            <>
              <ul className="mt-3 max-h-[50vh] space-y-2 overflow-y-auto">
                {invoicePag.slice.map((x: any) => (
                  <li
                    key={x.id}
                    className="rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-[color:var(--fd-text)]">
                        {t("group_invoice_period")}:{" "}
                        <span className="font-mono">{x.period}</span>
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          x.status === "paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {x.status === "paid"
                          ? t("group_invoice_paid")
                          : t("group_invoice_failed")}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[10px] tabular-nums text-[color:var(--fd-primary)]">
                      {Number(x.amountUsdt).toFixed(2)} USDT
                    </p>
                    <p className="mt-1 text-[10px] text-[color:var(--fd-muted)]">
                      {x.attemptedAt
                        ? new Date(x.attemptedAt).toLocaleString(loc)
                        : "—"}
                    </p>
                  </li>
                ))}
              </ul>
              <ListPagination
                page={invoicePag.page}
                pageSize={invoicePag.pageSize}
                totalPages={invoicePag.totalPages}
                total={invoicePag.total}
                onPageChange={invoicePag.setPage}
                onPageSizeChange={invoicePag.setPageSize}
              />
            </>
          )}
        </div>
      ) : null}

      {tab === "governance" ? (
        <div className={avecCls.section}>
          <p className={avecCls.sectionTitle}>{t("group_settings_coadmins_title")}</p>
          {!canAdmin ? (
            <p className="mt-2 text-xs text-[color:var(--fd-muted)]">
              {t("group_settings_admin_only")}
            </p>
          ) : (
            <>
              <p className="mt-1 text-[10px] text-[color:var(--fd-muted)]">
                {t("group_settings_coadmins_note")}
              </p>
              <p className="mt-1 text-[10px] font-semibold text-[color:var(--fd-primary)]">
                {t("group_gov_collective_required_hint")}
              </p>
              <ul className="mt-3 max-h-[40vh] space-y-1.5 overflow-y-auto">
                {sortedMembers.map((m) => {
                  const label = p2pDisplayName({
                    email: m.email,
                    displayName: m.displayName ?? null,
                    avatarUrl: null,
                    piUsername: null,
                  });
                  return (
                    <li key={m.userId}>
                      <label className="flex items-center justify-between gap-2 rounded-xl border border-[color:var(--fd-border)] px-3 py-2.5">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold text-[color:var(--fd-text)]">
                            {label}
                          </span>
                          <span className="text-[10px] font-bold text-[color:var(--fd-primary)]">
                            {groupRoleLabel(t, m.role)}
                          </span>
                        </span>
                        <input
                          type="checkbox"
                          disabled={busy || m.role === "admin"}
                          checked={Boolean(selected[m.userId])}
                          onChange={(e) =>
                            onSelectedChange({
                              ...selected,
                              [m.userId]: e.target.checked,
                            })
                          }
                          className="h-4 w-4 accent-[color:var(--fd-primary)]"
                        />
                      </label>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                disabled={busy}
                onClick={onSaveCoAdmins}
                className={`${avecCls.btnPrimary} mt-3`}
              >
                {t("group_settings_save")}
              </button>
            </>
          )}
        </div>
      ) : null}

      {tab === "audit" ? (
        <div className={avecCls.section}>
          <p className={avecCls.sectionTitle}>{t("group_settings_audit_log")}</p>
          <p className="text-[10px] text-[color:var(--fd-muted)]">
            {t("group_settings_audit_sort")}
          </p>
          {audit === null ? (
            <p className="mt-2 text-[color:var(--fd-muted)]">…</p>
          ) : sortedAudit.length === 0 ? (
            <p className="mt-2 text-xs text-[color:var(--fd-muted)]">—</p>
          ) : (
            <>
              <ul className="mt-3 max-h-[50vh] space-y-2 overflow-y-auto">
                {auditPag.slice.map((x: any) => (
                  <GroupAuditEntry
                    key={x.id}
                    action={x.action}
                    createdAt={x.createdAt}
                    locale={locale}
                    variant="fd"
                  />
                ))}
              </ul>
              <ListPagination
                page={auditPag.page}
                pageSize={auditPag.pageSize}
                totalPages={auditPag.totalPages}
                total={auditPag.total}
                onPageChange={auditPag.setPage}
                onPageSizeChange={auditPag.setPageSize}
              />
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

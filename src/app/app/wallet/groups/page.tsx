"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { AvecListMark } from "@/components/groups/avec-icons";
import { GroupStatusBadge } from "@/components/groups/group-status-badge";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import { clientErrorText } from "@/lib/client-error-text";

type Row = {
  groupId: string;
  name: string;
  type: string;
  status: string;
  subscriptionStatus: string;
  nextBillingAt: string | null;
  role: string;
  membershipStatus: string;
  createdAt: string;
};

export default function AvecHubPage() {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setErr(null);
    void (async () => {
      const res = await fetch("/api/groups/mine", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error ?? "…");
        setRows([]);
        return;
      }
      setRows((data.groups ?? []) as Row[]);
    })();
  }, []);

  const loc = locale === "fr" ? "fr-FR" : "en-US";

  return (
    <div className="space-y-3 pb-8">
      <WalletSubpageHeader
        title={t("group_hub_title")}
        subtitle={t("group_hub_sub")}
        action={
          <Link
            href="/app/wallet/groups/new"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--fd-primary)] text-lg font-bold text-white shadow-md active:scale-95"
            aria-label={t("group_hub_create")}
          >
            +
          </Link>
        }
      />

      {err ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {clientErrorText(t, err)}
        </p>
      ) : null}

      {rows === null ? (
        <p className="text-[color:var(--fd-muted)]">…</p>
      ) : rows.length === 0 ? (
        <div className="fd-card flex flex-col items-center gap-3 p-8 text-center">
          <AvecListMark className="h-14 w-14" />
          <p className="text-sm font-bold text-[color:var(--fd-text)]">{t("group_hub_empty")}</p>
          <p className="max-w-xs text-[11px] leading-relaxed text-[color:var(--fd-muted)]">
            {t("group_hub_empty_hint")}
          </p>
          <Link href="/app/wallet/groups/new" className="mt-1 text-sm font-bold text-[color:var(--fd-primary)]">
            {t("group_hub_create")} →
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.groupId}>
              <Link
                href={`/app/wallet/groups/${r.groupId}`}
                className="fd-card block p-3.5 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <AvecListMark />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[color:var(--fd-text)]">{r.name}</p>
                    <p className="mt-0.5 text-[10px] text-[color:var(--fd-muted)]">
                      {r.role}
                      {r.nextBillingAt
                        ? ` · ${new Date(r.nextBillingAt).toLocaleDateString(loc)}`
                        : ""}
                    </p>
                  </div>
                  <GroupStatusBadge status={r.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

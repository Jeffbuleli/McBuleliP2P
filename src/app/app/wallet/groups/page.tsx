"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
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

export default function GroupsHubPage() {
  const { t } = useI18n();
  const sp = useSearchParams();
  const typeFilter = (sp.get("type") ?? "").trim();
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

  const filtered = useMemo(() => {
    const base = rows ?? [];
    if (!typeFilter) return base;
    return base.filter((r) => r.type === typeFilter);
  }, [rows, typeFilter]);

  const hubTitle =
    typeFilter === "likelimba"
      ? t("group_like_title")
      : typeFilter === "avec"
        ? t("group_avec_title")
        : t("group_hub_title");

  return (
    <div className="space-y-3 pb-8">
      <WalletSubpageHeader
        title={hubTitle}
        subtitle={t("group_hub_sub")}
        action={
          <Link
            href="/app/wallet/groups/new"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 text-xl font-bold text-white shadow-md active:scale-95"
            aria-label={t("group_hub_create")}
          >
            +
          </Link>
        }
      />

      {err ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950/50 dark:text-rose-200">
          {clientErrorText(t, err)}
        </p>
      ) : null}

      {rows === null ? (
        <p className="text-stone-500">…</p>
      ) : filtered.length === 0 ? (
        <div className="fd-card p-6 text-center">
          <p className="text-3xl" aria-hidden>
            {typeFilter === "avec" ? "👥" : "🤝"}
          </p>
          <p className="mt-2 text-sm font-semibold text-[color:var(--fd-text)]">
            {t("group_hub_empty")}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((r) => (
            <li key={r.groupId}>
              <Link
                href={`/app/wallet/groups/${r.groupId}`}
                className="fd-card block p-3.5 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-50 text-lg">
                    {r.type === "avec" ? "👥" : "🤝"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[color:var(--fd-text)]">
                      {r.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[color:var(--fd-muted)]">
                      {r.nextBillingAt
                        ? new Date(r.nextBillingAt).toLocaleDateString()
                        : "—"}
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


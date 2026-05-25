"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { AvecListMark } from "@/components/groups/avec-icons";
import { GroupStatusBadge } from "@/components/groups/group-status-badge";
import {
  AvecDiscoverSheet,
  type DiscoverGroup,
} from "@/components/groups/avec-discover-sheet";
import { AvecProgressRing } from "@/components/groups/avec-charts";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import { ListPagination, useListPagination } from "@/components/ui/list-pagination";
import { clientErrorText } from "@/lib/client-error-text";
import { groupRoleLabel } from "@/lib/group-role-label";
import { countryShortLabel } from "@/lib/country-label";
import { McBuleliPoweredFooter } from "@/components/brand/mcbuleli-powered-footer";
import { AvecHelpSheet, AvecHelpTrigger } from "@/components/groups/avec-help-sheet";

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
  logoUrl?: string | null;
  countryCode?: string | null;
  maxMembers?: number;
  memberCount?: number;
  isCreator?: boolean;
};

export default function AvecHubPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [discover, setDiscover] = useState<DiscoverGroup[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [sheetGroup, setSheetGroup] = useState<DiscoverGroup | null>(null);

  useEffect(() => {
    setErr(null);
    void (async () => {
      const [mineRes, discRes] = await Promise.all([
        fetch("/api/groups/mine", { cache: "no-store" }),
        fetch("/api/groups/discover", { cache: "no-store" }),
      ]);
      const mineData = await mineRes.json().catch(() => ({}));
      if (!mineRes.ok) {
        setErr(mineData.error ?? "group_dashboard_failed");
        setRows([]);
      } else {
        const all = (mineData.groups ?? []) as Row[];
        setRows(
          all.filter((r) => r.type === "avec" || r.type === "likelimba"),
        );
      }
      const discData = await discRes.json().catch(() => ({}));
      if (discRes.ok) {
        setDiscover((discData.groups ?? []) as DiscoverGroup[]);
      } else {
        setDiscover([]);
      }
    })();
  }, []);

  const minePag = useListPagination(rows ?? [], 10);
  const discoverPag = useListPagination(discover ?? [], 10);
  const loc = locale === "fr" ? "fr-FR" : "en-US";

  const mineSlice = useMemo(() => minePag.slice, [minePag.slice]);

  return (
    <div className="space-y-4 pb-8">
      <WalletSubpageHeader
        title={t("group_hub_title")}
        subtitle={t("group_hub_sub")}
        badge={<AvecHelpTrigger onClick={() => setHelpOpen(true)} />}
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

      <section className="space-y-2">
        <h2 className="px-0.5 text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {t("group_hub_mine_title")}
        </h2>

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
          <>
            <ul className="space-y-2">
              {mineSlice.map((r) => (
                <li key={r.groupId}>
                  <Link
                    href={`/app/wallet/groups/${r.groupId}`}
                    className="fd-card block p-3.5 active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      {r.logoUrl ? (
                        <span className="flex h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[color:var(--fd-border)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={r.logoUrl} alt="" className="h-full w-full object-cover" />
                        </span>
                      ) : (
                        <AvecListMark />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[color:var(--fd-text)]">
                          {r.name}
                          {r.isCreator ? (
                            <span className="ml-1.5 text-[9px] font-bold uppercase text-[color:var(--fd-primary)]">
                              · {t("group_hub_creator_badge")}
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[color:var(--fd-muted)]">
                          {groupRoleLabel(t, r.role)}
                          {r.countryCode
                            ? ` · ${countryShortLabel(locale, r.countryCode)}`
                            : ""}
                          {r.nextBillingAt
                            ? ` · ${new Date(r.nextBillingAt).toLocaleDateString(loc)}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        {r.maxMembers != null && r.memberCount != null ? (
                          <div className="flex flex-col items-center">
                            <AvecProgressRing
                              value={r.memberCount}
                              max={r.maxMembers}
                              size={36}
                              strokeWidth={4}
                            />
                            <span className="text-[8px] font-bold tabular-nums text-[color:var(--fd-muted)]">
                              {r.memberCount}/{r.maxMembers}
                            </span>
                          </div>
                        ) : null}
                        <GroupStatusBadge status={r.status} />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <ListPagination
              page={minePag.page}
              pageSize={minePag.pageSize}
              totalPages={minePag.totalPages}
              total={minePag.total}
              onPageChange={minePag.setPage}
              onPageSizeChange={minePag.setPageSize}
            />
          </>
        )}
      </section>

      <section className="space-y-2 border-t border-[color:var(--fd-border)] pt-4">
        <h2 className="px-0.5 text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {t("group_discover_title")}
        </h2>
        <p className="px-0.5 text-[11px] leading-snug text-[color:var(--fd-muted)]">
          {t("group_discover_sub")}
        </p>

        {discover === null ? (
          <p className="text-[color:var(--fd-muted)]">…</p>
        ) : discover.length === 0 ? (
          <p className="fd-card px-3 py-4 text-center text-xs text-[color:var(--fd-muted)]">
            {t("group_discover_empty")}
          </p>
        ) : (
          <>
            <ul className="space-y-2">
              {discoverPag.slice.map((g) => {
                const region = g.countryCode
                  ? countryShortLabel(locale, g.countryCode)
                  : "";
                return (
                  <li key={g.groupId}>
                    <button
                      type="button"
                      onClick={() => setSheetGroup(g)}
                      className="fd-card w-full p-3.5 text-left active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        {g.logoUrl ? (
                          <span className="flex h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[color:var(--fd-border)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={g.logoUrl} alt="" className="h-full w-full object-cover" />
                          </span>
                        ) : (
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--fd-mint)] text-xs font-black text-[color:var(--fd-primary)]">
                            {g.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-[color:var(--fd-text)]">
                            {g.name}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-[color:var(--fd-muted)]">
                            {region || t("group_discover_location_fallback")}
                            {g.memberCount != null
                              ? ` · ${g.memberCount}/${g.maxMembers}`
                              : ""}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-[color:var(--fd-primary)] px-3 py-1.5 text-[10px] font-bold text-white">
                          {t("group_discover_cta")}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            <ListPagination
              page={discoverPag.page}
              pageSize={discoverPag.pageSize}
              totalPages={discoverPag.totalPages}
              total={discoverPag.total}
              onPageChange={discoverPag.setPage}
              onPageSizeChange={discoverPag.setPageSize}
            />
          </>
        )}
      </section>

      <McBuleliPoweredFooter />
      <AvecHelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
      {sheetGroup ? (
        <AvecDiscoverSheet
          group={sheetGroup}
          onClose={() => setSheetGroup(null)}
          onJoined={(gid) => router.push(`/app/wallet/groups/${gid}`)}
        />
      ) : null}
    </div>
  );
}

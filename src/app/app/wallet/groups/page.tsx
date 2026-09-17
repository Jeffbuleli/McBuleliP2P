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
import { avecCls } from "@/components/groups/avec-ui";
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

function HubAvatar({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl?: string | null;
}) {
  if (logoUrl) {
    return (
      <span className={avecCls.hubAvatar}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <span className={avecCls.hubAvatar}>{name.slice(0, 2).toUpperCase()}</span>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
    <div className="mx-auto w-full max-w-lg space-y-5 pb-8 md:max-w-3xl lg:max-w-5xl">
      <WalletSubpageHeader
        title={t("group_hub_title")}
        subtitle={t("group_hub_sub")}
        backHref="/app"
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

      <section className="space-y-2.5">
        <div className="flex items-end justify-between gap-2 px-0.5">
          <h2 className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
            {t("group_hub_mine_title")}
          </h2>
          {rows && rows.length > 0 ? (
            <span className="text-[10px] font-bold tabular-nums text-[color:var(--fd-primary)]">
              {rows.length}
            </span>
          ) : null}
        </div>

        {rows === null ? (
          <p className="text-[color:var(--fd-muted)]">…</p>
        ) : rows.length === 0 ? (
          <div className="fd-card flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[color:var(--fd-primary)]/25 bg-gradient-to-b from-[color:var(--fd-mint)]/40 to-[color:var(--fd-card)] p-8 text-center">
            <AvecListMark className="h-14 w-14 text-[color:var(--fd-primary)]" />
            <p className="text-sm font-bold text-[color:var(--fd-text)]">{t("group_hub_empty")}</p>
            <p className="max-w-xs text-[11px] leading-relaxed text-[color:var(--fd-muted)]">
              {t("group_hub_empty_hint")}
            </p>
            <Link
              href="/app/wallet/groups/new"
              className="mt-1 rounded-full bg-[color:var(--fd-primary)] px-4 py-2 text-sm font-bold text-white shadow-sm"
            >
              {t("group_hub_create")}
            </Link>
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {mineSlice.map((r) => {
                const region = r.countryCode
                  ? countryShortLabel(locale, r.countryCode)
                  : "";
                const actionLabel =
                  r.membershipStatus === "pending"
                    ? t("group_hub_action_pending")
                    : r.status === "active"
                      ? t("group_hub_action_open")
                      : t("group_hub_action_review");
                const membersLabel =
                  r.maxMembers != null && r.memberCount != null
                    ? `${r.memberCount}/${r.maxMembers}`
                    : null;

                return (
                  <li key={r.groupId}>
                    <Link
                      href={`/app/wallet/groups/${r.groupId}`}
                      className={avecCls.hubCard}
                    >
                      <div className={avecCls.hubCardBody}>
                        <HubAvatar name={r.name} logoUrl={r.logoUrl} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate text-[15px] font-extrabold tracking-tight text-[color:var(--fd-text)]">
                              {r.name}
                            </p>
                            {r.isCreator ? (
                              <span className={avecCls.hubChip}>
                                {t("group_hub_creator_badge")}
                              </span>
                            ) : null}
                          </div>
                          <div className={avecCls.hubCardMeta}>
                            <span className={avecCls.hubChip}>
                              {groupRoleLabel(t, r.role)}
                            </span>
                            {region ? <span>· {region}</span> : null}
                            {r.nextBillingAt ? (
                              <span>
                                · {new Date(r.nextBillingAt).toLocaleDateString(loc)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          {membersLabel ? (
                            <div className="flex flex-col items-center">
                              <AvecProgressRing
                                value={r.memberCount ?? 0}
                                max={r.maxMembers ?? 1}
                                size={40}
                                strokeWidth={4}
                              />
                              <span className="mt-0.5 text-[8px] font-bold tabular-nums text-[color:var(--fd-muted)]">
                                {membersLabel}
                              </span>
                            </div>
                          ) : null}
                          <GroupStatusBadge status={r.status} />
                        </div>
                      </div>
                      <div className={avecCls.hubCardFoot}>
                        <span className="text-[11px] font-bold text-[color:var(--fd-primary)]">
                          {actionLabel}
                        </span>
                        <span className="text-[color:var(--fd-primary)]">
                          <ChevronRight />
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
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

      <section className="space-y-2.5 border-t border-[color:var(--fd-border)] pt-5">
        <h2 className="px-0.5 text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {t("group_discover_title")}
        </h2>
        <p className="px-0.5 text-[11px] leading-snug text-[color:var(--fd-muted)]">
          {t("group_discover_sub")}
        </p>

        {discover === null ? (
          <p className="text-[color:var(--fd-muted)]">…</p>
        ) : discover.length === 0 ? (
          <p className="fd-card rounded-2xl px-3 py-5 text-center text-xs text-[color:var(--fd-muted)]">
            {t("group_discover_empty")}
          </p>
        ) : (
          <>
            <ul className="space-y-3">
              {discoverPag.slice.map((g) => {
                const region = g.countryCode
                  ? countryShortLabel(locale, g.countryCode)
                  : t("group_discover_location_fallback");
                const membersLabel =
                  g.memberCount != null
                    ? `${g.memberCount}/${g.maxMembers}`
                    : null;

                return (
                  <li key={g.groupId}>
                    <button
                      type="button"
                      onClick={() => setSheetGroup(g)}
                      className={`${avecCls.hubCard} w-full text-left`}
                    >
                      <div className={avecCls.hubCardBody}>
                        <HubAvatar name={g.name} logoUrl={g.logoUrl} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-extrabold tracking-tight text-[color:var(--fd-text)]">
                            {g.name}
                          </p>
                          <div className={avecCls.hubCardMeta}>
                            <span>{region}</span>
                            {membersLabel ? (
                              <span className={avecCls.hubChip}>{membersLabel}</span>
                            ) : null}
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full bg-[color:var(--fd-primary)] px-3.5 py-2 text-[10px] font-bold text-white shadow-sm">
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

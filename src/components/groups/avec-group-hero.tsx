"use client";

import { useI18n } from "@/components/i18n-provider";
import { AvecProgressRing } from "@/components/groups/avec-charts";
import { GroupStatusBadge } from "@/components/groups/group-status-badge";
import { countryShortLabel } from "@/lib/country-label";
import { avecCls } from "@/components/groups/avec-ui";

export function AvecGroupHero({
  name,
  logoUrl,
  countryCode,
  address,
  publicDescription,
  status,
  memberCount,
  maxMembers,
  minMembers,
  shareValueUsdt,
  meetingIntervalDays,
  cycleNumber,
}: {
  name: string;
  logoUrl: string | null;
  countryCode?: string | null;
  address?: string | null;
  publicDescription?: string | null;
  status: string;
  memberCount: number;
  maxMembers: number;
  minMembers?: number;
  shareValueUsdt: number;
  meetingIntervalDays: number;
  cycleNumber?: number;
}) {
  const { t, locale } = useI18n();
  const region = countryCode ? countryShortLabel(locale, countryCode) : "";
  const location = [region, address?.trim()].filter(Boolean).join(" · ");

  return (
    <div className={`${avecCls.section} space-y-3`}>
      <div className="flex items-start gap-3">
        {logoUrl ? (
          <span className="flex h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="" className="h-full w-full object-cover" />
          </span>
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--fd-primary)]/25 bg-[color:var(--fd-mint)] text-sm font-black text-[color:var(--fd-primary)]">
            {name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-extrabold text-[color:var(--fd-text)]">{name}</p>
            <GroupStatusBadge status={status} />
          </div>
          {location ? (
            <p className="mt-0.5 text-[10px] font-medium text-[color:var(--fd-muted)]">{location}</p>
          ) : null}
          {publicDescription ? (
            <p className="mt-1.5 text-xs leading-snug text-[color:var(--fd-text)]/85">
              {publicDescription}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] py-2.5">
          <AvecProgressRing value={memberCount} max={maxMembers} size={56} strokeWidth={7} />
          <p className="mt-1 text-lg font-black tabular-nums text-[color:var(--fd-text)]">
            {memberCount}
            <span className="text-[10px] font-semibold text-[color:var(--fd-muted)]">
              /{maxMembers}
            </span>
          </p>
          <p className="text-[9px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
            {t("avec_vue_members")}
          </p>
          {minMembers != null && memberCount < minMembers ? (
            <p className="mt-0.5 text-[8px] text-amber-800">{t("avec_hero_min_members", { min: minMembers })}</p>
          ) : null}
        </div>

        <div className="flex flex-col justify-center rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-2 py-2.5 text-center">
          <p className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("group_field_share_value")}
          </p>
          <p className="mt-0.5 text-sm font-black tabular-nums text-[color:var(--fd-primary)]">
            {shareValueUsdt.toFixed(0)}
            <span className="text-[10px]"> USDT</span>
          </p>
        </div>

        <div className="flex flex-col justify-center rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-2 py-2.5 text-center">
          <p className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("group_field_meeting_days")}
          </p>
          <p className="mt-0.5 text-sm font-black tabular-nums text-[color:var(--fd-text)]">
            {meetingIntervalDays}j
          </p>
          {cycleNumber != null ? (
            <p className="text-[8px] text-[color:var(--fd-muted)]">
              {t("avec_vue_cycle")} #{cycleNumber}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

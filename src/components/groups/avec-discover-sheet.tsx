"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { countryShortLabel } from "@/lib/country-label";
import { clientErrorText } from "@/lib/client-error-text";
import { AvecProgressRing } from "@/components/groups/avec-charts";

export type DiscoverGroup = {
  groupId: string;
  name: string;
  logoUrl: string | null;
  countryCode: string | null;
  address: string | null;
  publicDescription: string | null;
  maxMembers: number;
  memberCount: number;
  shareValueUsdt: number;
  inviteCode: string | null;
  joinHref: string | null;
};

export function AvecDiscoverSheet({
  group,
  onClose,
  onJoined,
}: {
  group: DiscoverGroup;
  onClose: () => void;
  onJoined?: (groupId: string) => void;
}) {
  const { t, locale } = useI18n();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const region = group.countryCode ? countryShortLabel(locale, group.countryCode) : "";
  const location = [region, group.address?.trim()].filter(Boolean).join(" · ");

  async function requestJoin() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/groups/${group.groupId}/members`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      onJoined?.(group.groupId);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
      role="dialog"
      aria-modal
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          {group.logoUrl ? (
            <span className="flex h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[color:var(--fd-border)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={group.logoUrl} alt="" className="h-full w-full object-cover" />
            </span>
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[color:var(--fd-mint)] text-xs font-black text-[color:var(--fd-primary)]">
              {group.name.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[color:var(--fd-text)]">{group.name}</p>
            {location ? (
              <p className="mt-0.5 text-[10px] text-[color:var(--fd-muted)]">{location}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-lg leading-none text-[color:var(--fd-muted)]"
            aria-label={t("group_discover_close")}
          >
            ×
          </button>
        </div>

        <div className="mt-3 flex items-center justify-center gap-4">
          <AvecProgressRing value={group.memberCount} max={group.maxMembers} size={52} />
          <div className="text-center">
            <p className="text-lg font-black tabular-nums">
              {group.memberCount}/{group.maxMembers}
            </p>
            <p className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
              {t("avec_vue_members")}
            </p>
          </div>
          <p className="text-[10px] text-[color:var(--fd-muted)]">
            {t("group_field_share_value")}: {group.shareValueUsdt.toFixed(0)} USDT
          </p>
        </div>

        <div className="mt-3 rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-bg)] px-3 py-2.5">
          <p className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("group_discover_about")}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[color:var(--fd-text)]">
            {group.publicDescription?.trim() || t("group_discover_no_description")}
          </p>
        </div>

        {err ? (
          <p className="mt-2 text-xs text-rose-700">{clientErrorText(t, err)}</p>
        ) : null}

        <div className="mt-4 flex flex-col gap-2">
          {group.joinHref ? (
            <Link
              href={group.joinHref}
              className="w-full rounded-xl bg-[color:var(--fd-primary)] py-3 text-center text-sm font-bold text-white"
            >
              {t("group_discover_join_link")}
            </Link>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => void requestJoin()}
            className="w-full rounded-xl border-2 border-[color:var(--fd-primary)] py-3 text-sm font-bold text-[color:var(--fd-primary)] disabled:opacity-50"
          >
            {t("group_discover_request_join")}
          </button>
        </div>
      </div>
    </div>
  );
}

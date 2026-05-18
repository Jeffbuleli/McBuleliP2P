"use client";

import { CopyValueButton } from "@/components/profile/profile-id-copy";
import { profileChipClass, type ProfileChipTone } from "@/components/profile/profile-vibrant-styles";

type ReferralData = {
  code: string;
  linkPath: string;
  inviteLinkFull: string;
  referralBalanceUsdt: number;
  inviteCount: number;
  totalEarnedUsdt: number;
};

export function ProfileReferralsView({
  referral,
  locale,
  labels,
}: {
  referral: ReferralData;
  locale: "en" | "fr";
  labels: {
    balance: string;
    invited: string;
    earned: string;
    code: string;
    link: string;
    note: string;
    copy: string;
    copied: string;
    shareHint: string;
  };
}) {
  const fmt = (n: number) =>
    n.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
      maximumFractionDigits: 2,
    });

  return (
    <div className="space-y-3">
      <section className="fd-card fd-card-glow-amber overflow-hidden p-0">
        <div className="flex items-center gap-3 bg-gradient-to-r from-[#fff7ed] to-[#ffedd5] px-4 py-4">
          <span
            className={`${profileChipClass.amber} flex h-12 w-12 shrink-0 items-center justify-center`}
          >
            <GiftIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1c1917]">{labels.shareHint}</p>
            <p className="mt-0.5 text-xs font-medium text-[var(--fd-muted)]">{labels.note}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2.5">
        <StatTile tone="forest" label={labels.balance} value={fmt(referral.referralBalanceUsdt)} suffix="USDT" />
        <StatTile tone="amber" label={labels.invited} value={String(referral.inviteCount)} />
        <StatTile
          tone="copper"
          label={labels.earned}
          value={fmt(referral.totalEarnedUsdt)}
          suffix="USDT"
          className="col-span-2"
        />
      </div>

      <CopyCard label={labels.code} value={referral.code} copy={labels.copy} copied={labels.copied} mono />
      <CopyCard
        label={labels.link}
        value={referral.inviteLinkFull || referral.linkPath}
        copy={labels.copy}
        copied={labels.copied}
        small
      />
    </div>
  );
}

function StatTile({
  tone,
  label,
  value,
  suffix,
  className = "",
}: {
  tone: ProfileChipTone;
  label: string;
  value: string;
  suffix?: string;
  className?: string;
}) {
  return (
    <div className={`fd-card p-3 ${className}`}>
      <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--fd-muted)]">{label}</p>
      <p className="mt-1.5 text-lg font-bold tabular-nums tracking-tight text-[#1c1917]">
        {value}
        {suffix ? (
          <span className="ml-1 text-xs font-semibold text-[var(--fd-muted)]">{suffix}</span>
        ) : null}
      </p>
      <span className={`${profileChipClass[tone]} mt-2 inline-flex h-1.5 w-8 rounded-full`} aria-hidden />
    </div>
  );
}

function CopyCard({
  label,
  value,
  copy,
  copied,
  mono,
  small,
}: {
  label: string;
  value: string;
  copy: string;
  copied: string;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <div className="fd-card flex items-center gap-3 p-3">
      <span className={`${profileChipClass.sky} flex h-10 w-10 shrink-0 items-center justify-center`}>
        <LinkIcon />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--fd-muted)]">{label}</p>
        <p
          className={`mt-0.5 truncate font-bold text-[#1c1917] ${mono ? "font-mono text-sm" : small ? "text-[11px] font-medium" : "text-sm"}`}
          title={value}
        >
          {value}
        </p>
      </div>
      <CopyValueButton value={value} copyLabel={copy} copiedLabel={copied} variant="light" />
    </div>
  );
}

function GiftIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 12v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8M4 8h16M12 8v12M8 8c0-2 1.5-4 4-4s4 2 4 4M16 8c0-2-1.5-4-4-4s-4 2-4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 13a5 5 0 007.07 0l1.41-1.41a5 5 0 00-7.07-7.07L10 5M14 11a5 5 0 00-7.07 0L5.52 12.41a5 5 0 007.07 7.07L14 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

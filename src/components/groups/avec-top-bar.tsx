"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { countryShortLabel } from "@/lib/country-label";
import { p2pDisplayName } from "@/lib/p2p-display";
import { KycVerifiedBadge } from "@/components/kyc/kyc-verified-badge";

export function AvecTopBar({
  groupName,
  groupLogoUrl,
  countryCode,
  memberEmail,
  memberDisplayName,
  memberPiUsername,
  memberKycApproved,
  backHref,
}: {
  groupName: string;
  groupLogoUrl: string | null;
  countryCode?: string | null;
  memberEmail: string;
  memberDisplayName?: string | null;
  memberPiUsername?: string | null;
  memberKycApproved?: boolean;
  backHref?: string;
}) {
  const { t, locale } = useI18n();
  const pseudo = p2pDisplayName({
    email: memberEmail,
    displayName: memberDisplayName ?? null,
    avatarUrl: null,
    piUsername: memberPiUsername ?? null,
  });
  const region = countryCode ? countryShortLabel(locale, countryCode) : "";

  return (
    <header className="fd-app-topbar sticky top-0 z-20 mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 py-2">
      <div className="min-w-0 justify-self-start">
        <p className="truncate text-sm font-extrabold leading-tight text-[color:var(--fd-text)]">
          {groupName}
        </p>
        {region ? (
          <p className="mt-0.5 truncate text-[10px] font-medium text-[color:var(--fd-muted)]">
            {region}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 justify-center">
        {groupLogoUrl ? (
          <span className="flex h-11 w-11 overflow-hidden rounded-full border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={groupLogoUrl} alt="" className="h-full w-full object-cover" />
          </span>
        ) : (
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--fd-primary)]/25 bg-[color:var(--fd-mint)] text-xs font-black text-[color:var(--fd-primary)]">
            {groupName.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-col items-end justify-self-end gap-1">
        <p className="flex max-w-[9rem] items-center justify-end gap-1 truncate text-right text-xs font-bold text-[color:var(--fd-text)]">
          <span className="truncate">{pseudo}</span>
          {memberKycApproved ? <KycVerifiedBadge compact /> : null}
        </p>
        <Link
          href={backHref ?? "/app/wallet/groups"}
          className="rounded-lg border border-[color:var(--fd-border)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--fd-primary)]"
        >
          {t("group_back")}
        </Link>
      </div>
    </header>
  );
}

/** @deprecated Brand chip — kept for rare embeds; AVEC pages use group layout only. */
export function AvecBrandMark() {
  const { t } = useI18n();
  return (
    <Link href="/app" className="flex items-center gap-2" aria-label={t("brand")}>
      <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[color:var(--fd-primary)]/25 bg-[color:var(--fd-mint)]">
        <Image src="/brand/logo.png" alt="" width={24} height={24} className="h-6 w-6 object-contain" unoptimized />
      </span>
    </Link>
  );
}

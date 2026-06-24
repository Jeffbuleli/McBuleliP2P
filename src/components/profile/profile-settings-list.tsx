"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import { IconBell } from "@/components/icons/flow-icons";
import {
  ProfileIconAcademy,
  ProfileIconCard,
  ProfileIconChevronRight,
  ProfileIconCommunity,
  ProfileIconGear,
  ProfileIconGift,
  ProfileIconLogout,
  ProfileIconMerchant,
  ProfileIconOps,
  ProfileIconPi,
  ProfileIconShield,
  ProfileIconShieldCheck,
} from "@/components/icons/profile-icons";
import { profileChipClass, type ProfileChipTone } from "@/components/profile/profile-vibrant-styles";
import { useI18n } from "@/components/i18n-provider";
import { profileKycBadgeText } from "@/lib/profile-kyc-label";
import { isKycApproved } from "@/lib/kyc-policy";

type BadgeTone = "ok" | "warn" | "muted" | "rose";

function StatusBadge({ children, tone }: { children: ReactNode; tone: BadgeTone }) {
  const cls =
    tone === "ok"
      ? "fd-pill-ok"
      : tone === "warn"
        ? "fd-pill-warn"
        : tone === "rose"
          ? "bg-rose-100 text-rose-800"
          : "fd-pill-muted";
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>
      {children}
    </span>
  );
}

function SettingsRow({
  href,
  icon,
  tone,
  title,
  subtitle,
  badge,
  badgeTone,
}: {
  href: string;
  icon: ReactNode;
  tone: ProfileChipTone;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeTone?: BadgeTone;
}) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3.5 px-4 py-3.5 active:bg-[rgba(74,103,79,0.06)]">
        <span className={`${profileChipClass[tone]} flex h-10 w-10 shrink-0 items-center justify-center`}>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight text-[#1c1917]">{title}</p>
          {subtitle ? (
            <p className="mt-0.5 truncate text-[11px] leading-snug text-[var(--fd-muted)]">{subtitle}</p>
          ) : null}
        </div>
        {badge ? <StatusBadge tone={badgeTone ?? "muted"}>{badge}</StatusBadge> : null}
        <ProfileIconChevronRight />
      </Link>
    </li>
  );
}

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="fd-card overflow-hidden p-0">
      <p className="border-b border-[var(--fd-border)] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--fd-muted)]">
        {title}
      </p>
      <ul className="divide-y divide-[var(--fd-border)]">{children}</ul>
    </section>
  );
}

export type ProfileHubMeta = {
  userId: string;
  kycStatus: string;
  referralBalanceUsdt: number;
  paymentMethodsCount: number;
  communityHandle: string | null;
  piLinked: boolean;
};

export function ProfileSettingsList({
  meta,
  showAdmin,
}: {
  meta: ProfileHubMeta;
  showAdmin: boolean;
}) {
  const { t } = useI18n();

  const kycApproved = isKycApproved(meta.kycStatus);
  const kycPending = ["pending", "manual_review"].includes(
    (meta.kycStatus ?? "none").toLowerCase(),
  );
  const kycRejected = (meta.kycStatus ?? "none").toLowerCase() === "rejected";

  const kycBadgeTone: BadgeTone = kycApproved
    ? "ok"
    : kycPending
      ? "warn"
      : kycRejected
        ? "rose"
        : "muted";

  const kycBadgeShort = kycApproved
    ? t("profile_status_verified")
    : kycPending
      ? t("profile_status_pending")
      : kycRejected
        ? t("profile_kyc_rejected")
        : t("profile_status_off");

  const paymentBadge =
    meta.paymentMethodsCount > 0
      ? t("profile_status_active_count", { count: meta.paymentMethodsCount })
      : t("profile_status_add");

  const referralBadge =
    meta.referralBalanceUsdt > 0
      ? `${meta.referralBalanceUsdt.toFixed(2)} USDT`
      : undefined;

  const   communityHref = meta.communityHandle
    ? `/app/community/u/${meta.communityHandle}`
    : "/app/profile/settings";

  const communitySubtitle = meta.communityHandle
    ? `@${meta.communityHandle}`
    : t("profile_row_community_setup");

  return (
    <div className="space-y-3">
      <SettingsSection title={t("profile_section_account")}>
        <SettingsRow
          href="/app/profile/kyc"
          icon={<ProfileIconShieldCheck />}
          tone="forest"
          title={t("profile_row_identity")}
          subtitle={profileKycBadgeText(t, meta.kycStatus)}
          badge={kycBadgeShort}
          badgeTone={kycBadgeTone}
        />
        <SettingsRow
          href="/app/profile/security"
          icon={<ProfileIconShield />}
          tone="forest"
          title={t("profile_security_heading")}
          subtitle={t("profile_secure_cta")}
        />
        <SettingsRow
          href="/app/profile/payments"
          icon={<ProfileIconCard />}
          tone="sky"
          title={t("profile_tile_payments")}
          subtitle={t("profile_tile_payments_sub")}
          badge={paymentBadge}
          badgeTone={meta.paymentMethodsCount > 0 ? "ok" : "muted"}
        />
        <SettingsRow
          href="/app/profile/addresses"
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M7 10h4M7 14h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          }
          tone="mint"
          title={t("profile_row_addresses")}
          subtitle={t("profile_row_addresses_sub")}
        />
        <SettingsRow
          href="/app/profile/referrals"
          icon={<ProfileIconGift />}
          tone="amber"
          title={t("profile_referral_title")}
          subtitle={t("profile_tile_invite_sub")}
          badge={referralBadge}
          badgeTone="ok"
        />
        <SettingsRow
          href="/app/profile/settings"
          icon={<ProfileIconGear />}
          tone="forest"
          title={t("profile_tile_settings")}
          subtitle={t("profile_settings_sub")}
        />
        <SettingsRow
          href="/app/profile/preferences"
          icon={<IconBell className="h-5 w-5" />}
          tone="amber"
          title={t("profile_preferences_heading")}
          subtitle={t("profile_preferences_sub")}
        />
        <SettingsRow
          href="/app/profile/privacy"
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" stroke="currentColor" strokeWidth="2" />
            </svg>
          }
          tone="forest"
          title={t("profile_privacy_title")}
          subtitle={t("profile_privacy_sub")}
        />
      </SettingsSection>

      <SettingsSection title={t("profile_section_trading")}>
        <SettingsRow
          href={`/app/p2p/merchant/${meta.userId}`}
          icon={<ProfileIconMerchant />}
          tone="mint"
          title={t("profile_row_merchant")}
          subtitle={t("profile_row_merchant_sub")}
        />
        <SettingsRow
          href={communityHref}
          icon={<ProfileIconCommunity />}
          tone="sky"
          title={t("profile_row_community")}
          subtitle={communitySubtitle}
        />
        <SettingsRow
          href="/app/academy"
          icon={<ProfileIconAcademy />}
          tone="forest"
          title={t("profile_tile_academy")}
        />
      </SettingsSection>

      <SettingsSection title={t("profile_section_integrations")}>
        <SettingsRow
          href="/app/profile/pi"
          icon={<ProfileIconPi />}
          tone="violet"
          title={t("profile_tile_pi")}
          subtitle={t("profile_tile_pi_sub")}
          badge={meta.piLinked ? t("profile_status_linked") : t("profile_status_not_linked")}
          badgeTone={meta.piLinked ? "ok" : "muted"}
        />
        <SettingsRow
          href="/app/profile/api-keys"
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M8 11V7a4 4 0 118 0v4M6 11h12v10H6V11z" stroke="currentColor" strokeWidth="2" />
            </svg>
          }
          tone="copper"
          title={t("profile_api_keys_title")}
          subtitle={t("profile_row_api_keys_sub")}
        />
        {showAdmin ? (
          <SettingsRow
            href="/app/profile/ops"
            icon={<ProfileIconOps />}
            tone="copper"
            title={t("profile_tile_admin")}
            subtitle={t("profile_ops_sub")}
          />
        ) : null}
      </SettingsSection>

      <section className="fd-card overflow-hidden p-0">
        <LogoutButton
          leading={<ProfileIconLogout className="h-5 w-5 text-rose-600" />}
          className="flex w-full items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold text-rose-700 active:bg-rose-50/80"
        />
      </section>
    </div>
  );
}

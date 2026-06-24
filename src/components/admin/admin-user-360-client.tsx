"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AdminSnapshotRow } from "@/components/admin/admin-snapshot-row";
import { adminCls, AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";
import { useI18n } from "@/components/i18n-provider";
import { UserAvatarMark } from "@/components/profile/user-avatar-mark";

type TabId = "overview" | "kyc" | "wallet" | "p2p" | "security" | "staff";

type User360 = {
  user: {
    id: string;
    email: string;
    role: string;
    staffScopes: string[] | null;
    createdAt: string;
    displayName: string | null;
    avatarUrl: string | null;
    countryCode: string | null;
    piUsername: string | null;
    piLinked: boolean;
    referralCode: string | null;
    referrerEmail: string | null;
    buleliPointsBalance: number;
    tradeLiveEnabled: boolean;
    emailVerifiedAt: string | null;
  };
  overview: {
    totalCompletedTrades: number;
    reputationScore: number;
    completionPct: number | null;
    portfolio: { totalEquivDisplay: string } | null;
    communityHandle: string | null;
    kycStatus: string;
  } | null;
  kyc: {
    kycStatus: string;
    helpTier: string;
    rejectionNote: string | null;
    diditSessionId: string | null;
    diditSessionStatus: string | null;
    legal: {
      legalFirstName: string | null;
      legalLastName: string | null;
      birthDate: string | null;
      documentNumber: string | null;
      documentType: string | null;
      documentCountry: string | null;
    };
  } | null;
  security: {
    emailVerified: boolean;
    totpEnabled: boolean;
    passkeyCount: number;
    whatsAppVerified: boolean;
  } | null;
  p2p: {
    rating: { avg: number; count: number } | null;
    completedTrades: number;
    verifiedMerchant: boolean;
    activeAds: unknown[];
  } | null;
  community: { handle: string; bio: string } | null;
  referral: {
    code: string;
    referralBalanceUsdt: number;
    inviteCount: number;
    totalEarnedUsdt: number;
  } | null;
  notificationPrefs: Record<string, boolean>;
};

const TABS: { id: TabId; labelKey: "admin_user360_tab_overview" | "admin_user360_tab_kyc" | "admin_user360_tab_wallet" | "admin_user360_tab_p2p" | "admin_user360_tab_security" | "admin_user360_tab_staff" }[] = [
  { id: "overview", labelKey: "admin_user360_tab_overview" },
  { id: "kyc", labelKey: "admin_user360_tab_kyc" },
  { id: "wallet", labelKey: "admin_user360_tab_wallet" },
  { id: "p2p", labelKey: "admin_user360_tab_p2p" },
  { id: "security", labelKey: "admin_user360_tab_security" },
  { id: "staff", labelKey: "admin_user360_tab_staff" },
];

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[color:var(--fd-border)] py-2.5 text-sm last:border-0">
      <span className="text-[color:var(--fd-muted)]">{label}</span>
      <span className="max-w-[65%] text-right font-medium text-[color:var(--fd-text)]">{value}</span>
    </div>
  );
}

export function AdminUser360Client() {
  const { t, locale } = useI18n();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = String(params.id ?? "");
  const tab = (searchParams.get("tab") as TabId) || "overview";
  const loc = locale === "fr" ? "fr-FR" : "en-US";

  const [data, setData] = useState<User360 | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch(`/api/admin/users/${userId}`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(body.message ?? "—");
      setData(null);
      return;
    }
    setData(body as User360);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const setTab = (id: TabId) => {
    router.replace(`/admin/users/${userId}?tab=${id}`);
  };

  const kpis = useMemo(() => {
    if (!data) return [];
    return [
      {
        label: t("admin_user360_kpi_portfolio"),
        value: data.overview?.portfolio?.totalEquivDisplay ?? "—",
      },
      {
        label: t("admin_user360_kpi_trades"),
        value: String(data.overview?.totalCompletedTrades ?? 0),
      },
      {
        label: t("admin_user360_kpi_kyc"),
        value: data.kyc?.kycStatus ?? "—",
      },
      {
        label: t("admin_user360_kpi_rating"),
        value: data.p2p?.rating
          ? `${data.p2p.rating.avg.toFixed(1)} (${data.p2p.rating.count})`
          : "—",
      },
    ];
  }, [data, t]);

  if (err) {
    return (
      <div>
        <AdminBackLink href="/admin/users">{t("admin_users_title")}</AdminBackLink>
        <p className={adminCls.error}>{err}</p>
      </div>
    );
  }

  if (!data) {
    return <p className={adminCls.muted}>…</p>;
  }

  const u = data.user;

  return (
    <div>
      <AdminBackLink href="/admin/users">{t("admin_users_title")}</AdminBackLink>
      <AdminPageHeader
        title={u.displayName?.trim() || u.email}
        subtitle={u.email}
        action={<span className={adminCls.roleBadge}>{u.role}</span>}
      />

      <div className="mb-4 flex items-center gap-3">
        <UserAvatarMark email={u.email} avatarUrl={u.avatarUrl} sizeClass="h-12 w-12" />
        <div className="min-w-0 text-xs text-[color:var(--fd-muted)]">
          <p className="font-mono">{u.id}</p>
          <p>
            {t("admin_team_col_since")}{" "}
            {new Date(u.createdAt).toLocaleDateString(loc, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
            {u.countryCode ? ` · ${u.countryCode}` : ""}
          </p>
        </div>
      </div>

      <AdminSnapshotRow items={kpis} />

      <nav className={`${adminCls.card} mb-4 mt-4 flex flex-wrap gap-2 p-2`}>
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              tab === item.id
                ? "bg-[color:var(--fd-primary)] text-white"
                : "bg-[color:var(--fd-mint)] text-[color:var(--fd-text)]"
            }`}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </nav>

      {tab === "overview" ? (
        <section className={adminCls.card}>
          <InfoRow label={t("profile_display_name")} value={u.displayName?.trim() || "—"} />
          <InfoRow
            label={t("profile_row_community")}
            value={
              data.community?.handle
                ? `@${data.community.handle}`
                : data.overview?.communityHandle
                  ? `@${data.overview.communityHandle}`
                  : "—"
            }
          />
          <InfoRow
            label={t("profile_referral_code")}
            value={data.referral?.code ?? u.referralCode ?? "—"}
          />
          <InfoRow label="Pi" value={u.piLinked ? u.piUsername ?? "—" : "—"} />
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/app/p2p/merchant/${u.id}`} className={adminCls.btnSecondary}>
              {t("profile_row_merchant")}
            </Link>
            {data.community?.handle ? (
              <Link
                href={`/app/community/u/${data.community.handle}`}
                className={adminCls.btnSecondary}
              >
                {t("profile_community_view")}
              </Link>
            ) : null}
            <Link href={`/admin/kyc?q=${encodeURIComponent(u.email)}`} className={adminCls.btnSecondary}>
              {t("admin_nav_kyc")}
            </Link>
          </div>
        </section>
      ) : null}

      {tab === "kyc" && data.kyc ? (
        <section className={adminCls.card}>
          <InfoRow label={t("admin_kyc_col_status")} value={data.kyc.kycStatus} />
          <InfoRow label={t("admin_kyc_help_review")} value={data.kyc.helpTier} />
          <InfoRow
            label={t("kyc_identity_first")}
            value={data.kyc.legal.legalFirstName ?? "—"}
          />
          <InfoRow
            label={t("kyc_identity_last")}
            value={data.kyc.legal.legalLastName ?? "—"}
          />
          <InfoRow
            label={t("kyc_identity_birth")}
            value={data.kyc.legal.birthDate ?? "—"}
          />
          <InfoRow
            label={t("kyc_identity_document")}
            value={data.kyc.legal.documentNumber ?? "—"}
          />
          {data.kyc.rejectionNote ? (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
              {data.kyc.rejectionNote}
            </p>
          ) : null}
          {data.kyc.diditSessionId ? (
            <p className="mt-2 font-mono text-[10px] text-[color:var(--fd-muted)]">
              Didit: {data.kyc.diditSessionId}
            </p>
          ) : null}
        </section>
      ) : null}

      {tab === "wallet" ? (
        <section className={adminCls.card}>
          <InfoRow
            label={t("profile_wallet_heading")}
            value={data.overview?.portfolio?.totalEquivDisplay ?? "—"}
          />
          <InfoRow label="BP" value={String(u.buleliPointsBalance)} />
          <InfoRow
            label={t("profile_referral_balance")}
            value={
              data.referral
                ? `${data.referral.referralBalanceUsdt.toFixed(2)} USDT`
                : "—"
            }
          />
        </section>
      ) : null}

      {tab === "p2p" && data.p2p ? (
        <section className={adminCls.card}>
          <InfoRow label={t("profile_stat_trades")} value={String(data.p2p.completedTrades)} />
          <InfoRow
            label={t("profile_stat_reputation")}
            value={`${data.p2p.rating?.avg.toFixed(1) ?? "—"} / ${data.p2p.rating?.count ?? 0}`}
          />
          <InfoRow
            label={t("admin_user360_merchant")}
            value={data.p2p.verifiedMerchant ? t("profile_status_verified") : "—"}
          />
          <InfoRow
            label={t("admin_user360_active_ads")}
            value={String(data.p2p.activeAds?.length ?? 0)}
          />
        </section>
      ) : null}

      {tab === "security" && data.security ? (
        <section className={adminCls.card}>
          <InfoRow
            label={t("sec_email_title")}
            value={data.security.emailVerified ? t("sec_email_verified") : t("sec_email_unverified")}
          />
          <InfoRow
            label={t("sec_totp_title")}
            value={data.security.totpEnabled ? t("profile_status_on") : t("profile_status_off")}
          />
          <InfoRow
            label={t("sec_passkey_title")}
            value={String(data.security.passkeyCount)}
          />
          <InfoRow
            label={t("sec_wa_title")}
            value={
              data.security.whatsAppVerified
                ? t("profile_status_linked")
                : t("profile_status_not_linked")
            }
          />
        </section>
      ) : null}

      {tab === "staff" ? (
        <section className={adminCls.card}>
          <InfoRow label={t("admin_role")} value={u.role} />
          <InfoRow
            label={t("admin_users_scopes")}
            value={u.staffScopes?.join(", ") ?? t("admin_users_scopes_all")}
          />
          <Link href="/admin/users" className={`${adminCls.btnSecondary} mt-3 inline-flex`}>
            {t("admin_user360_edit_staff")}
          </Link>
        </section>
      ) : null}
    </div>
  );
}

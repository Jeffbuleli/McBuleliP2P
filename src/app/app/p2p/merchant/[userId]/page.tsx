"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { UserAvatarMark } from "@/components/profile/user-avatar-mark";
import { KycVerifiedBadge } from "@/components/kyc/kyc-verified-badge";
import {
  FlowSection,
  P2pFlowShell,
} from "@/components/p2p/p2p-flow-ui";
import { P2pIconEscrow, P2pIconStar } from "@/components/p2p/p2p-icons";
import { interpolate } from "@/i18n/messages";

type MerchantProfile = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  kycApproved: boolean;
  verifiedMerchant: boolean;
  rating: { avg: number; count: number } | null;
  completedTrades: number;
  completionRatePct: number | null;
  medianReleaseMinutes: number | null;
  volume30dByFiat: Record<string, number>;
  lastActiveAt: string | null;
  online: boolean;
  memberSince: string;
  activeAds: {
    id: string;
    side: string;
    asset: string;
    fiatCurrency: string;
    price: string;
    minFiat: string;
    maxFiat: string;
    terms: string | null;
  }[];
  reviews: { stars: number; comment: string | null; createdAt: string }[];
};

function fmtMinutes(m: number, locale: string): string {
  if (m < 60) return `${Math.round(m)} min`;
  const h = Math.floor(m / 60);
  const r = Math.round(m % 60);
  return r > 0 ? `${h}h ${r}m` : `${h}h`;
}

function fmtLastSeen(iso: string, locale: string): string {
  const d = new Date(iso);
  return d.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function P2pMerchantPage() {
  const params = useParams();
  const userId = typeof params.userId === "string" ? params.userId : "";
  const { t, locale } = useI18n();
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoadErr(null);
    const res = await fetch(`/api/p2p/merchant/${userId}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoadErr(typeof data.error === "string" ? data.error : "user_not_found");
      setProfile(null);
      return;
    }
    setProfile(data.profile as MerchantProfile);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const loc = locale === "fr" ? "fr-FR" : "en-US";
  const volLine = useMemo(() => {
    if (!profile) return null;
    const entries = Object.entries(profile.volume30dByFiat).filter(([, v]) => v > 0);
    if (!entries.length) return null;
    return entries
      .map(([cur, amt]) => `${amt.toLocaleString(loc, { maximumFractionDigits: 0 })} ${cur}`)
      .join(" · ");
  }, [profile, loc]);

  if (loadErr) {
    return (
      <P2pFlowShell title={t("p2p_merchant_profile")} backHref="/app/p2p">
        <p className="py-8 text-center text-sm text-rose-700">{loadErr}</p>
      </P2pFlowShell>
    );
  }

  if (!profile) {
    return (
      <P2pFlowShell title={t("p2p_merchant_profile")} backHref="/app/p2p">
        <p className="py-8 text-center text-sm text-[color:var(--fd-muted)]">…</p>
      </P2pFlowShell>
    );
  }

  return (
    <P2pFlowShell
      title={t("p2p_merchant_profile")}
      subtitle={profile.displayName}
      backHref="/app/p2p"
      headerBadge={
        profile.verifiedMerchant ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--fd-mint)] px-2 py-0.5 text-[9px] font-extrabold uppercase text-[color:var(--fd-primary)]">
            <P2pIconEscrow className="h-3 w-3" />
            {t("p2p_merchant_verified")}
          </span>
        ) : null
      }
    >
      <FlowSection>
        <div className="flex items-center gap-3">
          <UserAvatarMark
            email={profile.displayName}
            avatarUrl={profile.avatarUrl}
            sizeClass="h-14 w-14"
            textClass="text-lg"
            variant="profile"
          />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate text-base font-bold text-[color:var(--fd-text)]">
              <span className="truncate">{profile.displayName}</span>
              {profile.kycApproved ? <KycVerifiedBadge compact /> : null}
            </p>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-semibold text-[color:var(--fd-muted)]">
              {profile.rating && profile.rating.count > 0 ? (
                <span className="inline-flex items-center gap-0.5 text-amber-600">
                  <P2pIconStar filled className="h-3 w-3" />
                  {profile.rating.avg.toFixed(1)} ({profile.rating.count})
                </span>
              ) : null}
              <span>{t("p2p_maker_trades", { count: profile.completedTrades })}</span>
            </p>
            <p className="mt-1 text-[10px] font-semibold text-[color:var(--fd-muted)]">
              {profile.online ? (
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {t("p2p_merchant_online")}
                </span>
              ) : profile.lastActiveAt ? (
                interpolate(t("p2p_merchant_last_seen"), {
                  when: fmtLastSeen(profile.lastActiveAt, locale),
                })
              ) : null}
            </p>
          </div>
        </div>
      </FlowSection>

      <div className="grid grid-cols-2 gap-2">
        <Metric
          label={t("p2p_merchant_completion")}
          value={profile.completionRatePct != null ? `${profile.completionRatePct}%` : "—"}
        />
        <Metric
          label={t("p2p_merchant_release_label")}
          value={
            profile.medianReleaseMinutes != null
              ? fmtMinutes(profile.medianReleaseMinutes, loc)
              : "—"
          }
        />
      </div>

      {volLine ? (
        <p className="text-[10px] font-semibold text-[color:var(--fd-muted)]">
          {t("p2p_merchant_volume_30d")} {volLine}
        </p>
      ) : null}

      {profile.activeAds.length > 0 ? (
        <FlowSection title={t("p2p_merchant_active_ads")}>
          <ul className="space-y-2">
            {profile.activeAds.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/app/p2p/ad/${a.id}/trade`}
                  className="block rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-2 active:scale-[0.99]"
                >
                  <p className="text-xs font-bold text-[color:var(--fd-text)]">
                    {a.side === "sell" ? t("p2p_side_sell") : t("p2p_side_buy")} · {a.asset}/
                    {a.fiatCurrency}
                  </p>
                  <p className="text-sm font-bold tabular-nums text-[color:var(--fd-primary)]">
                    {Number(a.price).toLocaleString(loc, { maximumFractionDigits: 8 })}
                  </p>
                  {a.terms ? (
                    <p className="mt-1 line-clamp-2 text-[10px] text-[color:var(--fd-muted)]">
                      {a.terms}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </FlowSection>
      ) : null}

      {profile.reviews.length > 0 ? (
        <FlowSection title={t("p2p_merchant_reviews")}>
          <ul className="space-y-2">
            {profile.reviews.map((r, i) => (
              <li
                key={`${r.createdAt}-${i}`}
                className="rounded-xl bg-stone-50/90 px-3 py-2"
              >
                <p className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                  <P2pIconStar filled className="h-3 w-3" />
                  {r.stars}/5
                  <span className="font-normal text-[color:var(--fd-muted)]">
                    {new Date(r.createdAt).toLocaleDateString(loc)}
                  </span>
                </p>
                {r.comment ? (
                  <p className="mt-1 text-xs text-[color:var(--fd-text)]">{r.comment}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </FlowSection>
      ) : (
        <p className="text-center text-xs text-[color:var(--fd-muted)]">{t("p2p_maker_no_reviews")}</p>
      )}

      <Link
        href="/app/p2p"
        className="fd-btn-soft mt-2 flex min-h-[48px] w-full items-center justify-center rounded-2xl text-sm font-bold"
      >
        {t("p2p_back_market")}
      </Link>
    </P2pFlowShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="fd-card px-3 py-2">
      <p className="text-[9px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-[color:var(--fd-text)]">{value}</p>
    </div>
  );
}

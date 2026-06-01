"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import { REWARD_GRANT } from "@/lib/reward-points-config";
import { interpolate } from "@/i18n/messages";

type Grants = Record<string, boolean>;

type LedgerRow = {
  id: string;
  amount: number;
  grantType: string | null;
  createdAt: string;
};

type RewardsPayload = {
  balance: number;
  monthlyEarned: number;
  monthlyCap: number;
  earnRates: Record<string, number>;
  grants: Grants;
  ledger: LedgerRow[];
};

function grantLabel(
  t: (k: keyof import("@/i18n/messages").Messages, vars?: Record<string, string | number>) => string,
  grantType: string | null,
): string {
  if (grantType === REWARD_GRANT.KYC_APPROVED) return t("points_ledger_kyc_approved");
  if (grantType === REWARD_GRANT.EMAIL_VERIFIED) return t("points_ledger_email_verified");
  if (grantType === REWARD_GRANT.BOT_FIRST_SUBSCRIPTION) return t("points_ledger_bot_first");
  return grantType ?? "—";
}

export default function WalletPointsPage() {
  const { t, locale } = useI18n();
  const [data, setData] = useState<RewardsPayload | null>(null);
  const [loadErr, setLoadErr] = useState(false);

  const load = useCallback(async () => {
    setLoadErr(false);
    const res = await fetch("/api/rewards/me", { credentials: "same-origin" });
    if (!res.ok) {
      setLoadErr(true);
      setData(null);
      return;
    }
    setData((await res.json()) as RewardsPayload);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loc = locale === "fr" ? "fr-FR" : "en-US";

  const earnRows = useMemo(() => {
    if (!data) return [];
    const rates = data.earnRates;
    return [
      {
        key: REWARD_GRANT.EMAIL_VERIFIED,
        label: t("points_earn_email"),
        points: rates[REWARD_GRANT.EMAIL_VERIFIED] ?? 0,
        done: data.grants[REWARD_GRANT.EMAIL_VERIFIED],
        href: "/app/profile/settings",
      },
      {
        key: REWARD_GRANT.KYC_APPROVED,
        label: t("points_earn_kyc"),
        points: rates[REWARD_GRANT.KYC_APPROVED] ?? 0,
        done: data.grants[REWARD_GRANT.KYC_APPROVED],
        href: "/app/profile/kyc",
      },
      {
        key: REWARD_GRANT.BOT_FIRST_SUBSCRIPTION,
        label: t("points_earn_bot"),
        points: rates[REWARD_GRANT.BOT_FIRST_SUBSCRIPTION] ?? 0,
        done: data.grants[REWARD_GRANT.BOT_FIRST_SUBSCRIPTION],
        href: "/app/trade/bots",
      },
    ];
  }, [data, t]);

  return (
    <div className="home-theme wallet-theme home-scroll -mx-4 min-h-[60vh] px-4 pb-10">
      <WalletSubpageHeader title={t("points_title")} backHref="/app/wallet" />

      {loadErr ? (
        <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {t("points_load_error")}
        </p>
      ) : null}

      {!data && !loadErr ? (
        <p className="mt-8 text-center text-sm text-[color:var(--fd-muted)]">…</p>
      ) : null}

      {data ? (
        <div className="mt-4 space-y-4">
          <section className="fd-card overflow-hidden p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--fd-muted)]">
              {t("points_balance")}
            </p>
            <p className="mt-1 text-4xl font-black tabular-nums text-[color:var(--fd-primary)]">
              {data.balance.toLocaleString(loc)}{" "}
              <span className="text-lg font-bold text-[color:var(--fd-muted)]">
                {t("points_bp_unit")}
              </span>
            </p>
            <p className="mt-2 text-xs text-[color:var(--fd-muted)]">
              {interpolate(t("points_monthly_progress"), {
                earned: data.monthlyEarned,
                cap: data.monthlyCap,
              })}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[color:var(--fd-text)]">
              {t("points_subtitle")}
            </p>
          </section>

          <section className="fd-card p-4">
            <h2 className="text-sm font-bold text-[color:var(--fd-text)]">
              {t("points_how_earn")}
            </h2>
            <ul className="mt-3 space-y-2">
              {earnRows.map((row) => (
                <li key={row.key}>
                  <Link
                    href={row.href}
                    className="flex items-center gap-3 rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-3 active:scale-[0.99]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[color:var(--fd-text)]">
                        {row.label}
                      </p>
                      <p className="text-xs font-bold text-[color:var(--fd-primary)]">
                        +{row.points} {t("points_bp_unit")}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                        row.done
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]"
                      }`}
                    >
                      {row.done ? t("points_status_done") : t("points_status_pending")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="fd-card p-4">
            <h2 className="text-sm font-bold text-[color:var(--fd-text)]">
              {t("points_history")}
            </h2>
            {data.ledger.length === 0 ? (
              <p className="mt-3 text-sm text-[color:var(--fd-muted)]">
                {t("points_history_empty")}
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-[color:var(--fd-border)]">
                {data.ledger.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[color:var(--fd-text)]">
                        {grantLabel(t, row.grantType)}
                      </p>
                      <p className="text-[10px] text-[color:var(--fd-muted)]">
                        {new Date(row.createdAt).toLocaleString(loc)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold tabular-nums text-emerald-700">
                      +{row.amount} {t("points_bp_unit")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/40 px-4 py-3 text-[11px] leading-relaxed text-[color:var(--fd-muted)]">
            {t("points_disclaimer")}
          </p>
        </div>
      ) : null}
    </div>
  );
}

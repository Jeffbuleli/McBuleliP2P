"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  BuleliPointsEarnIllustration,
  BuleliPointsHeroIllustration,
  BuleliPointsSpendIllustration,
  McBHeroIllustration,
} from "@/components/wallet/points-illustrations";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import { REWARD_GRANT } from "@/lib/reward-points-config";
import { rewardLedgerLabel } from "@/lib/reward-points-labels";
import { interpolate } from "@/i18n/messages";

type Grants = Record<string, boolean>;

type LedgerRow = {
  id: string;
  amount: number;
  grantType: string | null;
  note: string | null;
  createdAt: string;
};

type SpendOption = {
  id: string;
  perkType: string;
  costBp: number;
  discountPercent: number;
  validDays: number;
};

type ActivePerk = {
  id: string;
  perkType: string;
  discountPercent: number;
  expiresAt: string;
};

type RewardsPayload = {
  balance: number;
  monthlyEarned: number;
  monthlyCap: number;
  earnRates: Record<string, number>;
  spendOptions: SpendOption[];
  activePerks: ActivePerk[];
  grants: Grants;
  ledger: LedgerRow[];
};

type ClaimConfig = {
  preview: boolean;
  enabled: boolean;
  bpPerMcb: number;
  minBp: number;
  chainLabel: string;
  chainId: number;
  tokenStandard: string;
  contractAddress: string | null;
  explorerTokenUrl: string | null;
  dexUrl: string | null;
};

type ClaimRow = {
  id: string;
  bpAmount: number;
  mcbAmount: string;
  walletAddress: string;
  status: string;
  txHash: string | null;
  createdAt: string;
  completedAt: string | null;
};

type ClaimPayload = {
  config: ClaimConfig;
  kycApproved: boolean;
  balance: number;
  maxClaimBp: number;
  pending: ClaimRow | null;
  claims: ClaimRow[];
};

function spendLabel(
  t: (k: keyof import("@/i18n/messages").Messages) => string,
  spendId: string,
): string {
  if (spendId === "P2P_FEE_DISCOUNT_15") return t("points_spend_p2p_fee");
  if (spendId === "BOT_RENEWAL_DISCOUNT_10") return t("points_spend_bot_renewal");
  return spendId;
}

function perkLabel(
  t: (k: keyof import("@/i18n/messages").Messages) => string,
  perkType: string,
): string {
  if (perkType === "p2p_fee_discount_15") return t("points_spend_p2p_fee");
  if (perkType === "bot_renewal_discount_10") return t("points_spend_bot_renewal");
  return perkType;
}

export default function WalletPointsPage() {
  const { t, locale } = useI18n();
  const [data, setData] = useState<RewardsPayload | null>(null);
  const [loadErr, setLoadErr] = useState(false);
  const [spendErr, setSpendErr] = useState<string | null>(null);
  const [spendingId, setSpendingId] = useState<string | null>(null);
  const [claimData, setClaimData] = useState<ClaimPayload | null>(null);
  const [claimWallet, setClaimWallet] = useState("");
  const [claimBp, setClaimBp] = useState("");
  const [claimErr, setClaimErr] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [ledgerRows, setLedgerRows] = useState<LedgerRow[]>([]);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [ledgerPage, setLedgerPage] = useState(0);
  const [ledgerPageSize, setLedgerPageSize] = useState<10 | 20 | 30>(10);

  const load = useCallback(async () => {
    setLoadErr(false);
    const [rewardsRes, claimRes] = await Promise.all([
      fetch("/api/rewards/me", { credentials: "same-origin" }),
      fetch("/api/rewards/claim", { credentials: "same-origin" }),
    ]);
    if (!rewardsRes.ok) {
      setLoadErr(true);
      setData(null);
      return;
    }
    setData((await rewardsRes.json()) as RewardsPayload);
    if (claimRes.ok) {
      setClaimData((await claimRes.json()) as ClaimPayload);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loadLedger = useCallback(async () => {
    const offset = ledgerPage * ledgerPageSize;
    const res = await fetch(
      `/api/rewards/ledger?limit=${ledgerPageSize}&offset=${offset}`,
      { credentials: "same-origin" },
    );
    if (!res.ok) return;
    const j = (await res.json()) as {
      ledger: LedgerRow[];
      total: number;
    };
    setLedgerRows(j.ledger ?? []);
    setLedgerTotal(j.total ?? 0);
  }, [ledgerPage, ledgerPageSize]);

  useEffect(() => {
    void loadLedger();
  }, [loadLedger]);

  const loc = locale === "fr" ? "fr-FR" : "en-US";
  const ledgerPageCount = Math.max(1, Math.ceil(ledgerTotal / ledgerPageSize));

  const oneTimeEarnRows = useMemo(() => {
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
      {
        key: REWARD_GRANT.TRAINING_ENROLLED,
        label: t("points_earn_training_enroll"),
        points: rates[REWARD_GRANT.TRAINING_ENROLLED] ?? 0,
        done: data.grants[REWARD_GRANT.TRAINING_ENROLLED],
        href: "/app/academy",
      },
    ];
  }, [data, t]);

  const repeatableEarnRows = useMemo(() => {
    if (!data) return [];
    const rates = data.earnRates;
    return [
      {
        key: REWARD_GRANT.STAKING_OPENED,
        label: t("points_earn_staking_open"),
        points: rates[REWARD_GRANT.STAKING_OPENED] ?? 0,
        href: "/app/wallet/staking",
      },
      {
        key: REWARD_GRANT.STAKING_MATURED,
        label: t("points_earn_staking_mature"),
        points: rates[REWARD_GRANT.STAKING_MATURED] ?? 0,
        href: "/app/wallet/staking",
      },
      {
        key: REWARD_GRANT.P2P_TRADE_COMPLETED,
        label: t("points_earn_p2p"),
        points: rates[REWARD_GRANT.P2P_TRADE_COMPLETED] ?? 0,
        href: "/app/p2p",
      },
      {
        key: REWARD_GRANT.TRAINING_SESSION_ATTENDED,
        label: t("points_earn_training_live"),
        points: rates[REWARD_GRANT.TRAINING_SESSION_ATTENDED] ?? 0,
        href: "/app/academy",
      },
      {
        key: REWARD_GRANT.TRAINING_QUIZ_PASSED,
        label: t("points_earn_training_quiz"),
        points: rates[REWARD_GRANT.TRAINING_QUIZ_PASSED] ?? 0,
        href: "/app/academy",
      },
    ];
  }, [data, t]);

  const activePerkTypes = useMemo(
    () => new Set(data?.activePerks.map((p) => p.perkType) ?? []),
    [data?.activePerks],
  );

  async function handleSpend(spendId: string) {
    setSpendErr(null);
    setSpendingId(spendId);
    try {
      const res = await fetch("/api/rewards/spend", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spendId }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        const msg = body.message ?? "points_spend_failed";
        if (msg === "points_insufficient_balance") setSpendErr(t("points_spend_error_insufficient"));
        else if (msg === "points_perk_already_active") setSpendErr(t("points_spend_error_active"));
        else setSpendErr(t("points_spend_failed"));
        return;
      }
      await load();
    } finally {
      setSpendingId(null);
    }
  }

  function claimErrorMessage(code: string): string {
    if (code === "mcb_claim_disabled") return t("mcb_claim_error_disabled");
    if (code === "mcb_claim_kyc_required") return t("mcb_claim_error_kyc");
    if (code === "mcb_claim_insufficient_bp") return t("mcb_claim_error_balance");
    if (code === "mcb_claim_pending_exists") return t("mcb_claim_error_pending");
    if (code === "mcb_claim_invalid_address") return t("mcb_claim_error_address");
    if (code === "mcb_claim_bp_step") return t("mcb_claim_error_step");
    if (code === "mcb_claim_min_bp") return t("mcb_claim_error_min");
    return t("mcb_claim_error_generic");
  }

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!claimData?.config.enabled) return;
    setClaimErr(null);
    setClaiming(true);
    try {
      const res = await fetch("/api/rewards/claim", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bpAmount: Number(claimBp),
          walletAddress: claimWallet.trim(),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setClaimErr(claimErrorMessage(body.message ?? "mcb_claim_error_generic"));
        return;
      }
      setClaimWallet("");
      setClaimBp("");
      await load();
    } finally {
      setClaiming(false);
    }
  }

  const claimMcbPreview = useMemo(() => {
    const bp = Number(claimBp);
    if (!claimData || !Number.isFinite(bp) || bp <= 0) return "—";
    return (bp / claimData.config.bpPerMcb).toString();
  }, [claimBp, claimData]);

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
            <div className="flex items-start gap-4">
              <BuleliPointsHeroIllustration className="h-20 w-20 shrink-0" />
              <div className="min-w-0 flex-1">
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
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[color:var(--fd-text)]">
              {t("points_subtitle")}
            </p>
          </section>

          {data.activePerks.length > 0 ? (
            <section className="fd-card p-4">
              <h2 className="text-sm font-bold text-[color:var(--fd-text)]">
                {t("points_active_perks")}
              </h2>
              <ul className="mt-3 space-y-2">
                {data.activePerks.map((perk) => (
                  <li
                    key={perk.id}
                    className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5"
                  >
                    <BuleliPointsSpendIllustration className="h-10 w-10 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-emerald-900">
                        {perkLabel(t, perk.perkType)} (−{perk.discountPercent}%)
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        {interpolate(t("points_spend_active"), {
                          date: new Date(perk.expiresAt).toLocaleDateString(loc),
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="fd-card p-4">
            <div className="flex items-center gap-2">
              <BuleliPointsEarnIllustration className="h-9 w-9 shrink-0" />
              <h2 className="text-sm font-bold text-[color:var(--fd-text)]">
                {t("points_how_earn")}
              </h2>
            </div>
            <ul className="mt-3 space-y-2">
              {oneTimeEarnRows.map((row) => (
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
              {repeatableEarnRows.map((row) => (
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
                    <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                      {t("points_status_repeatable")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="fd-card p-4">
            <div className="flex items-center gap-2">
              <BuleliPointsSpendIllustration className="h-9 w-9 shrink-0" />
              <h2 className="text-sm font-bold text-[color:var(--fd-text)]">
                {t("points_how_spend")}
              </h2>
            </div>
            {spendErr ? (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                {spendErr}
              </p>
            ) : null}
            <ul className="mt-3 space-y-2">
              {data.spendOptions.map((opt) => {
                const isActive = activePerkTypes.has(opt.perkType);
                const canAfford = data.balance >= opt.costBp;
                return (
                  <li
                    key={opt.id}
                    className="flex items-center gap-3 rounded-xl border border-[color:var(--fd-border)] px-3 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[color:var(--fd-text)]">
                        {spendLabel(t, opt.id)}
                      </p>
                      <p className="text-xs text-[color:var(--fd-muted)]">
                        {interpolate(t("points_spend_cost"), {
                          cost: opt.costBp,
                          days: opt.validDays,
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isActive || !canAfford || spendingId === opt.id}
                      onClick={() => void handleSpend(opt.id)}
                      className="shrink-0 rounded-full bg-[color:var(--fd-primary)] px-3 py-1.5 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isActive
                        ? t("points_status_done")
                        : spendingId === opt.id
                          ? "…"
                          : t("points_spend_button")}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="fd-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-[color:var(--fd-text)]">
                {t("points_history")}
              </h2>
              <div className="flex items-center gap-1 text-[11px]">
                {([10, 20, 30] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setLedgerPageSize(n);
                      setLedgerPage(0);
                    }}
                    className={`rounded-full px-2 py-0.5 font-bold ${
                      ledgerPageSize === n
                        ? "bg-[color:var(--fd-primary)] text-white"
                        : "bg-[color:var(--fd-border)] text-[color:var(--fd-muted)]"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            {ledgerRows.length === 0 ? (
              <p className="mt-3 text-sm text-[color:var(--fd-muted)]">
                {t("points_history_empty")}
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-[color:var(--fd-border)]">
                {ledgerRows.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[color:var(--fd-text)]">
                        {rewardLedgerLabel(t, row)}
                      </p>
                      <p className="text-[10px] text-[color:var(--fd-muted)]">
                        {new Date(row.createdAt).toLocaleString(loc)}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 text-sm font-bold tabular-nums ${
                        row.amount >= 0 ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {row.amount >= 0 ? "+" : ""}
                      {row.amount} {t("points_bp_unit")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {ledgerTotal > ledgerPageSize ? (
              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={ledgerPage <= 0}
                  onClick={() => setLedgerPage((p) => Math.max(0, p - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--fd-border)] disabled:opacity-40"
                  aria-label={locale === "fr" ? "Précédent" : "Previous"}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M15 18l-6-6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <span className="text-xs text-[color:var(--fd-muted)]">
                  {ledgerPage + 1} / {ledgerPageCount}
                </span>
                <button
                  type="button"
                  disabled={ledgerPage >= ledgerPageCount - 1}
                  onClick={() =>
                    setLedgerPage((p) => Math.min(ledgerPageCount - 1, p + 1))
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--fd-border)] disabled:opacity-40"
                  aria-label={locale === "fr" ? "Suivant" : "Next"}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M9 18l6-6-6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            ) : null}
          </section>

          {claimData?.config.preview ? (
            <section className="fd-card overflow-hidden p-4">
              <div className="flex items-start gap-3">
                <McBHeroIllustration className="h-16 w-16 shrink-0" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold text-[color:var(--fd-text)]">
                    {t("mcb_claim_title")}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-[color:var(--fd-muted)]">
                    {interpolate(t("mcb_claim_ratio"), {
                      bp: claimData.config.bpPerMcb,
                    })}
                  </p>
                  <p className="mt-1 text-[11px] text-[color:var(--fd-muted)]">
                    {claimData.config.tokenStandard} · {claimData.config.chainLabel}
                    {claimData.config.contractAddress
                      ? ` · ${claimData.config.contractAddress.slice(0, 8)}…${claimData.config.contractAddress.slice(-6)}`
                      : ""}
                  </p>
                  {claimData.config.explorerTokenUrl ? (
                    <a
                      href={claimData.config.explorerTokenUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-[11px] font-bold text-[color:var(--fd-primary)]"
                    >
                      {t("mcb_contract_bscscan")} ↗
                    </a>
                  ) : null}
                </div>
              </div>

              {!claimData.config.enabled ? (
                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {t("mcb_claim_preview_notice")}
                </p>
              ) : null}

              {claimData.pending ? (
                <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-3">
                  <p className="text-sm font-semibold text-sky-900">
                    {t("mcb_claim_pending_title")}
                  </p>
                  <p className="mt-1 text-xs text-sky-800">
                    {claimData.pending.mcbAmount} McB →{" "}
                    <span className="font-mono">{claimData.pending.walletAddress}</span>
                  </p>
                  <p className="mt-1 text-[10px] text-sky-700">
                    {new Date(claimData.pending.createdAt).toLocaleString(loc)}
                  </p>
                </div>
              ) : null}

              {!claimData.kycApproved ? (
                <p className="mt-4 rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/30 px-3 py-2 text-xs text-[color:var(--fd-text)]">
                  {t("mcb_claim_kyc_required")}{" "}
                  <Link href="/app/profile/kyc" className="font-bold text-[color:var(--fd-primary)]">
                    KYC →
                  </Link>
                </p>
              ) : claimData.config.enabled && !claimData.pending ? (
                <form onSubmit={(e) => void handleClaim(e)} className="mt-4 space-y-3">
                  {claimErr ? (
                    <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                      {claimErr}
                    </p>
                  ) : null}
                  <label className="block">
                    <span className="text-[11px] font-semibold text-[color:var(--fd-muted)]">
                      {t("mcb_claim_wallet_label")}
                    </span>
                    <input
                      type="text"
                      value={claimWallet}
                      onChange={(e) => setClaimWallet(e.target.value)}
                      placeholder="0x…"
                      className="mt-1 w-full rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2.5 font-mono text-sm text-[color:var(--fd-text)] outline-none focus:border-[color:var(--fd-primary)]"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-semibold text-[color:var(--fd-muted)]">
                      {t("mcb_claim_bp_label")}
                    </span>
                    <input
                      type="number"
                      min={claimData.config.minBp}
                      step={claimData.config.bpPerMcb}
                      max={claimData.maxClaimBp}
                      value={claimBp}
                      onChange={(e) => setClaimBp(e.target.value)}
                      placeholder={String(claimData.config.minBp)}
                      className="mt-1 w-full rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2.5 text-sm tabular-nums text-[color:var(--fd-text)] outline-none focus:border-[color:var(--fd-primary)]"
                      required
                    />
                    <p className="mt-1 text-[10px] text-[color:var(--fd-muted)]">
                      {interpolate(t("mcb_claim_you_receive"), { mcb: claimMcbPreview })}
                    </p>
                  </label>
                  <button
                    type="submit"
                    disabled={
                      claiming ||
                      claimData.balance < claimData.config.minBp ||
                      claimData.maxClaimBp < claimData.config.minBp
                    }
                    className="w-full rounded-xl bg-[#991B1B] py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {claiming ? "…" : t("mcb_claim_submit")}
                  </button>
                </form>
              ) : null}

              {claimData.claims.length > 0 ? (
                <ul className="mt-4 divide-y divide-[color:var(--fd-border)] border-t border-[color:var(--fd-border)] pt-3">
                  {claimData.claims.slice(0, 5).map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2 py-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[color:var(--fd-text)]">
                          {c.mcbAmount} McB
                        </p>
                        <p className="text-[10px] text-[color:var(--fd-muted)]">
                          {new Date(c.createdAt).toLocaleDateString(loc)} · {c.status}
                        </p>
                      </div>
                      {c.txHash ? (
                        <span className="max-w-[120px] truncate font-mono text-[9px] text-[color:var(--fd-muted)]">
                          {c.txHash}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}

              {claimData.config.dexUrl ? (
                <a
                  href={claimData.config.dexUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-[11px] font-bold text-[color:var(--fd-primary)]"
                >
                  {t("mcb_claim_dex_link")} ↗
                </a>
              ) : null}
            </section>
          ) : null}

          <p className="rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/40 px-4 py-3 text-[11px] leading-relaxed text-[color:var(--fd-muted)]">
            {t("points_disclaimer")}
          </p>
        </div>
      ) : null}
    </div>
  );
}

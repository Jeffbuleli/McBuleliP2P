"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { clientErrorText } from "@/lib/client-error-text";

type Passport = {
  displayName: string | null;
  memberSince: string;
  savingsUsdt: number;
  loansTotal: number;
  loansRepaid: number;
  latePayments: number;
  contributionConsistencyPct: number;
  reliability: {
    score: number;
    maxScore: number;
    factors: Array<{
      id: string;
      labelEn: string;
      labelFr: string;
      points: number;
      maxPoints: number;
      rating: string;
    }>;
  };
};

function ScoreRing({ score, max }: { score: number; max: number }) {
  const pct = Math.max(0, Math.min(100, Math.round((score / Math.max(1, max)) * 100)));
  const r = 28;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <svg viewBox="0 0 72 72" className="h-16 w-16" aria-hidden>
      <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-stone-200" />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform="rotate(-90 36 36)"
        className="text-[color:var(--fd-primary)]"
      />
      <text
        x="36"
        y="40"
        textAnchor="middle"
        className="fill-[color:var(--fd-text)]"
        style={{ fontSize: "16px", fontWeight: 800 }}
      >
        {score}
      </text>
    </svg>
  );
}

export function AvecFinancialPassportPanel({
  groupId,
  memberUserId,
  compact,
}: {
  groupId: string;
  memberUserId?: string;
  compact?: boolean;
}) {
  const { t, locale } = useI18n();
  const [passport, setPassport] = useState<Passport | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [partner, setPartner] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    const q = memberUserId ? `?memberUserId=${encodeURIComponent(memberUserId)}` : "";
    const res = await fetch(`/api/groups/${groupId}/passport${q}`, { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr((j as { error?: string }).error ?? "group_action_failed");
      return;
    }
    setPassport((j as { passport: Passport }).passport);
  }, [groupId, memberUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function grantConsent() {
    if (!partner.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/passport`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerLabel: partner.trim(),
          scopes: ["summary", "score", "savings"],
          durationDays: 30,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      setPartner("");
      setShowShare(false);
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (err && !passport) {
    return <p className="text-[10px] text-rose-700">{clientErrorText(t, err)}</p>;
  }
  if (!passport) {
    return (
      <p className="text-[10px] text-[color:var(--fd-muted)]">{t("avec_passport_loading")}</p>
    );
  }

  const year = new Date(passport.memberSince).getFullYear();
  const topFactors = passport.reliability.factors.slice(0, 4);

  return (
    <section className="rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("avec_passport_title")}
          </p>
          <p className="truncate text-sm font-bold text-[color:var(--fd-text)]">
            {passport.displayName || t("avec_passport_member")}
          </p>
          <p className="text-[10px] text-[color:var(--fd-muted)]">
            {t("avec_passport_since")} {year}
          </p>
        </div>
        <ScoreRing score={passport.reliability.score} max={passport.reliability.maxScore} />
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
        <Stat label={t("avec_passport_savings")} value={`$${passport.savingsUsdt.toFixed(0)}`} />
        <Stat label={t("avec_passport_loans")} value={String(passport.loansTotal)} />
        <Stat label={t("avec_passport_repaid")} value={String(passport.loansRepaid)} />
        <Stat label={t("avec_passport_late")} value={String(passport.latePayments)} />
      </div>

      {!compact ? (
        <ul className="mt-3 space-y-1">
          {topFactors.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-2 text-[10px]">
              <span className="truncate text-[color:var(--fd-text)]">
                {locale === "fr" ? f.labelFr : f.labelEn}
              </span>
              <span className="shrink-0 font-bold tabular-nums text-[color:var(--fd-muted)]">
                {f.points}/{f.maxPoints}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {!compact && !memberUserId ? (
        <div className="mt-3">
          {!showShare ? (
            <button
              type="button"
              onClick={() => setShowShare(true)}
              className="text-[10px] font-bold text-[color:var(--fd-primary)]"
            >
              {t("avec_passport_share")}
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                value={partner}
                onChange={(e) => setPartner(e.target.value)}
                placeholder={t("avec_passport_partner_ph")}
                className="min-w-0 flex-1 rounded-lg border border-[color:var(--fd-border)] bg-[color:var(--fd-bg)] px-2 py-1.5 text-xs"
              />
              <button
                type="button"
                disabled={busy || !partner.trim()}
                onClick={() => void grantConsent()}
                className="rounded-lg bg-[color:var(--fd-primary)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {t("avec_passport_grant")}
              </button>
            </div>
          )}
        </div>
      ) : null}

      {err ? <p className="mt-2 text-[10px] text-rose-700">{clientErrorText(t, err)}</p> : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[color:var(--fd-bg)] px-1.5 py-2">
      <p className="text-sm font-black tabular-nums text-[color:var(--fd-text)]">{value}</p>
      <p className="truncate text-[8px] font-bold uppercase text-[color:var(--fd-muted)]">{label}</p>
    </div>
  );
}

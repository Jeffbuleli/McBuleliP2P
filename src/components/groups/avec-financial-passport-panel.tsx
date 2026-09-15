"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { clientErrorText } from "@/lib/client-error-text";

type Factor = {
  id: string;
  labelEn: string;
  labelFr: string;
  points: number;
  maxPoints: number;
  rating: string;
};

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
    factors: Factor[];
    disclaimerEn: string;
    disclaimerFr: string;
  };
};

type Consent = {
  id: string;
  partnerLabel: string;
  scopes: string[];
  expiresAt: string;
  active: boolean;
  revokedAt: string | null;
};

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
  const [consents, setConsents] = useState<Consent[]>([]);
  const [err, setErr] = useState<string | null>(null);
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
    setConsents((j as { consents?: Consent[] }).consents ?? []);
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
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      setPartner("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function revoke(consentId: string) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/passport`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (err && !passport) {
    return <p className="text-xs text-rose-700">{clientErrorText(t, err)}</p>;
  }
  if (!passport) {
    return (
      <p className="text-xs text-[color:var(--fd-muted)]">{t("avec_passport_loading")}</p>
    );
  }

  const year = new Date(passport.memberSince).getFullYear();
  const score = passport.reliability.score;

  return (
    <section className="rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-3">
      <h3 className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
        {t("avec_passport_title")}
      </h3>
      <p className="mt-1 text-sm font-bold text-[color:var(--fd-text)]">
        {passport.displayName || t("avec_passport_member")}
      </p>
      <p className="text-[10px] text-[color:var(--fd-muted)]">
        {t("avec_passport_since")} {year}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
        <Stat label={t("avec_passport_savings")} value={`$${passport.savingsUsdt.toFixed(0)}`} />
        <Stat label={t("avec_passport_loans")} value={String(passport.loansTotal)} />
        <Stat label={t("avec_passport_repaid")} value={String(passport.loansRepaid)} />
        <Stat label={t("avec_passport_late")} value={String(passport.latePayments)} />
      </div>

      <div className="mt-3 rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-bg)] px-3 py-2">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
              {t("avec_score_title")}
            </p>
            <p className="text-2xl font-black tabular-nums text-[color:var(--fd-primary)]">
              {score}
              <span className="text-sm font-bold text-[color:var(--fd-muted)]">
                /{passport.reliability.maxScore}
              </span>
            </p>
          </div>
          <p className="text-[10px] text-[color:var(--fd-muted)]">
            {t("avec_passport_consistency")}: {passport.contributionConsistencyPct}%
          </p>
        </div>
        {!compact ? (
          <ul className="mt-2 space-y-1">
            {passport.reliability.factors.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-2 text-[10px] text-[color:var(--fd-text)]"
              >
                <span>{locale === "fr" ? f.labelFr : f.labelEn}</span>
                <span className="font-bold tabular-nums text-[color:var(--fd-muted)]">
                  {f.points}/{f.maxPoints} · {f.rating}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-2 text-[9px] leading-snug text-[color:var(--fd-muted)]">
          {locale === "fr"
            ? passport.reliability.disclaimerFr
            : passport.reliability.disclaimerEn}
        </p>
      </div>

      {!compact && !memberUserId ? (
        <div className="mt-3 space-y-2">
          <p className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("avec_passport_share")}
          </p>
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
          {consents.length > 0 ? (
            <ul className="space-y-1">
              {consents.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[color:var(--fd-border)] px-2 py-1.5 text-[10px]"
                >
                  <span>
                    {c.partnerLabel}
                    {!c.active ? ` · ${t("avec_passport_inactive")}` : ""}
                  </span>
                  {c.active ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void revoke(c.id)}
                      className="font-bold text-rose-700"
                    >
                      {t("avec_passport_revoke")}
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {err ? <p className="mt-2 text-xs text-rose-700">{clientErrorText(t, err)}</p> : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-bg)] px-2 py-2">
      <p className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">{label}</p>
      <p className="mt-0.5 text-sm font-black tabular-nums text-[color:var(--fd-text)]">{value}</p>
    </div>
  );
}

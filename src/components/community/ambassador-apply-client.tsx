"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useI18n } from "@/components/i18n-provider";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import type { Messages } from "@/i18n/messages";

type Eligibility = {
  applicationsEnabled: boolean;
  kycApproved: boolean;
  builderTier: string | null;
  goldPlus: boolean;
  canApply: boolean;
  blockReason: string | null;
};

type Application = {
  id: string;
  status: string;
  region: string;
  motivation: string;
  charterVersion: string;
  builderTierAtApply: string;
  rejectReason: string | null;
  startsAt: string | null;
  createdAt: string;
};

type Payload = {
  charterVersion: string;
  charterBullets: string[];
  eligibility: Eligibility;
  pending: Application | null;
  active: Application | null;
  history: Application[];
};

function errorMessage(
  t: (k: keyof Messages) => string,
  code: string,
): string {
  const map: Record<string, keyof Messages> = {
    amb_disabled: "amb_error_disabled",
    amb_kyc_required: "amb_error_kyc",
    amb_gold_required: "amb_error_gold",
    amb_pending_exists: "amb_error_pending",
    amb_already_active: "amb_error_active",
    amb_charter_required: "amb_error_charter",
    amb_invalid_region: "amb_error_region",
    amb_motivation_short: "amb_error_motivation_short",
    amb_motivation_long: "amb_error_motivation_long",
    amb_not_eligible: "amb_error_eligible",
  };
  const k = map[code];
  return k ? t(k) : t("amb_error_generic");
}

export function AmbassadorApplyClient() {
  const { t, locale } = useI18n();
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  const [data, setData] = useState<Payload | null>(null);
  const [loadErr, setLoadErr] = useState(false);
  const [region, setRegion] = useState("");
  const [motivation, setMotivation] = useState("");
  const [experience, setExperience] = useState("");
  const [languages, setLanguages] = useState("");
  const [charterAccepted, setCharterAccepted] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoadErr(false);
    const res = await fetch("/api/community/ambassador/me", {
      credentials: "same-origin",
    });
    if (!res.ok) {
      setLoadErr(true);
      setData(null);
      return;
    }
    setData((await res.json()) as Payload);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!data?.eligibility.canApply) return;
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/community/ambassador/me", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: region.trim(),
          motivation: motivation.trim(),
          experience: experience.trim() || undefined,
          languages: languages.trim() || undefined,
          charterAccepted: true,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setErr(errorMessage(t, body.message ?? "amb_error_generic"));
        return;
      }
      setMotivation("");
      setExperience("");
      setCharterAccepted(false);
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!data && !loadErr) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-[color:var(--fd-muted)]">
        …
      </div>
    );
  }

  if (loadErr || !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <WalletSubpageHeader title={t("amb_title")} backHref="/app/community/builders" />
        <p className="mt-6 text-sm text-rose-700">{t("amb_load_error")}</p>
      </div>
    );
  }

  const { eligibility } = data;

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-2">
      <WalletSubpageHeader title={t("amb_title")} backHref="/app/community/builders" />

      <p className="mt-3 text-base font-bold tracking-tight text-[color:var(--fd-text)]">
        {t("amb_tagline")}
      </p>
      <p className="mt-1 text-sm text-[color:var(--fd-muted)]">{t("amb_intro")}</p>

      {data.active ? (
        <div className="mt-5 rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-4 py-3">
          <p className="text-sm font-bold text-[color:var(--fd-text)]">
            {t("amb_active_title")}
          </p>
          <p className="mt-1 text-[12px] text-[color:var(--fd-muted)]">
            {data.active.region}
            {data.active.startsAt
              ? ` · ${new Date(data.active.startsAt).toLocaleDateString(loc)}`
              : null}
          </p>
          <p className="mt-2 text-[11px] text-[color:var(--fd-muted)]">
            {t("amb_active_note")}
          </p>
        </div>
      ) : null}

      {data.pending ? (
        <div className="mt-4 rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-4 py-3">
          <p className="text-sm font-semibold text-[color:var(--fd-text)]">
            {t("amb_pending_title")}
          </p>
          <p className="mt-1 text-[12px] text-[color:var(--fd-muted)]">
            {data.pending.region} ·{" "}
            {new Date(data.pending.createdAt).toLocaleDateString(loc)}
          </p>
        </div>
      ) : null}

      <section className="mt-6">
        <h2 className="text-sm font-bold text-[color:var(--fd-text)]">
          {t("amb_charter_title")}
        </h2>
        <p className="mt-0.5 text-[11px] text-[color:var(--fd-muted)]">
          {t("amb_charter_version")} {data.charterVersion}
        </p>
        <ul className="mt-2 space-y-1.5">
          {data.charterBullets.map((key) => (
            <li
              key={key}
              className="flex items-start gap-2 text-[12px] text-[color:var(--fd-text)]"
            >
              <span
                className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[color:var(--fd-primary)]"
                aria-hidden
              />
              <span>{t(key as keyof Messages)}</span>
            </li>
          ))}
        </ul>
      </section>

      {!eligibility.canApply && !data.active && !data.pending ? (
        <div className="mt-5 rounded-xl border border-[color:var(--fd-border)] px-3 py-2.5 text-xs text-[color:var(--fd-text)]">
          {eligibility.blockReason === "amb_kyc_required" ? (
            <>
              {t("amb_error_kyc")}{" "}
              <Link
                href="/app/profile/kyc"
                className="font-bold text-[color:var(--fd-primary)]"
              >
                KYC →
              </Link>
            </>
          ) : eligibility.blockReason === "amb_gold_required" ? (
            <>
              {t("amb_error_gold")}{" "}
              <Link
                href="/app/community/builders"
                className="font-bold text-[color:var(--fd-primary)]"
              >
                Builders →
              </Link>
            </>
          ) : (
            errorMessage(t, eligibility.blockReason ?? "amb_error_generic")
          )}
        </div>
      ) : null}

      {eligibility.canApply ? (
        <form onSubmit={(e) => void onSubmit(e)} className="mt-5 space-y-3">
          {err ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              {err}
            </p>
          ) : null}

          <label className="block">
            <span className="text-[11px] font-semibold text-[color:var(--fd-muted)]">
              {t("amb_region_label")}
            </span>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              required
              maxLength={120}
              placeholder={t("amb_region_placeholder")}
              className="mt-1 w-full rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2.5 text-sm outline-none focus:border-[color:var(--fd-primary)]"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold text-[color:var(--fd-muted)]">
              {t("amb_motivation_label")}
            </span>
            <textarea
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              required
              minLength={40}
              maxLength={4000}
              rows={4}
              placeholder={t("amb_motivation_placeholder")}
              className="mt-1 w-full resize-y rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2.5 text-sm outline-none focus:border-[color:var(--fd-primary)]"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold text-[color:var(--fd-muted)]">
              {t("amb_experience_label")}
            </span>
            <textarea
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              maxLength={4000}
              rows={2}
              className="mt-1 w-full resize-y rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2.5 text-sm outline-none focus:border-[color:var(--fd-primary)]"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold text-[color:var(--fd-muted)]">
              {t("amb_languages_label")}
            </span>
            <input
              type="text"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              maxLength={120}
              placeholder={t("amb_languages_placeholder")}
              className="mt-1 w-full rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2.5 text-sm outline-none focus:border-[color:var(--fd-primary)]"
            />
          </label>

          <label className="flex items-start gap-2.5 text-[12px] text-[color:var(--fd-text)]">
            <input
              type="checkbox"
              checked={charterAccepted}
              onChange={(e) => setCharterAccepted(e.target.checked)}
              required
              className="mt-0.5"
            />
            <span>{t("amb_charter_accept")}</span>
          </label>

          <button
            type="submit"
            disabled={busy || !charterAccepted}
            className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[color:var(--fd-primary)] text-sm font-bold text-white disabled:opacity-40"
          >
            {busy ? "…" : t("amb_submit")}
          </button>
        </form>
      ) : null}

      <p className="mt-8 text-center text-[11px] leading-relaxed text-[color:var(--fd-muted)]">
        {t("amb_disclaimer")}
      </p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import {
  AMBASSADOR_CASHBACK_USD,
  AMBASSADOR_DISCOUNT_PERCENT,
} from "@/lib/hackathon/promo-types";
import { HACKATHON_PRICE_USD } from "@/lib/hackathon/constants";
import { ambassadorFormCopy } from "@/lib/hackathon/ambassador-ui-copy";

type ExistingPromo = {
  code: string;
  dashboardToken: string;
  dashboardUrl: string;
  shareUrl: string;
  discountPercent: number;
  cashbackUsd: number;
  priceUsd: string;
};

export function AmbassadorPromoClient({
  initialEmail,
  initialDisplayName,
}: {
  initialEmail: string;
  initialDisplayName: string;
}) {
  const { locale } = useI18n();
  const t = ambassadorFormCopy(locale === "fr" ? "fr" : "en");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [existing, setExisting] = useState<ExistingPromo | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [copied, setCopied] = useState(false);

  const discounted = Math.round(
    (Number(HACKATHON_PRICE_USD) * (100 - AMBASSADOR_DISCOUNT_PERCENT)) / 100,
  );

  useEffect(() => {
    setErr(null);
  }, [locale]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/hackathon/ambassador", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as { promo: ExistingPromo | null };
        if (!cancelled && json.promo) setExisting(json.promo);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/hackathon/ambassador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, displayName }),
      });
      const json = (await res.json()) as {
        error?: string;
        promo?: { dashboardToken: string; dashboardUrl: string };
      };
      if (!res.ok || !json.promo) {
        const key = json.error as keyof typeof t.err | undefined;
        setErr(
          (key && key in t.err ? t.err[key] : null) ?? t.err.fallback,
        );
        return;
      }
      router.push(
        `/hackathon/promo/dashboard/${encodeURIComponent(json.promo.dashboardToken)}`,
      );
    } catch {
      setErr(t.err.network);
    } finally {
      setBusy(false);
    }
  }

  async function copyShare() {
    if (!existing?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(existing.shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  if (loadingExisting) {
    return (
      <div className="rounded-2xl bg-[color:var(--hk-surface,var(--fd-card))] px-5 py-10 text-center shadow-sm ring-1 ring-[color:var(--hk-border,var(--fd-border))]">
        <p className="text-sm text-[color:var(--hk-muted,var(--fd-muted))]">{t.loading}</p>
      </div>
    );
  }

  if (existing) {
    return (
      <div className="space-y-5 rounded-2xl bg-[color:var(--hk-surface,var(--fd-card))] p-6 shadow-sm ring-1 ring-[color:var(--hk-border,var(--fd-border))]">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--hk-accent,var(--fd-primary))]">
            {t.activeCode}
          </p>
          <p className="mt-2 font-mono text-3xl font-black tracking-[0.08em] text-[color:var(--hk-text,var(--fd-text))]">
            {existing.code}
          </p>
          <p className="mt-2 text-sm text-[color:var(--hk-muted,var(--fd-muted))]">{t.alreadyActive}</p>
        </div>

        <div className="rounded-xl bg-[color:var(--hk-soft,var(--fd-mint))] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--hk-accent,var(--fd-primary))]">
            {t.shareLink}
          </p>
          <p className="mt-1 break-all text-sm font-semibold text-[color:var(--hk-accent,var(--fd-primary))]">
            {existing.shareUrl}
          </p>
          <button
            type="button"
            onClick={() => void copyShare()}
            className="mt-3 rounded-xl bg-[color:var(--hk-accent,var(--fd-primary))] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[color:var(--fd-primary-dark)]"
          >
            {copied ? t.copied : t.copyLink}
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href={`/hackathon/promo/dashboard/${encodeURIComponent(existing.dashboardToken)}`}
            className="inline-flex min-w-0 flex-1 items-center justify-center rounded-xl bg-[color:var(--hk-accent,var(--fd-primary))] px-4 py-3 text-sm font-bold text-white transition hover:bg-[color:var(--fd-primary-dark)]"
          >
            {t.openDash}
          </a>
          <a
            href={existing.shareUrl}
            className="inline-flex items-center justify-center rounded-xl bg-[color:var(--hk-page,var(--fd-bg))] px-4 py-3 text-sm font-bold text-[color:var(--hk-text,var(--fd-text))] transition hover:bg-[color:var(--hk-soft,var(--fd-mint))]"
          >
            {t.viewLink}
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-2xl bg-[color:var(--hk-surface,var(--fd-card))] p-6 shadow-sm ring-1 ring-[color:var(--hk-border,var(--fd-border))]"
    >
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--hk-muted,var(--fd-muted))]">
          {t.displayName}
        </label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={80}
          required
          className="mt-1.5 w-full rounded-xl border border-[color:var(--hk-border,var(--fd-border))] bg-[color:var(--hk-page,var(--fd-bg))] px-3.5 py-3 text-sm font-medium text-[color:var(--hk-text,var(--fd-text))] outline-none transition focus:border-[#1F6B43] focus:ring-2 focus:ring-[#1F6B43]/15"
          placeholder={t.displayPh}
        />
      </div>
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--hk-muted,var(--fd-muted))]">
          {t.codeLabel}
        </label>
        <input
          value={code}
          onChange={(e) =>
            setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
          }
          minLength={4}
          maxLength={16}
          required
          className="mt-1.5 w-full rounded-xl border border-[color:var(--hk-border,var(--fd-border))] bg-[color:var(--hk-page,var(--fd-bg))] px-3.5 py-3 font-mono text-sm font-bold tracking-wider text-[color:var(--hk-text,var(--fd-text))] outline-none transition focus:border-[#1F6B43] focus:ring-2 focus:ring-[#1F6B43]/15"
          placeholder={t.codePh}
          autoCapitalize="characters"
        />
        <p className="mt-1.5 text-xs text-[color:var(--hk-muted,var(--fd-muted))]">{t.codeHint}</p>
      </div>

      <div className="rounded-xl bg-[color:var(--hk-soft,var(--fd-mint))] px-4 py-3.5 text-sm text-[color:var(--hk-accent,var(--fd-primary))]">
        <p className="font-bold">
          {t.discountLine(AMBASSADOR_DISCOUNT_PERCENT, discounted)}
        </p>
        <p className="mt-1">{t.cashbackLine(AMBASSADOR_CASHBACK_USD)}</p>
        <p className="mt-1">{t.seatsLine}</p>
        <p className="mt-2 break-all text-xs text-[color:var(--hk-muted,var(--fd-muted))]">
          {t.account} : {initialEmail}
        </p>
      </div>

      {err ? (
        <p className="text-sm font-medium text-red-700" role="alert">
          {err}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-[color:var(--hk-accent,var(--fd-primary))] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[color:var(--fd-primary-dark)] disabled:opacity-60"
      >
        {busy ? t.creating : t.submit}
      </button>
    </form>
  );
}

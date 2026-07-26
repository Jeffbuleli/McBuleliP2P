"use client";

import Link from "next/link";
import { McBuleliPoweredFooter } from "@/components/brand/mcbuleli-powered-footer";
import { AmbassadorPromoClient } from "@/components/hackathon/ambassador-promo-client";
import { useI18n } from "@/components/i18n-provider";
import {
  AMBASSADOR_CASHBACK_USD,
  AMBASSADOR_DISCOUNT_PERCENT,
  PROMO_CASHBACK_CLAIM_MIN_USD,
} from "@/lib/hackathon/promo-types";
import { ambassadorPageCopy } from "@/lib/hackathon/ambassador-ui-copy";

export function AmbassadorPromoPageClient({
  initialEmail,
  initialDisplayName,
}: {
  initialEmail: string;
  initialDisplayName: string;
}) {
  const { locale } = useI18n();
  const c = ambassadorPageCopy(locale === "fr" ? "fr" : "en");

  return (
    <main className="relative mx-auto max-w-lg px-4 py-10 sm:py-14">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--hk-accent,var(--fd-primary))]">
        {c.eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-[color:var(--hk-text,var(--fd-text))] sm:text-4xl">
        {c.title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[color:var(--hk-muted,var(--fd-muted))]">{c.lede}</p>

      <ul className="mt-6 space-y-2.5 rounded-2xl bg-[color:var(--hk-surface,var(--fd-card))]/90 px-4 py-4 text-sm text-[color:var(--hk-text,var(--fd-text))] shadow-sm ring-1 ring-[color:var(--hk-border,var(--fd-border))] backdrop-blur-sm">
        <li className="flex gap-2">
          <span className="shrink-0 font-bold text-[color:var(--hk-accent,var(--fd-primary))]">
            -{AMBASSADOR_DISCOUNT_PERCENT}%
          </span>
          <span>{c.ruleDiscount(AMBASSADOR_DISCOUNT_PERCENT)}</span>
        </li>
        <li className="flex gap-2">
          <span className="shrink-0 font-bold text-[color:var(--hk-accent,var(--fd-primary))]">
            +{AMBASSADOR_CASHBACK_USD} USD
          </span>
          <span>{c.ruleCashback}</span>
        </li>
        <li className="flex gap-2">
          <span className="shrink-0 font-bold text-[color:var(--hk-accent,var(--fd-primary))]">
            3 / 10+
          </span>
          <span>{c.ruleSeats}</span>
        </li>
        <li className="flex gap-2">
          <span className="shrink-0 font-bold text-[color:var(--hk-accent,var(--fd-primary))]">
            {PROMO_CASHBACK_CLAIM_MIN_USD}+ USD
          </span>
          <span>{c.ruleMin}</span>
        </li>
        <li className="text-[color:var(--hk-muted,var(--fd-muted))]">{c.ruleAnti}</li>
      </ul>

      <div className="mt-8">
        <AmbassadorPromoClient
          initialEmail={initialEmail}
          initialDisplayName={initialDisplayName}
        />
      </div>

      <p className="mt-8 text-center text-xs text-[color:var(--hk-muted,var(--fd-muted))]">
        <Link
          href="/hackathon"
          className="font-semibold text-[color:var(--hk-accent,var(--fd-primary))] hover:underline"
        >
          {c.back}
        </Link>
      </p>

      <p className="mt-6 text-center text-[10px] leading-relaxed text-[color:var(--hk-muted,var(--fd-muted))]">
        {c.legal}
      </p>
      <McBuleliPoweredFooter />
    </main>
  );
}

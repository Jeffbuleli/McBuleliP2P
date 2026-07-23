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
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1F6B43]">
        {c.eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1A1A1A] sm:text-4xl">
        {c.title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[#5c6b60]">{c.lede}</p>

      <ul className="mt-6 space-y-2.5 rounded-2xl bg-white/80 px-4 py-4 text-sm text-[#3D3D3D] shadow-sm ring-1 ring-black/[0.04] backdrop-blur-sm">
        <li className="flex gap-2">
          <span className="shrink-0 font-bold text-[#1F6B43]">
            -{AMBASSADOR_DISCOUNT_PERCENT}%
          </span>
          <span>{c.ruleDiscount(AMBASSADOR_DISCOUNT_PERCENT)}</span>
        </li>
        <li className="flex gap-2">
          <span className="shrink-0 font-bold text-[#1F6B43]">
            +{AMBASSADOR_CASHBACK_USD} USD
          </span>
          <span>{c.ruleCashback}</span>
        </li>
        <li className="flex gap-2">
          <span className="shrink-0 font-bold text-[#1F6B43]">
            {PROMO_CASHBACK_CLAIM_MIN_USD}+ USD
          </span>
          <span>{c.ruleMin}</span>
        </li>
        <li className="text-[#6B6B6B]">{c.ruleAnti}</li>
      </ul>

      <div className="mt-8">
        <AmbassadorPromoClient
          initialEmail={initialEmail}
          initialDisplayName={initialDisplayName}
        />
      </div>

      <p className="mt-8 text-center text-xs text-[#6B6B6B]">
        <Link
          href="/hackathon"
          className="font-semibold text-[#1F6B43] hover:underline"
        >
          {c.back}
        </Link>
      </p>

      <p className="mt-6 text-center text-[10px] leading-relaxed text-[#8A8A8A]">
        {c.legal}
      </p>
      <McBuleliPoweredFooter />
    </main>
  );
}

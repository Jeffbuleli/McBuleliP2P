"use client";

import Link from "next/link";
import {
  EAVEC_MARKET_CATEGORIES,
  EAVEC_MARKET_CATEGORY_EMOJI,
  type EavecMarketCategory,
} from "@/lib/eavec-market/categories";
import type { EavecMarketListingRow } from "@/lib/eavec-market/service";

const CAT_LABEL_FR: Record<EavecMarketCategory, string> = {
  agriculture: "Agriculture",
  food: "Alimentation",
  fashion: "Mode",
  services: "Services",
  home: "Maison",
  tech: "Technologie",
  other: "Autres",
};

const CAT_LABEL_EN: Record<EavecMarketCategory, string> = {
  agriculture: "Agriculture",
  food: "Food",
  fashion: "Fashion",
  services: "Services",
  home: "Home",
  tech: "Tech",
  other: "Other",
};

export function eavecMarketCategoryLabel(
  cat: EavecMarketCategory,
  locale: string,
): string {
  return locale.startsWith("fr") ? CAT_LABEL_FR[cat] : CAT_LABEL_EN[cat];
}

export function EavecMarketCategoryGrid({
  active,
  onSelect,
  locale = "fr",
}: {
  active: string | null;
  onSelect: (cat: EavecMarketCategory | null) => void;
  locale?: string;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
      {EAVEC_MARKET_CATEGORIES.map((cat) => {
        const selected = active === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelect(selected ? null : cat)}
            className={`flex min-h-[64px] flex-col items-center justify-center gap-0.5 rounded-2xl border px-1 py-2 transition active:scale-95 ${
              selected
                ? "border-[#0F2D2F] bg-[#0F2D2F] text-[#F6E8CD]"
                : "border-[color:var(--fd-border)] bg-[color:var(--fd-card)] text-[color:var(--fd-fg)]"
            }`}
          >
            <span className="text-xl leading-none" aria-hidden>
              {EAVEC_MARKET_CATEGORY_EMOJI[cat]}
            </span>
            <span className="max-w-full truncate text-[9px] font-bold">
              {eavecMarketCategoryLabel(cat, locale)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function EavecMarketListingCard({
  listing,
  locale = "fr",
}: {
  listing: EavecMarketListingRow;
  locale?: string;
}) {
  const price = `${Math.round(Number(listing.price)).toLocaleString(
    locale.startsWith("fr") ? "fr-FR" : "en-US",
  )} Fc`;

  return (
    <Link
      href={`/app/marche/${listing.id}`}
      className="flex flex-col overflow-hidden rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] transition active:scale-[0.99]"
    >
      <div className="relative aspect-[4/3] bg-[color:var(--fd-bg)]">
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[color:var(--fd-muted)]">
            <span className="text-3xl" aria-hidden>
              {EAVEC_MARKET_CATEGORY_EMOJI[listing.category]}
            </span>
          </div>
        )}
      </div>
      <div className="space-y-0.5 p-2.5">
        <p className="line-clamp-2 text-sm font-bold leading-snug text-[color:var(--fd-fg)]">
          {listing.title}
        </p>
        <p className="text-sm font-extrabold tabular-nums text-[#0F2D2F]">
          {price}
        </p>
        {listing.sellerRatingCount > 0 ? (
          <p className="text-[10px] font-semibold text-[color:var(--fd-muted)]">
            ★ {listing.sellerRatingAvg?.toFixed(1)} · {listing.sellerRatingCount}
          </p>
        ) : null}
        {listing.locationLabel ? (
          <p className="truncate text-[10px] font-medium text-[color:var(--fd-muted)]">
            {listing.locationLabel}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

/** Visual cycle: épargner → crédit → activité → vendre → revenu */
export function EavecEconomicCycleStrip({ locale = "fr" }: { locale?: string }) {
  const fr = locale.startsWith("fr");
  const steps = fr
    ? [
        { emoji: "💰", label: "Épargner" },
        { emoji: "🤝", label: "Crédit" },
        { emoji: "🛠️", label: "Activité" },
        { emoji: "🛒", label: "Vendre" },
        { emoji: "📈", label: "Revenu" },
      ]
    : [
        { emoji: "💰", label: "Save" },
        { emoji: "🤝", label: "Credit" },
        { emoji: "🛠️", label: "Activity" },
        { emoji: "🛒", label: "Sell" },
        { emoji: "📈", label: "Income" },
      ];

  return (
    <div className="rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-3">
      <p className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
        {fr ? "Cycle économique" : "Economic cycle"}
      </p>
      <div className="flex items-center justify-between gap-1">
        {steps.map((s, i) => (
          <div key={s.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F6E8CD] text-base">
              <span aria-hidden>{s.emoji}</span>
            </div>
            <span className="max-w-full truncate text-center text-[8px] font-bold uppercase text-[#0F2D2F]">
              {s.label}
            </span>
            {i < steps.length - 1 ? (
              <span className="sr-only">→</span>
            ) : null}
          </div>
        ))}
      </div>
      <Link
        href="/app/marche"
        className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-[#0F2D2F] text-sm font-bold text-[#F6E8CD] active:scale-[0.98]"
      >
        {fr ? "Aller au Marché" : "Go to Market"}
      </Link>
    </div>
  );
}

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

/** @deprecated Prefer EavecMarketCategoryPills in Marché world */
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
    <EavecMarketCategoryPills active={active} onSelect={onSelect} locale={locale} />
  );
}

export function EavecMarketCategoryPills({
  active,
  onSelect,
  locale = "fr",
}: {
  active: string | null;
  onSelect: (cat: EavecMarketCategory | null) => void;
  locale?: string;
}) {
  return (
    <div className="mk-cats" role="listbox" aria-label="Categories">
      <button
        type="button"
        role="option"
        aria-selected={active == null}
        data-active={active == null ? "true" : "false"}
        onClick={() => onSelect(null)}
        className="mk-cat"
      >
        {locale.startsWith("fr") ? "Tout" : "All"}
      </button>
      {EAVEC_MARKET_CATEGORIES.map((cat) => {
        const selected = active === cat;
        return (
          <button
            key={cat}
            type="button"
            role="option"
            aria-selected={selected}
            data-active={selected ? "true" : "false"}
            onClick={() => onSelect(selected ? null : cat)}
            className="mk-cat"
          >
            {eavecMarketCategoryLabel(cat, locale)}
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
    <Link href={`/app/marche/${listing.id}`} className="mk-card">
      <div className="mk-card-media">
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.imageUrl} alt="" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[color:var(--mk-muted)]">
            <span className="text-4xl" aria-hidden>
              {EAVEC_MARKET_CATEGORY_EMOJI[listing.category]}
            </span>
          </div>
        )}
      </div>
      <div className="mk-card-body">
        <p className="mk-card-title">{listing.title}</p>
        <p className="mk-card-price">{price}</p>
        {listing.sellerRatingCount > 0 ? (
          <p className="mk-card-meta">
            ★ {listing.sellerRatingAvg?.toFixed(1)} · {listing.sellerRatingCount}
          </p>
        ) : listing.locationLabel ? (
          <p className="mk-card-meta">{listing.locationLabel}</p>
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

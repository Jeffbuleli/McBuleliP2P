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

const CAT_HINT_FR: Record<EavecMarketCategory, string> = {
  agriculture: "Vivres & champs",
  food: "Épicerie & frais",
  fashion: "Habits & accessoires",
  services: "Savoir-faire local",
  home: "Foyer & équipement",
  tech: "Téléphones & outils",
  other: "Divers",
};

const CAT_HINT_EN: Record<EavecMarketCategory, string> = {
  agriculture: "Crops & produce",
  food: "Grocery & fresh",
  fashion: "Clothes & accessories",
  services: "Local skills",
  home: "Home & gear",
  tech: "Phones & tools",
  other: "Misc",
};

const CAT_CODE: Record<EavecMarketCategory, string> = {
  agriculture: "AGR",
  food: "ALI",
  fashion: "MOD",
  services: "SRV",
  home: "MAI",
  tech: "TEC",
  other: "DIV",
};

export function eavecMarketCategoryLabel(
  cat: EavecMarketCategory,
  locale: string,
): string {
  return locale.startsWith("fr") ? CAT_LABEL_FR[cat] : CAT_LABEL_EN[cat];
}

export function marcheListingRef(id: string, category: EavecMarketCategory): string {
  return `${CAT_CODE[category]}-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
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

export function EavecMarketRayons({
  active,
  onSelect,
  locale = "fr",
}: {
  active: string | null;
  onSelect: (cat: EavecMarketCategory | null) => void;
  locale?: string;
}) {
  const fr = locale.startsWith("fr");
  const featured: EavecMarketCategory[] = [
    "food",
    "agriculture",
    "fashion",
    "services",
  ];
  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-2">
        <p className="mk-section-label">{fr ? "Rayons" : "Aisles"}</p>
        {active ? (
          <button
            type="button"
            className="text-[11px] font-bold text-[color:var(--mk-muted)] underline"
            onClick={() => onSelect(null)}
          >
            {fr ? "Tout voir" : "See all"}
          </button>
        ) : null}
      </div>
      <div className="mk-rayons">
        {featured.map((cat) => {
          const selected = active === cat;
          return (
            <button
              key={cat}
              type="button"
              data-active={selected ? "true" : "false"}
              className="mk-rayon"
              onClick={() => onSelect(selected ? null : cat)}
            >
              <span className="mk-rayon-emoji" aria-hidden>
                {EAVEC_MARKET_CATEGORY_EMOJI[cat]}
              </span>
              <p className="mk-rayon-label">{eavecMarketCategoryLabel(cat, locale)}</p>
              <p className="mk-rayon-hint">
                {fr ? CAT_HINT_FR[cat] : CAT_HINT_EN[cat]}
              </p>
            </button>
          );
        })}
      </div>
    </div>
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
  const fr = locale.startsWith("fr");
  const price = `${Math.round(Number(listing.price)).toLocaleString(
    fr ? "fr-FR" : "en-US",
  )} Fc`;
  const inStock = listing.quantity >= 1 && listing.status === "available";
  const low = listing.quantity > 0 && listing.quantity <= 3;

  return (
    <Link href={`/app/marche/${listing.id}`} className="mk-card">
      <div className="mk-card-media">
        <span className="mk-card-badge">
          {eavecMarketCategoryLabel(listing.category, locale)}
        </span>
        {inStock ? (
          <span className="mk-card-stock" data-low={low ? "true" : "false"}>
            {low
              ? fr
                ? `Reste ${listing.quantity}`
                : `${listing.quantity} left`
              : fr
                ? "En stock"
                : "In stock"}
          </span>
        ) : null}
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
        <p className="mk-card-ref">{marcheListingRef(listing.id, listing.category)}</p>
        <p className="mk-card-title">{listing.title}</p>
        <p className="mk-card-price">{price}</p>
        {listing.locationLabel ? (
          <p className="mk-card-meta">{listing.locationLabel}</p>
        ) : listing.sellerRatingCount > 0 ? (
          <p className="mk-card-meta">
            ★ {listing.sellerRatingAvg?.toFixed(1)} · {listing.sellerRatingCount}
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

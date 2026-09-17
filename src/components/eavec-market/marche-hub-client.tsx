"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  EavecMarketCategoryPills,
  EavecMarketListingCard,
  EavecMarketRayons,
  eavecMarketCategoryLabel,
} from "@/components/eavec-market/market-ui";
import type { EavecMarketCategory } from "@/lib/eavec-market/categories";
import type { EavecMarketListingRow } from "@/lib/eavec-market/service";

type SortKey = "recent" | "price_asc" | "price_desc";

export function EavecMarcheHubClient() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<EavecMarketCategory | null>(null);
  const [sort, setSort] = useState<SortKey>("recent");
  const [listings, setListings] = useState<EavecMarketListingRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    const res = await fetch(`/api/eavec/market/listings?${params}`, {
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error ?? "load_failed");
      setListings([]);
      return;
    }
    setListings((data.listings ?? []) as EavecMarketListingRow[]);
  }, [q, category]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 200);
    return () => clearTimeout(t);
  }, [load]);

  const sorted = useMemo(() => {
    if (!listings) return null;
    const copy = [...listings];
    if (sort === "price_asc") {
      copy.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === "price_desc") {
      copy.sort((a, b) => Number(b.price) - Number(a.price));
    } else {
      copy.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return copy;
  }, [listings, sort]);

  const sectionTitle = category
    ? eavecMarketCategoryLabel(category, locale)
    : fr
      ? "Catalogue"
      : "Catalog";

  return (
    <div className="pb-10">
      <section className="mk-hero mk-rise">
        <div className="mk-hero-inner">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[rgba(247,243,235,0.55)]">
            e-AVEC · {fr ? "Communauté" : "Community"}
          </p>
          <h1 className="mk-brand">Marché</h1>
          <p className="mk-tagline">
            {fr
              ? "Chaque annonce a un visuel — parcourez les rayons, filtrez, payez en Fc."
              : "Every listing has a photo — browse aisles, filter, pay in Fc."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/app/marche/new" className="mk-hero-cta">
              {fr ? "Mettre en vente" : "List an item"}
            </Link>
            <a
              href="#mk-catalog"
              className="inline-flex min-h-12 items-center rounded-full border border-[rgba(247,243,235,0.35)] px-4 text-sm font-bold text-[#f7f3eb]"
            >
              {fr ? "Voir le catalogue" : "Browse catalog"}
            </a>
          </div>
        </div>
      </section>

      <div className="mk-search-wrap mk-rise mk-rise-delay-1">
        <span className="mk-search-icon" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
        <label className="sr-only">
          {fr ? "Que cherchez-vous ?" : "What are you looking for?"}
        </label>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            fr
              ? "Huile, tomates, couture, téléphone…"
              : "Oil, tomatoes, sewing, phone…"
          }
          className="mk-search"
        />
      </div>

      <div className="mt-5 space-y-5 px-0.5">
        <div className="mk-trust-strip mk-rise mk-rise-delay-1">
          <div className="mk-trust-item">
            <strong>{fr ? "Photo" : "Photo"}</strong>
            <span>{fr ? "Référence visuelle" : "Visual reference"}</span>
          </div>
          <div className="mk-trust-item">
            <strong>Fc</strong>
            <span>{fr ? "Paiement caisse" : "Wallet payment"}</span>
          </div>
          <div className="mk-trust-item">
            <strong>{fr ? "Validé" : "Reviewed"}</strong>
            <span>{fr ? "Avant mise en ligne" : "Before going live"}</span>
          </div>
        </div>

        <div className="mk-rise mk-rise-delay-2">
          <EavecMarketRayons
            active={category}
            onSelect={setCategory}
            locale={locale}
          />
        </div>

        <div className="mk-rise mk-rise-delay-2">
          <EavecMarketCategoryPills
            active={category}
            onSelect={setCategory}
            locale={locale}
          />
        </div>

        <div className="mk-tools mk-rise mk-rise-delay-2">
          <Link href="/app/marche/merchant" className="mk-tool mk-tool-primary">
            {fr ? "Marchand" : "Merchant"}
          </Link>
          <Link href="/app/marche/mine" className="mk-tool">
            {fr ? "Mes annonces" : "My listings"}
          </Link>
          <Link href="/app/marche/orders" className="mk-tool">
            {fr ? "Commandes" : "Orders"}
          </Link>
        </div>

        <div id="mk-catalog" className="mk-rise mk-rise-delay-3 scroll-mt-4">
          <div className="mb-2 flex items-end justify-between gap-2">
            <div>
              <p className="mk-section-label">{sectionTitle}</p>
              {sorted && sorted.length > 0 ? (
                <p className="mt-0.5 text-[11px] font-semibold text-[color:var(--mk-muted)]">
                  {sorted.length} {fr ? "références" : "items"}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mb-3 mk-sort">
            {(
              [
                ["recent", fr ? "Récents" : "Newest"],
                ["price_asc", fr ? "Prix ↑" : "Price ↑"],
                ["price_desc", fr ? "Prix ↓" : "Price ↓"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className="mk-sort-btn"
                data-active={sort === key ? "true" : "false"}
                onClick={() => setSort(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {err ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {err}
            </p>
          ) : null}

          {sorted === null ? (
            <div className="mk-grid">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="mk-card-media animate-pulse opacity-60"
                  style={{
                    background:
                      "linear-gradient(90deg,#ebe6dc 25%,#f7f3eb 50%,#ebe6dc 75%)",
                    backgroundSize: "200% 100%",
                  }}
                />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="mk-empty">
              <p
                className="text-xl font-extrabold tracking-tight"
                style={{ fontFamily: "var(--mk-display)" }}
              >
                {fr ? "Le rayon est encore vide" : "The aisle is still empty"}
              </p>
              <p className="max-w-xs text-sm text-[color:var(--mk-muted)]">
                {fr
                  ? "Publiez la première référence — un agent valide avant la mise en ligne."
                  : "Post the first item — an agent reviews before it goes live."}
              </p>
              <Link href="/app/marche/new" className="mk-btn-primary mt-1 max-w-[14rem]">
                {fr ? "Publier" : "Publish"}
              </Link>
            </div>
          ) : (
            <div className="mk-grid">
              {sorted.map((l, i) => (
                <div
                  key={l.id}
                  className="mk-rise"
                  style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
                >
                  <EavecMarketListingCard listing={l} locale={locale} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

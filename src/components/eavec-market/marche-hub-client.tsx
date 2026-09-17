"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  EavecMarketCategoryPills,
  EavecMarketListingCard,
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

  return (
    <div className="pb-10">
      <div className="mk-rise flex items-center justify-between gap-2 px-0.5 pb-2 pt-2">
        <Link
          href="/app"
          className="mk-icon-btn"
          aria-label={fr ? "Retour à l’app" : "Back to app"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M15 6l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <Link href="/app/marche/orders" className="mk-icon-btn" aria-label={fr ? "Commandes" : "Orders"}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M7 7h14l-1.4 10.2a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 4H2"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>

      <section className="mk-hero mk-rise">
        <div className="mk-hero-inner">
          <h1 className="mk-brand">Marché</h1>
          <p className="mk-tagline">
            {fr
              ? "Achetez et vendez dans la communauté — paiement en Fc."
              : "Buy and sell in the community — pay in Fc."}
          </p>
          <Link href="/app/marche/new" className="mk-hero-cta">
            {fr ? "Vendre" : "Sell"}
          </Link>
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
          {fr ? "Rechercher" : "Search"}
        </label>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={fr ? "Rechercher…" : "Search…"}
          className="mk-search"
        />
      </div>

      <div className="mt-4 space-y-4 px-0.5">
        <div className="mk-rise mk-rise-delay-2">
          <EavecMarketCategoryPills
            active={category}
            onSelect={setCategory}
            locale={locale}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mk-rise mk-rise-delay-2">
          <div className="mk-tools">
            <Link href="/app/marche/mine" className="mk-tool">
              {fr ? "Mes annonces" : "My listings"}
            </Link>
            <Link href="/app/marche/orders" className="mk-tool">
              {fr ? "Commandes" : "Orders"}
            </Link>
            <Link href="/app/marche/merchant" className="mk-tool">
              {fr ? "Marchand" : "Merchant"}
            </Link>
          </div>
          <div className="mk-sort">
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
        </div>

        <div id="mk-catalog" className="mk-rise mk-rise-delay-3">
          {category ? (
            <p className="mb-3 text-sm font-bold text-[color:var(--mk-ink)]">
              {eavecMarketCategoryLabel(category, locale)}
              {sorted && sorted.length > 0 ? (
                <span className="ml-2 font-semibold text-[color:var(--mk-muted)]">
                  · {sorted.length}
                </span>
              ) : null}
            </p>
          ) : null}

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
                className="text-lg font-extrabold tracking-tight"
                style={{ fontFamily: "var(--mk-display)" }}
              >
                {fr ? "Aucune annonce" : "No listings"}
              </p>
              <Link href="/app/marche/new" className="mk-btn-primary mt-1 max-w-[12rem]">
                {fr ? "Publier" : "Publish"}
              </Link>
            </div>
          ) : (
            <div className="mk-grid">
              {sorted.map((l) => (
                <EavecMarketListingCard key={l.id} listing={l} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

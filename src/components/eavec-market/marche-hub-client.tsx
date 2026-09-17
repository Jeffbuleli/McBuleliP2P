"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  EavecMarketCategoryPills,
  EavecMarketListingCard,
} from "@/components/eavec-market/market-ui";
import type { EavecMarketCategory } from "@/lib/eavec-market/categories";
import type { EavecMarketListingRow } from "@/lib/eavec-market/service";

export function EavecMarcheHubClient() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<EavecMarketCategory | null>(null);
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

  return (
    <div className="pb-10">
      <section className="mk-hero mk-rise">
        <div className="mk-hero-inner">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[rgba(244,247,246,0.55)]">
            e-AVEC
          </p>
          <h1 className="mk-brand">Marché</h1>
          <p className="mk-tagline">
            {fr
              ? "Le commerce de la communauté — sélection soignée, paiement en Fc."
              : "Community commerce — curated finds, pay in Fc."}
          </p>
          <Link href="/app/marche/new" className="mk-hero-cta">
            {fr ? "Mettre en vente" : "List an item"}
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
          {fr ? "Que cherchez-vous ?" : "What are you looking for?"}
        </label>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={fr ? "Que cherchez-vous ?" : "What are you looking for?"}
          className="mk-search"
        />
      </div>

      <div className="mt-5 space-y-5 px-0.5">
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

        <div className="mk-rise mk-rise-delay-3">
          <div className="mb-3 flex items-end justify-between gap-2">
            <p className="mk-section-label">
              {fr ? "Sélection" : "Featured"}
            </p>
            {listings && listings.length > 0 ? (
              <p className="text-[11px] font-semibold text-[color:var(--mk-muted)]">
                {listings.length} {fr ? "annonces" : "listings"}
              </p>
            ) : null}
          </div>

          {err ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {err}
            </p>
          ) : null}

          {listings === null ? (
            <div className="mk-grid">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="mk-card-media animate-pulse opacity-60"
                  style={{
                    background:
                      "linear-gradient(90deg,#d8e4e1 25%,#e8eef0 50%,#d8e4e1 75%)",
                    backgroundSize: "200% 100%",
                  }}
                />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="mk-empty">
              <p
                className="font-[family-name:var(--mk-display)] text-xl font-extrabold tracking-tight"
                style={{ fontFamily: "var(--mk-display)" }}
              >
                {fr ? "Le rayon est encore vide" : "The aisle is still empty"}
              </p>
              <p className="max-w-xs text-sm text-[color:var(--mk-muted)]">
                {fr
                  ? "Publiez la première annonce — un agent valide avant la mise en ligne."
                  : "Post the first listing — an agent reviews before it goes live."}
              </p>
              <Link href="/app/marche/new" className="mk-btn-primary mt-1 max-w-[14rem]">
                {fr ? "Publier" : "Publish"}
              </Link>
            </div>
          ) : (
            <div className="mk-grid">
              {listings.map((l, i) => (
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

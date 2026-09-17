"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  EavecMarketCategoryGrid,
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
    <div className="space-y-4 pb-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-[#0F2D2F]">
            {fr ? "Marché" : "Market"}
          </h1>
          <p className="text-xs text-[color:var(--fd-muted)]">
            {fr ? "Acheter et vendre dans la communauté" : "Buy and sell in the community"}
          </p>
        </div>
        <Link
          href="/app/marche/new"
          className="flex h-11 min-w-11 items-center justify-center rounded-full bg-[#0F2D2F] px-4 text-sm font-bold text-[#F6E8CD] shadow-md active:scale-95"
        >
          {fr ? "Vendre" : "Sell"}
        </Link>
      </div>

      <label className="block">
        <span className="sr-only">{fr ? "Que cherchez-vous ?" : "What are you looking for?"}</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={fr ? "Que cherchez-vous ?" : "What are you looking for?"}
          className="min-h-12 w-full rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-4 text-sm font-medium outline-none ring-[#C9A227] focus:ring-2"
        />
      </label>

      <EavecMarketCategoryGrid
        active={category}
        onSelect={setCategory}
        locale={locale}
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link
          href="/app/marche/mine"
          className="shrink-0 rounded-full border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2 text-xs font-bold"
        >
          {fr ? "Mes annonces" : "My listings"}
        </Link>
        <span className="shrink-0 rounded-full border border-dashed border-[color:var(--fd-border)] px-3 py-2 text-xs font-medium text-[color:var(--fd-muted)]">
          {fr ? "Mes commandes · bientôt" : "My orders · soon"}
        </span>
      </div>

      {err ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {err}
        </p>
      ) : null}

      {listings === null ? (
        <p className="text-center text-sm text-[color:var(--fd-muted)]">…</p>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[color:var(--fd-border)] px-4 py-10 text-center">
          <span className="text-4xl" aria-hidden>
            🛒
          </span>
          <p className="text-sm font-bold text-[#0F2D2F]">
            {fr ? "Aucune annonce pour l’instant" : "No listings yet"}
          </p>
          <Link
            href="/app/marche/new"
            className="min-h-11 rounded-xl bg-[#0F2D2F] px-5 text-sm font-bold leading-[2.75rem] text-[#F6E8CD]"
          >
            {fr ? "Publier la première" : "Post the first"}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {listings.map((l) => (
            <EavecMarketListingCard key={l.id} listing={l} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { EAVEC_MARKET_CATEGORY_EMOJI } from "@/lib/eavec-market/categories";
import { eavecMarketCategoryLabel } from "@/components/eavec-market/market-ui";
import type { EavecMarketListingRow } from "@/lib/eavec-market/service";

export function EavecMarcheDetailClient({ id }: { id: string }) {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [listing, setListing] = useState<EavecMarketListingRow | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/eavec/market/listings/${id}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error ?? "not_found");
        return;
      }
      setListing(data.listing as EavecMarketListingRow);
    })();
  }, [id]);

  if (err) {
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
        {err}
      </p>
    );
  }
  if (!listing) {
    return <p className="text-center text-sm text-[color:var(--fd-muted)]">…</p>;
  }

  const price =
    listing.currency === "CDF"
      ? `${Math.round(Number(listing.price)).toLocaleString(
          fr ? "fr-FR" : "en-US",
        )} CDF`
      : `${Number(listing.price).toFixed(2)} USD`;

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-10">
      <Link
        href="/app/marche"
        className="inline-flex text-xs font-bold text-[color:var(--fd-muted)]"
      >
        ← {fr ? "Marché" : "Market"}
      </Link>

      <div className="overflow-hidden rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)]">
        <div className="aspect-[4/3] bg-[color:var(--fd-bg)]">
          {listing.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl">
              {EAVEC_MARKET_CATEGORY_EMOJI[listing.category]}
            </div>
          )}
        </div>
        <div className="space-y-2 p-4">
          <p className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
            {EAVEC_MARKET_CATEGORY_EMOJI[listing.category]}{" "}
            {eavecMarketCategoryLabel(listing.category, locale)}
          </p>
          <h1 className="text-xl font-extrabold text-[#0F2D2F]">{listing.title}</h1>
          <p className="text-2xl font-black tabular-nums text-[#0F2D2F]">{price}</p>
          {listing.locationLabel ? (
            <p className="text-sm text-[color:var(--fd-muted)]">{listing.locationLabel}</p>
          ) : null}
          {listing.description ? (
            <p className="text-sm leading-relaxed text-[color:var(--fd-fg)]">
              {listing.description}
            </p>
          ) : null}
          <p className="text-xs text-[color:var(--fd-muted)]">
            {fr ? "Vendeur" : "Seller"}:{" "}
            {listing.sellerDisplayName?.trim() || (fr ? "Membre" : "Member")}
            {" · "}
            {fr ? "Qté" : "Qty"} {listing.quantity}
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled
        className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0F2D2F]/40 text-sm font-bold text-[#F6E8CD]"
        title={fr ? "Paiement sécurisé — phase suivante" : "Secure payment — next phase"}
      >
        {fr ? "Acheter · bientôt (escrow)" : "Buy · soon (escrow)"}
      </button>
      <p className="text-center text-[11px] text-[color:var(--fd-muted)]">
        {fr
          ? "Le paiement sécurisé arrive à la phase suivante."
          : "Secure checkout comes in the next phase."}
      </p>
    </div>
  );
}

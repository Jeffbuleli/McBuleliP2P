"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { MarcheChrome } from "@/components/eavec-market/marche-chrome";
import { EAVEC_MARKET_CATEGORY_EMOJI } from "@/lib/eavec-market/categories";
import {
  eavecMarketCategoryLabel,
  marcheListingRef,
  EavecMarketListingCard,
} from "@/components/eavec-market/market-ui";
import type { EavecMarketListingRow } from "@/lib/eavec-market/service";
import { avecCdf } from "@/lib/avec/display-currency";

function goMarcheBack(
  router: { back: () => void; push: (href: string) => void },
  fallback = "/app/marche",
) {
  try {
    if (typeof window !== "undefined" && window.history.length > 1) {
      const ref = document.referrer;
      if (ref) {
        const url = new URL(ref);
        if (
          url.origin === window.location.origin &&
          url.pathname.startsWith("/app")
        ) {
          router.back();
          return;
        }
      }
    }
  } catch {
    /* ignore */
  }
  router.push(fallback);
}

export function EavecMarcheDetailClient({ id }: { id: string }) {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const router = useRouter();
  const [listing, setListing] = useState<EavecMarketListingRow | null>(null);
  const [related, setRelated] = useState<EavecMarketListingRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cdfBalance, setCdfBalance] = useState<number | null>(null);
  const [qty, setQty] = useState(1);

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

  useEffect(() => {
    if (!listing) return;
    const max = Math.min(Math.max(1, listing.quantity), 99);
    setQty((q) => Math.min(Math.max(1, q), max));
  }, [listing]);

  useEffect(() => {
    if (!listing) return;
    void fetch(
      `/api/eavec/market/listings?category=${encodeURIComponent(listing.category)}`,
      { cache: "no-store" },
    )
      .then((r) => r.json())
      .then((d) => {
        const rows = (d.listings ?? []) as EavecMarketListingRow[];
        setRelated(rows.filter((x) => x.id !== listing.id).slice(0, 4));
      })
      .catch(() => setRelated([]));
  }, [listing]);

  useEffect(() => {
    void fetch("/api/wallet/summary", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const line = (d.lines as Array<{ asset: string; balance: string }> | undefined)?.find(
          (b) => b.asset === "CDF",
        );
        setCdfBalance(line ? Number(line.balance) : 0);
      })
      .catch(() => setCdfBalance(null));
  }, []);

  const unitPrice = listing ? Number(listing.price) : 0;
  const total = useMemo(() => unitPrice * qty, [unitPrice, qty]);
  const maxQty = listing
    ? Math.min(Math.max(1, listing.quantity), 99)
    : 1;
  const inStock =
    !!listing && listing.quantity >= 1 && listing.status === "available";
  const low = inStock && listing!.quantity <= 3;
  const canBuy =
    !!listing &&
    listing.status === "available" &&
    listing.quantity >= qty &&
    qty >= 1 &&
    (cdfBalance == null || cdfBalance + 1e-9 >= total);
  const insufficient =
    cdfBalance != null && listing != null && cdfBalance + 1e-9 < total;

  async function buy() {
    if (!listing) return;
    if (cdfBalance != null && cdfBalance + 1e-9 < total) {
      setErr(
        fr
          ? `Solde Fc insuffisant (${avecCdf(total)} requis). Déposez d’abord via Mobile Money (Caisse).`
          : `Insufficient Fc balance (${avecCdf(total)} required). Deposit via Mobile Money first (Wallet).`,
      );
      return;
    }
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/eavec/market/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: listing.id,
        quantity: qty,
        paymentMethod: "wallet",
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      const map: Record<string, string> = {
        kyc_required: fr
          ? "Vérifiez votre identité (KYC) pour acheter."
          : "Verify identity (KYC) to buy.",
        wallet_insufficient_balance: fr
          ? "Solde Fc insuffisant — rechargez votre caisse."
          : "Insufficient Fc balance — top up your wallet.",
        eavec_market_own_listing: fr
          ? "Vous ne pouvez pas acheter votre annonce."
          : "You cannot buy your own listing.",
        eavec_market_wallet_only: fr
          ? "Paiement interne uniquement (solde Fc)."
          : "Internal payment only (Fc balance).",
        eavec_market_qty: fr
          ? "Stock insuffisant pour cette quantité."
          : "Not enough stock for this quantity.",
        eavec_market_listing_unavailable: fr
          ? "Cette annonce n’est plus disponible."
          : "This listing is no longer available.",
      };
      setErr(map[data.error] ?? data.error ?? "error");
      return;
    }
    router.push(`/app/marche/orders/${data.id}`);
  }

  if (err && !listing) {
    return (
      <div>
        <MarcheChrome fr={fr} showSell={false} />
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {err}
        </p>
      </div>
    );
  }
  if (!listing) {
    return (
      <div>
        <MarcheChrome fr={fr} showSell={false} />
        <p className="mt-8 text-center text-sm text-[color:var(--mk-muted)]">…</p>
      </div>
    );
  }

  const ref = marcheListingRef(listing.id, listing.category);
  const desc = listing.description?.trim().slice(0, 300) || "";

  return (
    <div className="pb-28">
      <MarcheChrome fr={fr} title={listing.title} showSell={false} />

      <div className="mk-rise mk-pdp-hero">
        <button
          type="button"
          className="mk-pdp-back"
          aria-label={fr ? "Retour" : "Back"}
          onClick={() => goMarcheBack(router)}
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
        </button>
        {low ? (
          <span className="mk-card-stock" data-low="true">
            {fr ? `Reste ${listing.quantity}` : `${listing.quantity} left`}
          </span>
        ) : inStock ? (
          <span className="mk-card-stock">
            {fr ? "En stock" : "In stock"}
          </span>
        ) : null}
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.imageUrl} alt="" />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl">
            {EAVEC_MARKET_CATEGORY_EMOJI[listing.category]}
          </div>
        )}
      </div>

      <div className="mk-rise mk-rise-delay-1 mt-4 space-y-4 px-0.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="mk-section-label">
              {eavecMarketCategoryLabel(listing.category, locale)}
            </p>
            <span className="rounded-full border border-[color:var(--mk-line)] bg-white px-2 py-0.5 text-[10px] font-bold tracking-wider text-[color:var(--mk-muted)]">
              {ref}
            </span>
          </div>
          <h1
            className="mt-2 text-[1.7rem] font-extrabold leading-tight tracking-tight text-[color:var(--mk-ink)]"
            style={{ fontFamily: "var(--mk-display)" }}
          >
            {listing.title}
          </h1>
          <p className="mt-2 text-2xl font-black tabular-nums tracking-tight text-[color:var(--mk-ink)]">
            {avecCdf(listing.price)}
            <span className="ml-2 text-sm font-semibold text-[color:var(--mk-muted)]">
              · {fr ? "unité" : "unit"}
            </span>
          </p>
        </div>

        {desc ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--mk-muted)]">
            {desc}
          </p>
        ) : null}

        <div className="mk-panel">
          <div className="mk-panel-pad space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-[color:var(--mk-ink)]">
                {fr ? "Quantité" : "Quantity"}
              </span>
              <div className="mk-qty" role="group" aria-label={fr ? "Quantité" : "Quantity"}>
                <button
                  type="button"
                  className="mk-qty-btn"
                  disabled={qty <= 1 || !inStock}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label={fr ? "Diminuer" : "Decrease"}
                >
                  −
                </button>
                <span className="mk-qty-val tabular-nums">{qty}</span>
                <button
                  type="button"
                  className="mk-qty-btn"
                  disabled={qty >= maxQty || !inStock}
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  aria-label={fr ? "Augmenter" : "Increase"}
                >
                  +
                </button>
              </div>
            </div>
            <p className="text-xs text-[color:var(--mk-muted)]">
              {fr ? "Disponible" : "Available"}: {listing.quantity}
              {" · "}
              {fr ? "Total" : "Total"}:{" "}
              <strong className="text-[color:var(--mk-ink)]">{avecCdf(total)}</strong>
            </p>

            {listing.locationLabel ? (
              <p className="text-[color:var(--mk-muted)]">{listing.locationLabel}</p>
            ) : null}
            <p className="text-[color:var(--mk-muted)]">
              {fr ? "Vendeur" : "Seller"}:{" "}
              <Link
                href={`/app/marche/seller/${listing.sellerUserId}`}
                className="font-bold text-[color:var(--mk-ink)] underline"
              >
                {listing.sellerDisplayName?.trim() || (fr ? "Membre" : "Member")}
              </Link>
              {listing.sellerTrusted ? (
                <span className="ml-2 text-[10px] font-bold uppercase text-emerald-700">
                  {fr ? "Confiance" : "Trusted"}
                </span>
              ) : null}
              {listing.sellerRatingCount > 0 ? (
                <span className="ml-2 tabular-nums">
                  ★ {listing.sellerRatingAvg?.toFixed(1)} ({listing.sellerRatingCount})
                </span>
              ) : null}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[color:var(--mk-line)] bg-white px-3.5 py-3 text-xs text-[color:var(--mk-muted)]">
          {fr ? "Votre solde" : "Your balance"}:{" "}
          <strong className="text-[color:var(--mk-ink)]">
            {cdfBalance == null ? "…" : avecCdf(cdfBalance)}
          </strong>
          {" · "}
          <Link href="/app/wallet/fiat/deposit?asset=CDF" className="font-bold underline">
            {fr ? "Recharger (MoMo)" : "Top up (MoMo)"}
          </Link>
        </div>

        <p className="text-center text-[11px] text-[color:var(--mk-muted)]">
          {fr
            ? "Paiement interne depuis votre solde Fc (sécurisé jusqu’à confirmation)."
            : "Internal payment from your Fc balance (held until you confirm)."}
        </p>

        {err ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {err}
          </p>
        ) : null}

        {related.length > 0 ? (
          <div className="pt-2">
            <p className="mk-section-label mb-3">
              {fr ? "Dans le même rayon" : "Same aisle"}
            </p>
            <div className="mk-grid">
              {related.map((l) => (
                <EavecMarketListingCard key={l.id} listing={l} locale={locale} />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mk-buy-bar">
        <button
          type="button"
          disabled={busy || !canBuy}
          onClick={() => void buy()}
          className="mk-btn-primary"
        >
          {busy
            ? "…"
            : insufficient
              ? fr
                ? "Solde insuffisant — rechargez"
                : "Insufficient balance — top up"
              : !inStock
                ? fr
                  ? "Indisponible"
                  : "Unavailable"
                : fr
                  ? `Acheter · ${avecCdf(total)}`
                  : `Buy · ${avecCdf(total)}`}
        </button>
      </div>
    </div>
  );
}

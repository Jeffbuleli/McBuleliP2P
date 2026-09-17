"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { MarcheChrome } from "@/components/eavec-market/marche-chrome";
import { EAVEC_MARKET_CATEGORY_EMOJI } from "@/lib/eavec-market/categories";
import { eavecMarketCategoryLabel } from "@/components/eavec-market/market-ui";
import type { EavecMarketListingRow } from "@/lib/eavec-market/service";
import { avecCdf } from "@/lib/avec/display-currency";

export function EavecMarcheDetailClient({ id }: { id: string }) {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const router = useRouter();
  const [listing, setListing] = useState<EavecMarketListingRow | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cdfBalance, setCdfBalance] = useState<number | null>(null);

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

  async function buy() {
    if (!listing) return;
    const price = Number(listing.price);
    if (cdfBalance != null && cdfBalance + 1e-9 < price) {
      setErr(
        fr
          ? `Solde Fc insuffisant. Déposez d’abord via Mobile Money (Caisse).`
          : `Insufficient Fc balance. Deposit via Mobile Money first (Wallet).`,
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
        quantity: 1,
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

  const priceLabel = avecCdf(listing.price);
  const canBuy =
    listing.status === "available" &&
    listing.quantity >= 1 &&
    (cdfBalance == null || cdfBalance + 1e-9 >= Number(listing.price));

  return (
    <div className="pb-28">
      <MarcheChrome fr={fr} title={listing.title} showSell={false} />

      <div className="mk-rise mt-3 overflow-hidden rounded-[1.35rem] bg-[#fff]">
        <div className="aspect-[3/4] max-h-[70vh] bg-[linear-gradient(145deg,#d8e4e1,#b7c9c4)]">
          {listing.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl">
              {EAVEC_MARKET_CATEGORY_EMOJI[listing.category]}
            </div>
          )}
        </div>
      </div>

      <div className="mk-rise mk-rise-delay-1 mt-4 space-y-3 px-0.5">
        <p className="mk-section-label">
          {eavecMarketCategoryLabel(listing.category, locale)}
        </p>
        <h1
          className="text-[1.65rem] font-extrabold leading-tight tracking-tight text-[color:var(--mk-ink)]"
          style={{ fontFamily: "var(--mk-display)" }}
        >
          {listing.title}
        </h1>
        <p className="text-2xl font-black tabular-nums tracking-tight text-[color:var(--mk-ink)]">
          {priceLabel}
        </p>

        <div className="mk-panel">
          <div className="mk-panel-pad space-y-2 text-sm">
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
            <p className="text-xs text-[color:var(--mk-muted)]">
              {fr ? "Quantité" : "Qty"} {listing.quantity}
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
            : !canBuy && cdfBalance != null && cdfBalance < Number(listing.price)
              ? fr
                ? "Solde insuffisant — rechargez"
                : "Insufficient balance — top up"
              : fr
                ? "Acheter · solde Fc"
                : "Buy · Fc balance"}
        </button>
      </div>
    </div>
  );
}

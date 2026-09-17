"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { EAVEC_MARKET_CATEGORY_EMOJI } from "@/lib/eavec-market/categories";
import { eavecMarketCategoryLabel } from "@/components/eavec-market/market-ui";
import type { EavecMarketListingRow } from "@/lib/eavec-market/service";
import { FIAT_FEE_RATE } from "@/lib/wallet-fees";
import { FiatProviderPicker } from "@/components/wallet/fiat-provider-picker";
import {
  COD_MOBILE_FALLBACK,
  detectCodMobileMethodFromPhone,
  filterCodMobileProviders,
} from "@/lib/cod-mobile-providers";
import {
  isValidCodMsisdn,
  normalizeCodPhoneNumber,
} from "@/lib/freshpay/normalize-phone";

type ProviderOption = { provider: string; label: string };

export function EavecMarcheDetailClient({ id }: { id: string }) {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const router = useRouter();
  const [listing, setListing] = useState<EavecMarketListingRow | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [payMethod, setPayMethod] = useState<"wallet" | "momo">("wallet");
  const [phone, setPhone] = useState("");
  const [provider, setProvider] = useState("");
  const [providers, setProviders] = useState<ProviderOption[]>(COD_MOBILE_FALLBACK);

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
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/config/mobile-money/providers");
        const data = await res.json().catch(() => ({}));
        const raw: ProviderOption[] = (
          (data.providers as Array<{ provider: string; label: string }>) ?? []
        ).map((p) => ({ provider: p.provider, label: p.label }));
        const use = filterCodMobileProviders(raw.length ? raw : COD_MOBILE_FALLBACK);
        if (!cancelled && use.length) setProviders(use);
      } catch {
        /* keep fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const detected = detectCodMobileMethodFromPhone(phone);
    if (!detected || detected === "africell") return;
    const match = providers.find((p) => p.provider === detected);
    if (match) setProvider(match.provider);
  }, [phone, providers]);

  const momoQuote = useMemo(() => {
    if (!listing) return null;
    const total = Number(listing.price);
    if (!Number.isFinite(total) || total <= 0) return null;
    const gross = total / (1 - FIAT_FEE_RATE);
    return {
      net: total,
      gross:
        listing.currency === "CDF"
          ? Math.round(gross)
          : Number(gross.toFixed(2)),
      feePct: Math.round(FIAT_FEE_RATE * 100),
    };
  }, [listing]);

  async function buy() {
    if (!listing) return;
    setBusy(true);
    setErr(null);

    const body: Record<string, unknown> = {
      listingId: listing.id,
      quantity: 1,
      paymentMethod: payMethod,
    };
    if (payMethod === "momo") {
      const normalized = normalizeCodPhoneNumber(phone);
      if (!isValidCodMsisdn(normalized)) {
        setBusy(false);
        setErr(fr ? "Numéro Mobile Money invalide." : "Invalid mobile money number.");
        return;
      }
      if (!provider) {
        setBusy(false);
        setErr(fr ? "Choisissez l’opérateur." : "Choose a network.");
        return;
      }
      body.phoneNumber = phone;
      body.provider = provider;
      body.providerLabel = providers.find((p) => p.provider === provider)?.label;
    }

    const res = await fetch("/api/eavec/market/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      const map: Record<string, string> = {
        kyc_required: fr
          ? "Vérifiez votre identité (KYC) pour acheter."
          : "Verify identity (KYC) to buy.",
        wallet_insufficient_balance: fr
          ? "Solde insuffisant — essayez Mobile Money."
          : "Insufficient balance — try Mobile Money.",
        eavec_market_own_listing: fr
          ? "Vous ne pouvez pas acheter votre annonce."
          : "You cannot buy your own listing.",
        wallet_fiat_deposit_rejected: fr
          ? "Paiement MoMo refusé. Vérifiez le numéro."
          : "MoMo payment rejected. Check the number.",
        wallet_fiat_paused: fr
          ? "Mobile Money temporairement indisponible."
          : "Mobile Money temporarily unavailable.",
        wallet_fiat_unconfigured: fr
          ? "Mobile Money non configuré."
          : "Mobile Money not configured.",
      };
      setErr(map[data.error] ?? data.error ?? "error");
      return;
    }
    router.push(`/app/marche/orders/${data.id}`);
  }

  if (err && !listing) {
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
          <p className="text-xs text-[color:var(--fd-muted)]">
            {fr ? "Vendeur" : "Seller"}:{" "}
            <Link
              href={`/app/marche/seller/${listing.sellerUserId}`}
              className="font-bold text-[#0F2D2F] underline"
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
            {" · "}
            {fr ? "Qté" : "Qty"} {listing.quantity}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setPayMethod("wallet")}
          className={`min-h-12 rounded-xl border text-sm font-bold ${
            payMethod === "wallet"
              ? "border-[#0F2D2F] bg-[#0F2D2F] text-[#F6E8CD]"
              : "border-[color:var(--fd-border)] bg-[color:var(--fd-card)]"
          }`}
        >
          {fr ? "Portefeuille" : "Wallet"}
        </button>
        <button
          type="button"
          onClick={() => setPayMethod("momo")}
          className={`min-h-12 rounded-xl border text-sm font-bold ${
            payMethod === "momo"
              ? "border-[#0F2D2F] bg-[#0F2D2F] text-[#F6E8CD]"
              : "border-[color:var(--fd-border)] bg-[color:var(--fd-card)]"
          }`}
        >
          Mobile Money
        </button>
      </div>

      {payMethod === "momo" ? (
        <div className="space-y-3 rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-3">
          <label className="block space-y-1">
            <span className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
              {fr ? "Téléphone MoMo" : "MoMo phone"}
            </span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder="099…"
              className="min-h-12 w-full rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-bg)] px-3 text-sm font-medium"
            />
          </label>
          <FiatProviderPicker
            providers={providers}
            value={provider}
            onChange={setProvider}
          />
          {momoQuote ? (
            <p className="text-xs text-[color:var(--fd-muted)]">
              {fr ? "À payer" : "To pay"}:{" "}
              <strong className="text-[#0F2D2F]">
                {listing.currency === "CDF"
                  ? `${momoQuote.gross} CDF`
                  : `${momoQuote.gross.toFixed(2)} USD`}
              </strong>
              {" · "}
              {fr ? `frais ${momoQuote.feePct}% inclus` : `${momoQuote.feePct}% fee included`}
            </p>
          ) : null}
          <p className="text-[11px] text-[color:var(--fd-muted)]">
            {fr
              ? "Validez la demande sur votre téléphone. Les fonds sont ensuite sécurisés jusqu’à confirmation."
              : "Approve the prompt on your phone. Funds are then held until you confirm receipt."}
          </p>
        </div>
      ) : (
        <p className="text-center text-[11px] text-[color:var(--fd-muted)]">
          {fr
            ? "Paiement immédiat depuis votre solde USD/CDF."
            : "Instant payment from your USD/CDF balance."}
        </p>
      )}

      {err ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {err}
        </p>
      ) : null}

      <button
        type="button"
        disabled={busy || listing.status !== "available" || listing.quantity < 1}
        onClick={() => void buy()}
        className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0F2D2F] text-sm font-bold text-[#F6E8CD] disabled:opacity-50"
      >
        {busy
          ? "…"
          : payMethod === "momo"
            ? fr
              ? "Payer via Mobile Money"
              : "Pay with Mobile Money"
            : fr
              ? "Acheter (portefeuille)"
              : "Buy (wallet)"}
      </button>
    </div>
  );
}

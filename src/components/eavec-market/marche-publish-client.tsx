"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  EAVEC_MARKET_CATEGORIES,
  EAVEC_MARKET_CATEGORY_EMOJI,
  type EavecMarketCategory,
} from "@/lib/eavec-market/categories";
import { eavecMarketCategoryLabel } from "@/components/eavec-market/market-ui";

export function EavecMarchePublishClient() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<EavecMarketCategory>("other");
  const [currency, setCurrency] = useState<"USD" | "CDF">("USD");
  const [kind, setKind] = useState<"product" | "service">("product");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/eavec/market/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        price,
        quantity: Number(quantity) || 1,
        locationLabel: location || null,
        category,
        currency,
        kind,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(
        data.error === "kyc_required"
          ? fr
            ? "Vérifiez votre identité (KYC) pour publier."
            : "Verify your identity (KYC) to publish."
          : (data.error ?? "error"),
      );
      return;
    }
    router.push(`/app/marche/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-10">
      <div>
        <h1 className="text-xl font-extrabold text-[#0F2D2F]">
          {fr ? "Vendre" : "Sell"}
        </h1>
        <p className="text-xs text-[color:var(--fd-muted)]">
          {fr ? "Publiez en quelques secondes" : "Publish in seconds"}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block space-y-1">
          <span className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
            {fr ? "Nom" : "Name"}
          </span>
          <input
            required
            minLength={2}
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 text-sm font-medium"
            placeholder={fr ? "Ex. Tomates fraîches" : "e.g. Fresh tomatoes"}
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block space-y-1">
            <span className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
              {fr ? "Prix" : "Price"}
            </span>
            <input
              required
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 text-sm font-medium"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
              {fr ? "Devise" : "Currency"}
            </span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as "USD" | "CDF")}
              className="min-h-12 w-full rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 text-sm font-medium"
            >
              <option value="USD">USD</option>
              <option value="CDF">CDF</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block space-y-1">
            <span className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
              {fr ? "Quantité" : "Quantity"}
            </span>
            <input
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 text-sm font-medium"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
              {fr ? "Type" : "Type"}
            </span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as "product" | "service")}
              className="min-h-12 w-full rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 text-sm font-medium"
            >
              <option value="product">{fr ? "Produit" : "Product"}</option>
              <option value="service">{fr ? "Service" : "Service"}</option>
            </select>
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
            {fr ? "Localisation" : "Location"}
          </span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 text-sm font-medium"
            placeholder={fr ? "Ex. Kinshasa, Gombe" : "e.g. Kinshasa, Gombe"}
          />
        </label>

        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
            {fr ? "Catégorie" : "Category"}
          </span>
          <div className="grid grid-cols-4 gap-2">
            {EAVEC_MARKET_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`flex min-h-[56px] flex-col items-center justify-center rounded-xl border text-[9px] font-bold ${
                  category === c
                    ? "border-[#0F2D2F] bg-[#0F2D2F] text-[#F6E8CD]"
                    : "border-[color:var(--fd-border)] bg-[color:var(--fd-card)]"
                }`}
              >
                <span className="text-lg">{EAVEC_MARKET_CATEGORY_EMOJI[c]}</span>
                {eavecMarketCategoryLabel(c, locale)}
              </button>
            ))}
          </div>
        </div>

        {err ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {err}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0F2D2F] text-sm font-bold text-[#F6E8CD] disabled:opacity-60"
        >
          {busy ? "…" : fr ? "Publier" : "Publish"}
        </button>
      </form>
    </div>
  );
}

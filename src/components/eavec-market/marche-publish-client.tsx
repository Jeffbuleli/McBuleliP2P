"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  EAVEC_MARKET_CATEGORIES,
  EAVEC_MARKET_CATEGORY_EMOJI,
  EAVEC_MARKET_IMAGE_MAX_CHARS,
  type EavecMarketCategory,
} from "@/lib/eavec-market/categories";
import { eavecMarketCategoryLabel } from "@/components/eavec-market/market-ui";

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("read_failed"));
    reader.readAsDataURL(file);
  });
}

export function EavecMarchePublishClient() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<EavecMarketCategory>("other");
  const [kind, setKind] = useState<"product" | "service">("product");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onPickPhoto(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr(fr ? "Choisissez une image." : "Choose an image.");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    if (dataUrl.length > EAVEC_MARKET_IMAGE_MAX_CHARS) {
      setErr(fr ? "Photo trop lourde (réduisez la taille)." : "Photo too large.");
      return;
    }
    setImageUrl(dataUrl);
    setErr(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrl) {
      setErr(fr ? "Ajoutez une photo du produit." : "Add a product photo.");
      return;
    }
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
        currency: "CDF",
        kind,
        imageUrl,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      const map: Record<string, string> = {
        kyc_required: fr
          ? "Vérifiez votre identité (KYC) pour publier."
          : "Verify your identity (KYC) to publish.",
        eavec_market_image_required: fr
          ? "Photo obligatoire."
          : "Photo required.",
      };
      setErr(map[data.error] ?? data.error ?? "error");
      return;
    }
    router.push("/app/marche/mine?pending=1");
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-10">
      <div>
        <h1 className="text-xl font-extrabold text-[#0F2D2F]">
          {fr ? "Vendre" : "Sell"}
        </h1>
        <p className="text-xs text-[color:var(--fd-muted)]">
          {fr
            ? "Prix en Fc. Un agent e-AVEC valide avant publication."
            : "Price in Fc. An e-AVEC agent reviews before publish."}
        </p>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
        <label className="block space-y-1">
          <span className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
            {fr ? "Photo produit" : "Product photo"}
          </span>
          <div className="overflow-hidden rounded-2xl border border-dashed border-[color:var(--fd-border)] bg-[color:var(--fd-card)]">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="flex aspect-[4/3] flex-col items-center justify-center gap-1 text-sm text-[color:var(--fd-muted)]">
                <span className="text-3xl">📷</span>
                {fr ? "Ajouter une photo" : "Add a photo"}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              required
              onChange={(e) => void onPickPhoto(e.target.files?.[0] ?? null)}
              className="w-full border-t border-[color:var(--fd-border)] px-3 py-2 text-xs"
            />
          </div>
        </label>

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
              {fr ? "Prix (Fc)" : "Price (Fc)"}
            </span>
            <input
              required
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 text-sm font-medium"
              placeholder="5000"
            />
          </label>
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
        </div>

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
          {busy
            ? "…"
            : fr
              ? "Envoyer pour validation"
              : "Submit for review"}
        </button>
      </form>
    </div>
  );
}

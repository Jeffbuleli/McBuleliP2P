"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { MarcheChrome } from "@/components/eavec-market/marche-chrome";
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
  const [description, setDescription] = useState("");
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
        description: description.trim() || null,
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

  const field =
    "min-h-12 w-full rounded-2xl border border-[color:var(--mk-line)] bg-white px-3.5 text-sm font-medium outline-none focus:border-[color:var(--mk-leaf)]";

  return (
    <div className="space-y-4 pb-10">
      <MarcheChrome fr={fr} title={fr ? "Nouvelle annonce" : "New listing"} showSell={false} />

      <div className="mk-rise px-0.5">
        <h1
          className="text-2xl font-extrabold tracking-tight text-[color:var(--mk-ink)]"
          style={{ fontFamily: "var(--mk-display)" }}
        >
          {fr ? "Vendre" : "Sell"}
        </h1>
        <p className="mt-1 text-sm text-[color:var(--mk-muted)]">
          {fr
            ? "Prix en Fc. Un agent e-AVEC valide avant publication."
            : "Price in Fc. An e-AVEC agent reviews before publish."}
        </p>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="mk-rise mk-rise-delay-1 space-y-3.5 px-0.5">
        <label className="block space-y-1.5">
          <span className="mk-section-label">{fr ? "Photo produit" : "Product photo"}</span>
          <div className="overflow-hidden rounded-[1.25rem] border border-dashed border-[color:var(--mk-line)] bg-white">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="aspect-[3/4] w-full object-cover" />
            ) : (
              <div className="flex aspect-[3/4] flex-col items-center justify-center gap-2 text-sm text-[color:var(--mk-muted)]">
                <span className="text-4xl opacity-40" aria-hidden>
                  ◻
                </span>
                {fr ? "Ajouter une photo" : "Add a photo"}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              required
              onChange={(e) => void onPickPhoto(e.target.files?.[0] ?? null)}
              className="w-full border-t border-[color:var(--mk-line)] px-3 py-2.5 text-xs"
            />
          </div>
        </label>

        <label className="block space-y-1.5">
          <span className="mk-section-label">{fr ? "Nom" : "Name"}</span>
          <input
            required
            minLength={2}
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={field}
            placeholder={fr ? "Ex. Tomates fraîches" : "e.g. Fresh tomatoes"}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="mk-section-label">
            {fr ? "Description (optionnel)" : "Description (optional)"}
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={3}
            className={`${field} min-h-[5.5rem] py-3`}
            placeholder={
              fr
                ? "Qualité, conditionnement, livraison…"
                : "Quality, packing, delivery…"
            }
          />
        </label>

        <div className="grid grid-cols-2 gap-2.5">
          <label className="block space-y-1.5">
            <span className="mk-section-label">{fr ? "Prix (Fc)" : "Price (Fc)"}</span>
            <input
              required
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={field}
              placeholder="5000"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="mk-section-label">{fr ? "Quantité" : "Quantity"}</span>
            <input
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={field}
            />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="mk-section-label">{fr ? "Type" : "Type"}</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as "product" | "service")}
            className={field}
          >
            <option value="product">{fr ? "Produit" : "Product"}</option>
            <option value="service">{fr ? "Service" : "Service"}</option>
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="mk-section-label">{fr ? "Localisation" : "Location"}</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={field}
            placeholder={fr ? "Ex. Kinshasa, Gombe" : "e.g. Kinshasa, Gombe"}
          />
        </label>

        <div className="space-y-1.5">
          <span className="mk-section-label">{fr ? "Catégorie" : "Category"}</span>
          <div className="mk-cats">
            {EAVEC_MARKET_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                data-active={category === c ? "true" : "false"}
                onClick={() => setCategory(c)}
                className="mk-cat"
              >
                <span className="mr-1" aria-hidden>
                  {EAVEC_MARKET_CATEGORY_EMOJI[c]}
                </span>
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

        <button type="submit" disabled={busy} className="mk-btn-primary">
          {busy ? "…" : fr ? "Envoyer pour validation" : "Submit for review"}
        </button>
      </form>
    </div>
  );
}

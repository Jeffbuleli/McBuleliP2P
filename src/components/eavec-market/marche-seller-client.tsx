"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { EavecMarketListingCard } from "@/components/eavec-market/market-ui";
import type { EavecMerchantProfile } from "@/lib/eavec-market/merchant";
import type { EavecMarketListingRow } from "@/lib/eavec-market/service";

export function EavecMarcheSellerClient({ userId }: { userId: string }) {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [profile, setProfile] = useState<EavecMerchantProfile | null>(null);
  const [listings, setListings] = useState<EavecMarketListingRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/eavec/market/sellers/${userId}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) {
          setErr(d.error ?? "not_found");
          return;
        }
        setProfile(d.profile as EavecMerchantProfile);
        setListings((d.listings ?? []) as EavecMarketListingRow[]);
      })
      .catch(() => setErr("error"));
  }, [userId]);

  if (err && !profile) {
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
        {err}
      </p>
    );
  }
  if (!profile) {
    return <p className="text-center text-sm text-[color:var(--fd-muted)]">…</p>;
  }

  return (
    <div className="space-y-5 pb-10">
      <Link href="/app/marche" className="text-xs font-bold text-[color:var(--fd-muted)]">
        ← {fr ? "Marché" : "Market"}
      </Link>

      <div className="rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-4">
        <h1 className="text-xl font-extrabold text-[#0F2D2F]">
          {profile.displayName?.trim() || (fr ? "Vendeur" : "Seller")}
        </h1>
        {profile.trustedMerchant ? (
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
            {fr ? "Marchand de confiance" : "Trusted merchant"}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <span className="font-bold tabular-nums text-[#0F2D2F]">
            {profile.ratingCount
              ? `★ ${profile.ratingAvg.toFixed(1)} · ${profile.ratingCount}`
              : fr
                ? "Pas encore de note"
                : "No ratings yet"}
          </span>
          <span className="text-[color:var(--fd-muted)]">
            {profile.salesCompleted} {fr ? "ventes" : "sales"}
          </span>
          {profile.kycApproved ? (
            <span className="text-emerald-700">{fr ? "KYC OK" : "KYC OK"}</span>
          ) : null}
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-extrabold text-[#0F2D2F]">
          {fr ? "Annonces actives" : "Active listings"}
        </h2>
        {listings.length === 0 ? (
          <p className="text-sm text-[color:var(--fd-muted)]">
            {fr ? "Aucune annonce disponible." : "No active listings."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {listings.map((l) => (
              <EavecMarketListingCard key={l.id} listing={l} locale={locale} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

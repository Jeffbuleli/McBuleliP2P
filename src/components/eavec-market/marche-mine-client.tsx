"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { MarcheChrome } from "@/components/eavec-market/marche-chrome";
import { EavecMarketListingCard } from "@/components/eavec-market/market-ui";
import type { EavecMarketListingRow } from "@/lib/eavec-market/service";

export function EavecMarcheMineClient() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [listings, setListings] = useState<EavecMarketListingRow[] | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/eavec/market/mine", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setListings([]);
      return;
    }
    setListings((data.listings ?? []) as EavecMarketListingRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: "paused" | "available" | "closed") {
    await fetch(`/api/eavec/market/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    void load();
  }

  const statusLabel = (s: string) => {
    const map = fr
      ? {
          pending_review: "En validation",
          available: "Publiée",
          paused: "En pause",
          sold: "Vendue",
          closed: "Fermée",
          rejected: "Refusée",
        }
      : {
          pending_review: "Pending review",
          available: "Live",
          paused: "Paused",
          sold: "Sold",
          closed: "Closed",
          rejected: "Rejected",
        };
    return (map as Record<string, string>)[s] ?? s;
  };

  return (
    <div className="space-y-4 pb-10">
      <MarcheChrome fr={fr} title={fr ? "Mes annonces" : "My listings"} />

      <p className="px-0.5 text-sm text-[color:var(--mk-muted)]">
        {fr
          ? "Les nouvelles annonces passent par validation agent."
          : "New listings go through agent review."}
      </p>

      {listings === null ? (
        <p className="text-center text-sm text-[color:var(--mk-muted)]">…</p>
      ) : listings.length === 0 ? (
        <div className="mk-empty">
          <p style={{ fontFamily: "var(--mk-display)" }} className="text-lg font-extrabold">
            {fr ? "Pas encore d’annonce." : "No listings yet."}
          </p>
          <Link href="/app/marche/new" className="mk-btn-primary max-w-[12rem]">
            {fr ? "Publier" : "Publish"}
          </Link>
        </div>
      ) : (
        <div className="mk-grid">
          {listings.map((l) => (
            <div key={l.id} className="space-y-2">
              <EavecMarketListingCard listing={l} locale={locale} />
              <p className="px-1 text-[10px] font-bold uppercase tracking-wide text-[color:var(--mk-muted)]">
                {statusLabel(l.status)}
              </p>
              <div className="flex gap-2">
                {l.status === "available" ? (
                  <button
                    type="button"
                    onClick={() => void setStatus(l.id, "paused")}
                    className="mk-tool flex-1"
                  >
                    {fr ? "Pause" : "Pause"}
                  </button>
                ) : l.status === "paused" ? (
                  <button
                    type="button"
                    onClick={() => void setStatus(l.id, "available")}
                    className="mk-tool mk-tool-primary flex-1"
                  >
                    {fr ? "Republier" : "Republish"}
                  </button>
                ) : null}
                {l.status !== "closed" && l.status !== "pending_review" ? (
                  <button
                    type="button"
                    onClick={() => void setStatus(l.id, "closed")}
                    className="mk-tool flex-1 text-rose-700"
                  >
                    {fr ? "Retirer" : "Close"}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
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
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/app/marche" className="text-xs font-bold text-[color:var(--fd-muted)]">
            ← {fr ? "Marché" : "Market"}
          </Link>
          <h1 className="text-xl font-extrabold text-[#0F2D2F]">
            {fr ? "Mes annonces" : "My listings"}
          </h1>
          <p className="text-[11px] text-[color:var(--fd-muted)]">
            {fr
              ? "Les nouvelles annonces passent par validation agent."
              : "New listings go through agent review."}
          </p>
        </div>
        <Link
          href="/app/marche/new"
          className="rounded-full bg-[#0F2D2F] px-4 py-2 text-sm font-bold text-[#F6E8CD]"
        >
          +
        </Link>
      </div>

      {listings === null ? (
        <p className="text-center text-sm text-[color:var(--fd-muted)]">…</p>
      ) : listings.length === 0 ? (
        <p className="text-center text-sm text-[color:var(--fd-muted)]">
          {fr ? "Pas encore d’annonce." : "No listings yet."}
        </p>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="space-y-2">
              <EavecMarketListingCard listing={l} locale={locale} />
              <p className="px-1 text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
                {statusLabel(l.status)}
              </p>
              <div className="flex gap-2">
                {l.status === "available" ? (
                  <button
                    type="button"
                    onClick={() => void setStatus(l.id, "paused")}
                    className="min-h-10 flex-1 rounded-xl border border-[color:var(--fd-border)] text-xs font-bold"
                  >
                    {fr ? "Pause" : "Pause"}
                  </button>
                ) : l.status === "paused" ? (
                  <button
                    type="button"
                    onClick={() => void setStatus(l.id, "available")}
                    className="min-h-10 flex-1 rounded-xl border border-[color:var(--fd-border)] text-xs font-bold"
                  >
                    {fr ? "Republier" : "Republish"}
                  </button>
                ) : null}
                {l.status !== "closed" && l.status !== "pending_review" ? (
                  <button
                    type="button"
                    onClick={() => void setStatus(l.id, "closed")}
                    className="min-h-10 flex-1 rounded-xl border border-rose-200 text-xs font-bold text-rose-700"
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

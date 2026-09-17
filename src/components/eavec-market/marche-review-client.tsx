"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import type { EavecMarketListingRow } from "@/lib/eavec-market/service";
import { avecCdf } from "@/lib/avec/display-currency";

export function EavecMarketReviewClient() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [listings, setListings] = useState<EavecMarketListingRow[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/eavec/market/review", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error ?? "error");
      setListings([]);
      return;
    }
    setListings((data.listings ?? []) as EavecMarketListingRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(id: string, action: "approve" | "reject") {
    setBusyId(id);
    setErr(null);
    const res = await fetch("/api/eavec/market/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) {
      setErr(data.error ?? "error");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-4 pb-10">
      <div>
        <Link href="/app/profile/ops" className="text-xs font-bold text-[color:var(--fd-muted)]">
          ← OPS
        </Link>
        <h1 className="text-xl font-extrabold text-[#0F2D2F]">
          {fr ? "Validation Marché" : "Market review"}
        </h1>
        <p className="text-xs text-[color:var(--fd-muted)]">
          {fr
            ? "Approuver ou refuser les annonces en attente"
            : "Approve or reject pending listings"}
        </p>
      </div>

      {err ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {err}
        </p>
      ) : null}

      {listings === null ? (
        <p className="text-center text-sm text-[color:var(--fd-muted)]">…</p>
      ) : listings.length === 0 ? (
        <p className="text-center text-sm text-[color:var(--fd-muted)]">
          {fr ? "Aucune annonce en attente." : "No pending listings."}
        </p>
      ) : (
        <ul className="space-y-3">
          {listings.map((l) => (
            <li
              key={l.id}
              className="overflow-hidden rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)]"
            >
              {l.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.imageUrl} alt="" className="aspect-[16/9] w-full object-cover" />
              ) : null}
              <div className="space-y-2 p-3">
                <p className="font-bold text-[#0F2D2F]">{l.title}</p>
                <p className="text-sm font-extrabold tabular-nums">{avecCdf(l.price)}</p>
                <p className="text-[11px] text-[color:var(--fd-muted)]">
                  {l.sellerDisplayName || "-"}
                  {l.locationLabel ? ` · ${l.locationLabel}` : ""}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === l.id}
                    onClick={() => void act(l.id, "approve")}
                    className="min-h-11 flex-1 rounded-xl bg-[#0F2D2F] text-sm font-bold text-[#F6E8CD] disabled:opacity-60"
                  >
                    {fr ? "Approuver" : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === l.id}
                    onClick={() => void act(l.id, "reject")}
                    className="min-h-11 flex-1 rounded-xl border border-rose-300 text-sm font-bold text-rose-700 disabled:opacity-60"
                  >
                    {fr ? "Refuser" : "Reject"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

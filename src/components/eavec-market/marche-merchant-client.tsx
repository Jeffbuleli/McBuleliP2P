"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { EavecMarketListingCard } from "@/components/eavec-market/market-ui";
import type { EavecMerchantProfile } from "@/lib/eavec-market/merchant";
import type { EavecMarketListingRow } from "@/lib/eavec-market/service";

type Dash = {
  profile: EavecMerchantProfile;
  disputedOrders: Array<{
    id: string;
    listingTitle: string;
    totalAmount: string;
    currency: string;
    disputeReason: string | null;
    disputedAt: string | null;
  }>;
  recentSales: Array<{
    id: string;
    listingTitle: string;
    totalAmount: string;
    currency: string;
    releasedAt: string | null;
  }>;
  listings: EavecMarketListingRow[];
};

export function EavecMarcheMerchantClient() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [dash, setDash] = useState<Dash | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/eavec/market/merchant", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) {
          setErr(d.error ?? "error");
          return;
        }
        setDash(d as Dash);
      })
      .catch(() => setErr("error"));
  }, []);

  if (err && !dash) {
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
        {err}
      </p>
    );
  }
  if (!dash) {
    return <p className="text-center text-sm text-[color:var(--fd-muted)]">…</p>;
  }

  const p = dash.profile;
  const money = (amount: string, _currency: string) =>
    `${Math.round(Number(amount)).toLocaleString(fr ? "fr-FR" : "en-US")} Fc`;

  return (
    <div className="space-y-5 pb-10">
      <div>
        <Link href="/app/marche" className="text-xs font-bold text-[color:var(--fd-muted)]">
          ← {fr ? "Marché" : "Market"}
        </Link>
        <h1 className="text-xl font-extrabold text-[#0F2D2F]">
          {fr ? "Mode Marchand" : "Merchant mode"}
        </h1>
        <p className="text-xs text-[color:var(--fd-muted)]">
          {fr
            ? "Vos ventes, notes et litiges en un coup d’œil"
            : "Your sales, ratings and disputes at a glance"}
        </p>
      </div>

      <div className="rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-[#0F2D2F]">
              {p.displayName?.trim() || (fr ? "Vous" : "You")}
            </p>
            {p.trustedMerchant ? (
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                {fr ? "Marchand de confiance" : "Trusted merchant"}
              </p>
            ) : (
              <p className="mt-1 text-[10px] text-[color:var(--fd-muted)]">
                {fr
                  ? "Badge confiance : 5 ventes · 3 notes · moyenne ≥ 4 · KYC"
                  : "Trusted badge: 5 sales · 3 ratings · avg ≥ 4 · KYC"}
              </p>
            )}
          </div>
          <Link
            href={`/app/marche/seller/${p.userId}`}
            className="text-xs font-bold text-[#0F2D2F] underline"
          >
            {fr ? "Profil public" : "Public profile"}
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={fr ? "Ventes" : "Sales"} value={String(p.salesCompleted)} />
          <Stat
            label={fr ? "Note" : "Rating"}
            value={
              p.ratingCount
                ? `${p.ratingAvg.toFixed(1)} (${p.ratingCount})`
                : "—"
            }
          />
          <Stat label={fr ? "Litiges" : "Disputes"} value={String(p.openDisputes)} />
          <Stat
            label={fr ? "Annonces" : "Listings"}
            value={String(p.activeListings)}
          />
        </div>
      </div>

      {dash.disputedOrders.length ? (
        <section className="space-y-2">
          <h2 className="text-sm font-extrabold text-[#0F2D2F]">
            {fr ? "Litiges ouverts" : "Open disputes"}
          </h2>
          <ul className="space-y-2">
            {dash.disputedOrders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/app/marche/orders/${o.id}`}
                  className="block rounded-xl border border-amber-200 bg-amber-50 px-3 py-2"
                >
                  <p className="text-sm font-bold text-[#0F2D2F]">{o.listingTitle}</p>
                  <p className="text-[11px] text-amber-900">
                    {money(o.totalAmount, o.currency)}
                    {o.disputeReason ? ` · ${o.disputeReason}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-[#0F2D2F]">
            {fr ? "Ventes récentes" : "Recent sales"}
          </h2>
          <Link href="/app/marche/orders" className="text-xs font-bold underline">
            {fr ? "Toutes" : "All"}
          </Link>
        </div>
        {dash.recentSales.length === 0 ? (
          <p className="text-sm text-[color:var(--fd-muted)]">
            {fr ? "Pas encore de vente terminée." : "No completed sales yet."}
          </p>
        ) : (
          <ul className="space-y-2">
            {dash.recentSales.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/app/marche/orders/${o.id}`}
                  className="flex items-center justify-between rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2"
                >
                  <span className="truncate text-sm font-bold">{o.listingTitle}</span>
                  <span className="shrink-0 text-sm font-extrabold tabular-nums">
                    {money(o.totalAmount, o.currency)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-[#0F2D2F]">
            {fr ? "Mes annonces" : "My listings"}
          </h2>
          <Link href="/app/marche/new" className="text-xs font-bold underline">
            {fr ? "Publier" : "Sell"}
          </Link>
        </div>
        {dash.listings.length === 0 ? (
          <p className="text-sm text-[color:var(--fd-muted)]">
            {fr ? "Aucune annonce." : "No listings."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {dash.listings.slice(0, 4).map((l) => (
              <EavecMarketListingCard key={l.id} listing={l} locale={locale} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[color:var(--fd-bg)] px-3 py-2">
      <p className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
        {label}
      </p>
      <p className="text-base font-extrabold tabular-nums text-[#0F2D2F]">{value}</p>
    </div>
  );
}

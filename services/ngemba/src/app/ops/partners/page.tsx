"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { shellMaxWidth, useDeviceClass } from "@/lib/ui/device";

type PartnerRow = {
  id: string;
  name: string;
  slug: string;
  opsRoles: string[];
  categories: string[];
  coverageProvinceIds: string[];
  coverageCommunes: string[];
  nationalFallback: boolean;
  contactHint: string | null;
};

export default function OpsPartnersPage() {
  const device = useDeviceClass();
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/ops/partners", { credentials: "include" })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          setError(
            r.status === 403
              ? "Acces reserve aux administrateurs."
              : "Impossible de charger l'annuaire.",
          );
          return;
        }
        setPartners(data.partners ?? []);
      })
      .catch(() => setError("Impossible de charger l'annuaire."));
  }, []);

  return (
    <main
      className={`ng-shell mx-auto min-h-dvh py-6 pb-16 ${shellMaxWidth(device)}`}
    >
      <Link href="/ops" className="text-sm text-ng-muted">
        ← File ops
      </Link>
      <h1 className="mt-2 text-lg font-semibold text-ng-text">
        Annuaire partenaires
      </h1>
      <p className="mt-1 text-xs text-ng-muted">
        Couverture par province / commune - orientation par proximite
      </p>

      {error ? (
        <p className="mt-6 text-sm font-medium text-ng-urgent">{error}</p>
      ) : null}

      <ul className="mt-6 space-y-3">
        {partners.map((p) => (
          <li
            key={p.id}
            className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-ng-text">{p.name}</p>
                <p className="text-xs text-ng-muted">{p.slug}</p>
              </div>
              {p.nationalFallback ? (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                  Fallback national
                </span>
              ) : (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                  Zone locale
                </span>
              )}
            </div>
            <dl className="mt-3 grid gap-2 text-xs text-ng-muted sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-ng-text">Roles</dt>
                <dd>{p.opsRoles.join(", ") || "-"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-ng-text">Categories</dt>
                <dd>
                  {p.categories.length ? p.categories.join(", ") : "Toutes"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ng-text">Provinces</dt>
                <dd>
                  {p.coverageProvinceIds.length
                    ? p.coverageProvinceIds.join(", ")
                    : "National"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ng-text">Communes</dt>
                <dd>
                  {p.coverageCommunes.length
                    ? p.coverageCommunes.join(", ")
                    : "-"}
                </dd>
              </div>
              {p.contactHint ? (
                <div className="sm:col-span-2">
                  <dt className="font-semibold text-ng-text">Contact</dt>
                  <dd>{p.contactHint}</dd>
                </div>
              ) : null}
            </dl>
          </li>
        ))}
      </ul>

      {!error && partners.length === 0 ? (
        <p className="mt-6 text-sm text-ng-muted">Chargement...</p>
      ) : null}
    </main>
  );
}

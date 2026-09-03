"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CategoryBars,
  DaySparkline,
} from "@/components/charts/ops-charts";
import { urgencyLabelFr } from "@/lib/labels";
import { shellMaxWidth, useDeviceClass } from "@/lib/ui/device";

const ObservatoryMap = dynamic(
  () =>
    import("@/components/observatory-map").then((m) => m.ObservatoryMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-[var(--ng-border)] bg-ng-surface text-sm text-ng-muted md:h-96">
        Chargement de la carte...
      </div>
    ),
  },
);

type ZoneBucket = {
  zoneKey: string;
  province: string | null;
  provinceId: string | null;
  lat: number | null;
  lng: number | null;
  count: number;
  urgencyMax: string;
  categories: Record<string, number>;
};

type MapPoint = {
  zoneKey: string;
  province: string | null;
  lat: number;
  lng: number;
  count: number;
  urgencyMax: string;
};

type Snapshot = {
  k: number;
  generatedAt: string;
  windowDays: number;
  filters: { provinceId: string | null; category: string | null };
  totalSessionsInWindow: number;
  publishedZones: ZoneBucket[];
  mapPoints: MapPoint[];
  suppressedZones: number;
  suppressedCount: number;
  byCategory: Array<{ category: string; label: string; count: number }>;
  byDay: Array<{ day: string; count: number }>;
  note: string;
};

type ProvinceOpt = { id: string; name: string };

const CATEGORY_OPTIONS: Array<{ id: string; label: string }> = [
  { id: "", label: "Toutes catégories" },
  { id: "vbg", label: "VBG" },
  { id: "sexual_violence", label: "Violence sexuelle" },
  { id: "domestic_violence", label: "Violence conjugale" },
  { id: "child_danger", label: "Enfant en danger" },
  { id: "school", label: "École / mineur" },
  { id: "assault", label: "Agression" },
  { id: "robbery", label: "Vol / braquage" },
  { id: "harassment", label: "Harcèlement" },
  { id: "accident", label: "Accident" },
  { id: "medical", label: "Médical" },
  { id: "fire", label: "Incendie" },
  { id: "flood", label: "Inondation" },
  { id: "cyber_threat", label: "Menace numérique" },
  { id: "scam", label: "Arnaque" },
  { id: "other", label: "Autre" },
  { id: "unknown", label: "À clarifier" },
];

function intensityClass(count: number, max: number): string {
  if (max <= 0) return "bg-ng-primary-muted";
  const ratio = count / max;
  if (ratio >= 0.75) return "bg-ng-urgent";
  if (ratio >= 0.45) return "bg-amber-500";
  if (ratio >= 0.25) return "bg-ng-secondary";
  return "bg-ng-primary";
}

export default function ObservatoryPage() {
  const device = useDeviceClass();
  const [days, setDays] = useState(30);
  const [provinceId, setProvinceId] = useState("");
  const [category, setCategory] = useState("");
  const [provinces, setProvinces] = useState<ProvinceOpt[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canExport, setCanExport] = useState(false);

  const query = useMemo(() => {
    const p = new URLSearchParams({ days: String(days) });
    if (provinceId) p.set("province", provinceId);
    if (category) p.set("category", category);
    return p.toString();
  }, [days, provinceId, category]);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/observatory/heatmap?${query}`, {
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(
        res.status === 403
          ? "Accès refusé pour l'observatoire."
          : "Impossible de charger l'observatoire.",
      );
      setSnapshot(null);
      return;
    }
    setSnapshot(data.snapshot ?? null);
    if (Array.isArray(data.provinces)) {
      setProvinces(data.provinces);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void fetch("/api/ops/auth")
      .then((r) => r.json())
      .then((d) => {
        setCanExport(d.role === "admin" || d.role === "partner");
      })
      .catch(() => undefined);
  }, []);

  const maxZone = snapshot?.publishedZones[0]?.count ?? 0;
  const mapPoints = snapshot?.mapPoints ?? [];

  return (
    <main
      className={`ng-shell mx-auto min-h-dvh py-6 pb-16 ${shellMaxWidth(device)}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/ops" className="text-sm text-ng-muted">
            ← File ops
          </Link>
          <h1 className="mt-2 text-lg font-semibold text-ng-text">
            Observatoire citoyen
          </h1>
          <p className="mt-1 text-xs text-ng-muted">
            Carte OSM + heatmap - centroïdes uniquement - k-anonymity
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                days === d
                  ? "bg-ng-primary text-white"
                  : "bg-ng-surface text-ng-muted ring-1 ring-[var(--ng-border)]"
              }`}
            >
              {d}j
            </button>
          ))}
          {canExport ? (
            <a
              href={`/api/observatory/export?${query}&format=csv`}
              className="rounded-full bg-ng-secondary px-3 py-1 text-xs font-semibold text-white"
            >
              Export CSV
            </a>
          ) : null}
        </div>
      </header>

      <section className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-ng-muted">
          Province
          <select
            value={provinceId}
            onChange={(e) => setProvinceId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--ng-border)] bg-ng-surface px-3 py-2 text-sm text-ng-text"
          >
            <option value="">Toutes provinces</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-ng-muted">
          Catégorie
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--ng-border)] bg-ng-surface px-3 py-2 text-sm text-ng-text"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.id || "all"} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      {error ? (
        <p className="mt-6 text-sm font-medium text-ng-urgent">{error}</p>
      ) : null}

      {!snapshot && !error ? (
        <p className="mt-6 text-sm text-ng-muted">Chargement...</p>
      ) : null}

      {snapshot ? (
        <>
          <section className="mt-6 grid grid-cols-3 gap-3">
            <Stat
              label="Alertes"
              value={String(snapshot.totalSessionsInWindow)}
            />
            <Stat
              label="Zones publiées"
              value={String(snapshot.publishedZones.length)}
            />
            <Stat
              label="Masquées"
              value={`${snapshot.suppressedZones}`}
            />
          </section>

          <p className="mt-4 text-xs leading-relaxed text-ng-muted">
            {snapshot.note}
          </p>

          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold text-ng-text">
              Carte (centroïdes)
            </h2>
            {mapPoints.length === 0 ? (
              <p className="rounded-xl border border-[var(--ng-border)] bg-ng-surface p-4 text-sm text-ng-muted">
                Aucun centroïde à afficher pour ce filtre (seuil k ou zone hors
                référentiel RDC).
              </p>
            ) : (
              <ObservatoryMap points={mapPoints} />
            )}
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-semibold text-ng-text">
              Intensité par zone
            </h2>
            {snapshot.publishedZones.length === 0 ? (
              <p className="mt-3 rounded-xl border border-[var(--ng-border)] bg-ng-surface p-4 text-sm text-ng-muted">
                Aucune zone n&apos;atteint encore le seuil k={snapshot.k}. Les
                petits volumes restent masqués pour protéger les personnes.
                {snapshot.suppressedCount > 0
                  ? ` (${snapshot.suppressedCount} signalements agrégés hors affichage)`
                  : ""}
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {snapshot.publishedZones.map((z) => (
                  <li key={z.zoneKey}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-ng-text">
                        {z.zoneKey}
                        {z.province ? (
                          <span className="font-normal text-ng-muted">
                            {" "}
                            - {z.province}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-ng-muted">
                        {z.count} - max {urgencyLabelFr(z.urgencyMax)}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-ng-primary-muted">
                      <div
                        className={`h-full rounded-full ${intensityClass(z.count, maxZone)}`}
                        style={{
                          width: `${Math.max(8, (z.count / Math.max(maxZone, 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4">
              <h2 className="mb-3 text-sm font-semibold text-ng-text">Par type</h2>
              <CategoryBars
                items={snapshot.byCategory.map((c) => ({
                  id: c.category,
                  label: c.label,
                  count: c.count,
                }))}
              />
            </div>
            <div className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4">
              <h2 className="mb-3 text-sm font-semibold text-ng-text">Par jour</h2>
              <DaySparkline days={snapshot.byDay} />
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ng-muted">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-ng-primary">{value}</p>
    </div>
  );
}

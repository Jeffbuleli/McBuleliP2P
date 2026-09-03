"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { urgencyLabelFr } from "@/lib/labels";
import { shellMaxWidth, useDeviceClass } from "@/lib/ui/device";

type ZoneBucket = {
  zoneKey: string;
  count: number;
  urgencyMax: string;
  categories: Record<string, number>;
};

type Snapshot = {
  k: number;
  generatedAt: string;
  windowDays: number;
  totalSessionsInWindow: number;
  publishedZones: ZoneBucket[];
  suppressedZones: number;
  suppressedCount: number;
  byCategory: Array<{ category: string; label: string; count: number }>;
  byDay: Array<{ day: string; count: number }>;
  note: string;
};

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
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canExport, setCanExport] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/observatory/heatmap?days=${days}`, {
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(
        res.status === 403
          ? "Acces refuse pour l'observatoire."
          : "Impossible de charger l'observatoire.",
      );
      setSnapshot(null);
      return;
    }
    setSnapshot(data.snapshot ?? null);
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void fetch("/api/ops/auth")
      .then((r) => r.json())
      .then((d) => {
        setCanExport(
          d.role === "admin" || d.role === "partner",
        );
      })
      .catch(() => undefined);
  }, []);

  const maxZone = snapshot?.publishedZones[0]?.count ?? 0;

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
            Heatmap agrégée - aucune PII - k-anonymity
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
              href={`/api/observatory/export?days=${days}&format=csv`}
              className="rounded-full bg-ng-secondary px-3 py-1 text-xs font-semibold text-white"
            >
              Export CSV
            </a>
          ) : null}
        </div>
      </header>

      {error ? (
        <p className="mt-6 text-sm font-medium text-ng-urgent">{error}</p>
      ) : null}

      {!snapshot && !error ? (
        <p className="mt-6 text-sm text-ng-muted">Chargement...</p>
      ) : null}

      {snapshot ? (
        <>
          <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat
              label="Alertes (fenêtre)"
              value={String(snapshot.totalSessionsInWindow)}
            />
            <Stat label="Zones publiées" value={String(snapshot.publishedZones.length)} />
            <Stat label="Seuil k" value={String(snapshot.k)} />
            <Stat
              label="Zones masquées"
              value={`${snapshot.suppressedZones} (${snapshot.suppressedCount})`}
            />
          </section>

          <p className="mt-4 text-xs leading-relaxed text-ng-muted">
            {snapshot.note}
          </p>

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
                      </span>
                      <span className="text-ng-muted">
                        {z.count} · max {urgencyLabelFr(z.urgencyMax)}
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
            <div>
              <h2 className="text-sm font-semibold text-ng-text">Par type</h2>
              <ul className="mt-3 space-y-2">
                {snapshot.byCategory.slice(0, 10).map((c) => (
                  <li
                    key={c.category}
                    className="flex items-center justify-between rounded-xl border border-[var(--ng-border)] bg-ng-surface px-3 py-2 text-sm"
                  >
                    <span>{c.label}</span>
                    <span className="font-semibold text-ng-primary">
                      {c.count}
                    </span>
                  </li>
                ))}
                {snapshot.byCategory.length === 0 ? (
                  <li className="text-sm text-ng-muted">Pas encore de données.</li>
                ) : null}
              </ul>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ng-text">Par jour</h2>
              <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                {[...snapshot.byDay].reverse().slice(0, 14).map((d) => (
                  <li
                    key={d.day}
                    className="flex items-center justify-between rounded-xl border border-[var(--ng-border)] bg-ng-surface px-3 py-2 text-sm"
                  >
                    <span className="font-mono text-xs">{d.day}</span>
                    <span className="font-semibold text-ng-primary">
                      {d.count}
                    </span>
                  </li>
                ))}
                {snapshot.byDay.length === 0 ? (
                  <li className="text-sm text-ng-muted">Pas encore de données.</li>
                ) : null}
              </ul>
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

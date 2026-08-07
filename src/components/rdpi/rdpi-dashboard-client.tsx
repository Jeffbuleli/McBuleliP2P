"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AvecDonut,
  AvecHorizontalBars,
} from "@/components/groups/avec-charts";
import { RDPI_BRAND } from "@/lib/rdpi/survey-questions";

type CountBucket = { label: string; value: number };
type Stats = {
  total: number;
  bySex: CountBucket[];
  byAge: CountBucket[];
  byActivity: CountBucket[];
  byProvince: CountBucket[];
  byImpactOrg: CountBucket[];
  byConsumerCost: CountBucket[];
  byOpportunity: CountBucket[];
  byThreeRegimes: CountBucket[];
  byDigitize: CountBucket[];
  likertAvg: Array<{ key: string; label: string; avg: number }>;
  obstaclesAvg: Array<{ key: string; label: string; avg: number }>;
  reformPriority: Array<{ key: string; label: string; avgRank: number }>;
  recent: Array<{
    id: string;
    fullName: string | null;
    province: string | null;
    activity: string | null;
    createdAt: string;
    impactOrg: string;
  }>;
};

const CHART_COLORS = [
  "#1E5EFF",
  "#E8B923",
  "#0A0A0A",
  "#5B8CFF",
  "#C4921A",
  "#6B7280",
  "#93A8FF",
];

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white/80 p-4 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--rdpi-muted)]">
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-rdpi-display)] text-3xl font-semibold tracking-tight text-[color:var(--rdpi-ink)]">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-[color:var(--rdpi-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

function ChartPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-black/8 bg-white/80 p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-[color:var(--rdpi-ink)]">
        {title}
      </h3>
      {children}
    </section>
  );
}

function DonutWithLegend({ items }: { items: CountBucket[] }) {
  const total = items.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <AvecDonut
        size={120}
        segments={items.map((it, i) => ({
          value: it.value,
          color: CHART_COLORS[i % CHART_COLORS.length],
        }))}
      />
      <ul className="w-full space-y-2 text-sm">
        {items.map((it, i) => (
          <li key={it.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 truncate">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="truncate text-[color:var(--rdpi-ink)]">
                {it.label}
              </span>
            </span>
            <span className="shrink-0 font-mono text-xs tabular-nums text-[color:var(--rdpi-muted)]">
              {it.value} · {Math.round((it.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RdpiDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"unauthenticated" | "forbidden" | "error" | null>(
    null,
  );
  const [email, setEmail] = useState<string | null>(null);
  const [via, setVia] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/rdpi/dashboard", { cache: "no-store" });
        if (res.status === 401) {
          if (!cancelled) setError("unauthenticated");
          return;
        }
        if (res.status === 403) {
          if (!cancelled) setError("forbidden");
          return;
        }
        const json = await res.json();
        if (!json?.ok) {
          if (!cancelled) setError("error");
          return;
        }
        if (!cancelled) {
          setStats(json.stats as Stats);
          setEmail(json.email ?? null);
          setVia(json.via ?? null);
        }
      } catch {
        if (!cancelled) setError("error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center text-sm text-[color:var(--rdpi-muted)]">
        Chargement des réponses…
      </div>
    );
  }

  if (error === "unauthenticated") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-[family-name:var(--font-rdpi-display)] text-2xl font-semibold">
          Connexion requise
        </h1>
        <p className="mt-3 text-sm text-[color:var(--rdpi-muted)]">
          L&apos;espace partenaire RDPI est réservé à l&apos;équipe RDPI Think
          Tank et aux administrateurs McBuleli.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent("/rdpi/dashboard")}`}
          className="mt-6 inline-flex rounded-full bg-[color:var(--rdpi-blue)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  if (error === "forbidden") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-[family-name:var(--font-rdpi-display)] text-2xl font-semibold">
          Accès restreint
        </h1>
        <p className="mt-3 text-sm text-[color:var(--rdpi-muted)]">
          Seuls les comptes RDPI autorisés (
          <span className="font-medium">maristote@</span> /{" "}
          <span className="font-medium">info@rdpithinktank.org</span>) et les
          administrateurs peuvent consulter les réponses.
        </p>
        <Link
          href="/rdpi"
          className="mt-6 inline-flex rounded-full border border-black/12 bg-white px-5 py-2.5 text-sm font-semibold"
        >
          Retour au questionnaire
        </Link>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center text-sm text-red-600">
        Impossible de charger les statistiques.
      </div>
    );
  }

  const topActivity = stats.byActivity[0]?.label ?? "—";
  const negImpact =
    (stats.byImpactOrg.find((x) => x.label === "Négatif")?.value ?? 0) +
    (stats.byImpactOrg.find((x) => x.label === "Très négatif")?.value ?? 0);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--rdpi-gold)]">
            Tableau de bord partenaire
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-rdpi-display)] text-3xl font-semibold tracking-tight text-[color:var(--rdpi-ink)]">
            Réponses à l&apos;enquête
          </h1>
          <p className="mt-2 text-sm text-[color:var(--rdpi-muted)]">
            Connecté · {email}
            {via === "admin" ? " (admin)" : " (RDPI)"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/rdpi/export"
            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--rdpi-ink)] px-4 py-2.5 text-sm font-semibold text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Télécharger CSV
          </a>
          <Link
            href="/rdpi"
            className="inline-flex rounded-full border border-black/12 bg-white px-4 py-2.5 text-sm font-semibold"
          >
            Voir le formulaire
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Réponses" value={stats.total} hint="Total collecté" />
        <StatCard
          label="Impact négatif"
          value={negImpact}
          hint="Négatif + Très négatif"
        />
        <StatCard
          label="Activité dominante"
          value={topActivity.length > 18 ? `${topActivity.slice(0, 18)}…` : topActivity}
        />
        <StatCard
          label="Provinces"
          value={stats.byProvince.length}
          hint="Localisations distinctes"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Répartition par sexe">
          <DonutWithLegend items={stats.bySex} />
        </ChartPanel>
        <ChartPanel title="Tranches d'âge">
          <DonutWithLegend items={stats.byAge} />
        </ChartPanel>
        <ChartPanel title="Impact sur l'organisation">
          <DonutWithLegend items={stats.byImpactOrg} />
        </ChartPanel>
        <ChartPanel title="Coût pour les consommateurs">
          <DonutWithLegend items={stats.byConsumerCost} />
        </ChartPanel>
        <ChartPanel title="Activités (top)">
          <AvecHorizontalBars
            items={stats.byActivity.slice(0, 8).map((x) => ({
              label: x.label,
              value: x.value,
              max: Math.max(...stats.byActivity.map((y) => y.value), 1),
            }))}
          />
        </ChartPanel>
        <ChartPanel title="Provinces (top)">
          <AvecHorizontalBars
            items={stats.byProvince.slice(0, 8).map((x) => ({
              label: x.label,
              value: x.value,
              max: Math.max(...stats.byProvince.map((y) => y.value), 1),
            }))}
          />
        </ChartPanel>
        <ChartPanel title="Perception (moyenne Likert 1–5)">
          <AvecHorizontalBars
            items={stats.likertAvg.map((x) => ({
              label: x.label.length > 42 ? `${x.label.slice(0, 42)}…` : x.label,
              value: x.avg,
              max: 5,
            }))}
          />
        </ChartPanel>
        <ChartPanel title="Obstacles (intensité moyenne)">
          <AvecHorizontalBars
            items={stats.obstaclesAvg.map((x) => ({
              label: x.label,
              value: x.avg,
              max: 5,
            }))}
          />
        </ChartPanel>
        <ChartPanel title="Priorités de réforme (rang moyen · 1 = plus important)">
          <ol className="space-y-2 text-sm">
            {stats.reformPriority.map((r, i) => (
              <li
                key={r.key}
                className="flex items-center justify-between gap-3 rounded-xl border border-black/6 bg-[color:var(--rdpi-paper)]/60 px-3 py-2"
              >
                <span>
                  <span className="mr-2 font-mono text-xs text-[color:var(--rdpi-blue)]">
                    #{i + 1}
                  </span>
                  {r.label}
                </span>
                <span className="font-mono text-xs tabular-nums text-[color:var(--rdpi-muted)]">
                  {r.avgRank.toFixed(1)}
                </span>
              </li>
            ))}
          </ol>
        </ChartPanel>
        <ChartPanel title="Opportunités & numérisation">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--rdpi-muted)]">
                Positionnement réglementaire
              </p>
              <DonutWithLegend items={stats.byOpportunity} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--rdpi-muted)]">
                Perception numérisée nécessaire
              </p>
              <DonutWithLegend items={stats.byDigitize} />
            </div>
          </div>
        </ChartPanel>
      </div>

      <section className="mt-4 overflow-hidden rounded-3xl border border-black/8 bg-white/80 shadow-sm">
        <div className="border-b border-black/8 px-5 py-4">
          <h3 className="text-sm font-semibold">Dernières réponses</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-black/[0.03] text-[11px] uppercase tracking-wide text-[color:var(--rdpi-muted)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Nom</th>
                <th className="px-4 py-3 font-semibold">Province</th>
                <th className="px-4 py-3 font-semibold">Activité</th>
                <th className="px-4 py-3 font-semibold">Impact</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-[color:var(--rdpi-muted)]"
                  >
                    Aucune réponse pour l&apos;instant.
                  </td>
                </tr>
              ) : (
                stats.recent.map((r) => (
                  <tr key={r.id} className="border-t border-black/6">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[color:var(--rdpi-muted)]">
                      {new Date(r.createdAt).toLocaleString("fr-CD", {
                        timeZone: "Africa/Kinshasa",
                      })}
                    </td>
                    <td className="px-4 py-3">{r.fullName ?? "—"}</td>
                    <td className="px-4 py-3">{r.province ?? "—"}</td>
                    <td className="px-4 py-3">{r.activity ?? "—"}</td>
                    <td className="px-4 py-3">{r.impactOrg || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="mt-12 border-t border-black/8 pt-8 text-center">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--rdpi-muted)]">
          Powered by
        </p>
        <Link
          href="https://x.com/McBuleli"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-[color:var(--rdpi-muted)]"
        >
          <Image
            src="/brand/logo-256.png"
            alt="McBuleli"
            width={22}
            height={22}
            className="rounded-full"
          />
          <span className="font-semibold">McBuleli</span>
        </Link>
      </footer>
    </div>
  );
}

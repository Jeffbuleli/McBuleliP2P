"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AvecDonut,
  AvecHorizontalBars,
} from "@/components/groups/avec-charts";
import { RdpiPoweredFooter } from "@/components/rdpi/rdpi-powered-footer";

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
  "#4C7DFF",
  "#C9A227",
  "#64748B",
  "#93A8FF",
];

function VisualCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[22px] border border-[#E5E5E0] bg-[#FAFAF8]/95 shadow-[0_18px_48px_-28px_rgba(34,34,34,0.45)] backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

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
    <VisualCard className="p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#78716c]">
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-rdpi-display)] text-3xl font-semibold tracking-tight text-[#0c0a09]">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-[#a8a29e]">{hint}</p> : null}
    </VisualCard>
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
    <VisualCard className="p-5">
      <h3 className="mb-4 text-sm font-bold text-[#0c0a09]">{title}</h3>
      {children}
    </VisualCard>
  );
}

function DonutWithLegend({ items }: { items: CountBucket[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-[#a8a29e]">Pas encore de données.</p>
    );
  }
  const total = items.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
      <div className="shrink-0 rounded-2xl border border-[#E5E5E0] bg-white p-3">
        <AvecDonut
          size={128}
          segments={items.map((it, i) => ({
            value: it.value,
            color: CHART_COLORS[i % CHART_COLORS.length],
          }))}
        />
      </div>
      <ul className="w-full space-y-2.5 text-sm">
        {items.map((it, i) => (
          <li
            key={it.label}
            className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E5E0] bg-white px-3 py-2"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="truncate font-medium text-[#1c1917]">
                {it.label}
              </span>
            </span>
            <span className="shrink-0 font-mono text-xs tabular-nums text-[#78716c]">
              {it.value} - {Math.round((it.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RdpiDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<
    "unauthenticated" | "forbidden" | "error" | null
  >(null);
  const [email, setEmail] = useState<string | null>(null);
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
      <div className="mx-auto max-w-5xl px-4 py-20 text-center text-sm text-[#78716c]">
        Chargement des réponses...
      </div>
    );
  }

  if (error === "unauthenticated") {
    return (
      <div className="mx-auto max-w-[440px] px-4 py-12">
        <VisualCard className="overflow-hidden !p-0 text-center">
          <div className="bg-black px-6 py-8 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--rdpi-gold)]">
              Accès RDPI
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-rdpi-display)] text-2xl font-semibold">
              Connexion requise
            </h1>
            <p className="mt-3 text-sm text-white/75">
              Cet espace est réservé à l&apos;équipe RDPI Think Tank.
            </p>
          </div>
          <div className="bg-[#FAFAF8] px-6 py-5">
            <Link
              href={`/login?next=${encodeURIComponent("/rdpi/dashboard")}`}
              className="inline-flex w-full items-center justify-center rounded-full bg-[color:var(--rdpi-blue)] px-5 py-3 text-sm font-bold text-white"
            >
              Se connecter
            </Link>
          </div>
        </VisualCard>
        <RdpiPoweredFooter />
      </div>
    );
  }

  if (error === "forbidden") {
    return (
      <div className="mx-auto max-w-[440px] px-4 py-12">
        <VisualCard className="overflow-hidden !p-0 text-center">
          <div className="bg-black px-6 py-8 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--rdpi-gold)]">
              Accès restreint
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-rdpi-display)] text-2xl font-semibold">
              Compte non autorisé
            </h1>
            <p className="mt-3 text-sm text-white/75">
              Connectez-vous avec un email RDPI (
              <span className="text-[color:var(--rdpi-gold)]">
                maristote@
              </span>{" "}
              /{" "}
              <span className="text-[color:var(--rdpi-gold)]">
                info@rdpithinktank.org
              </span>
              ).
            </p>
          </div>
          <div className="bg-[#FAFAF8] px-6 py-5">
            <Link
              href="/rdpi"
              className="inline-flex w-full items-center justify-center rounded-full border border-[#E5E5E0] bg-white px-5 py-3 text-sm font-bold"
            >
              Retour au questionnaire
            </Link>
          </div>
        </VisualCard>
        <RdpiPoweredFooter />
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

  const topActivity = stats.byActivity[0]?.label ?? "-";
  const negImpact =
    (stats.byImpactOrg.find((x) => x.label === "Négatif")?.value ?? 0) +
    (stats.byImpactOrg.find((x) => x.label === "Très négatif")?.value ?? 0);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-6">
      <VisualCard className="mb-5 overflow-hidden !p-0">
        <div className="flex flex-col gap-4 border-b border-[#E5E5E0] bg-black px-5 py-5 text-white sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--rdpi-gold)]">
              Tableau de bord
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-rdpi-display)] text-2xl font-semibold tracking-tight sm:text-3xl">
              Réponses à l&apos;enquête
            </h1>
            <p className="mt-2 text-sm text-white/70">Connecté - {email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/api/rdpi/export"
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--rdpi-gold)] px-4 py-2.5 text-sm font-bold text-black"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Télécharger CSV
            </a>
            <Link
              href="/rdpi"
              className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white"
            >
              Questionnaire
            </Link>
          </div>
        </div>
        <div className="grid gap-3 bg-[#FAFAF8] p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
          <StatCard label="Réponses" value={stats.total} hint="Total collecté" />
          <StatCard
            label="Impact négatif"
            value={negImpact}
            hint="Négatif + Très négatif"
          />
          <StatCard
            label="Activité dominante"
            value={
              topActivity.length > 18
                ? `${topActivity.slice(0, 18)}...`
                : topActivity
            }
          />
          <StatCard
            label="Provinces"
            value={stats.byProvince.length}
            hint="Localisations distinctes"
          />
        </div>
      </VisualCard>

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
        <ChartPanel title="Perception (moyenne Likert 1-5)">
          <AvecHorizontalBars
            items={stats.likertAvg.map((x) => ({
              label:
                x.label.length > 42 ? `${x.label.slice(0, 42)}...` : x.label,
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
        <ChartPanel title="Priorités de réforme (rang moyen - 1 = plus important)">
          <ol className="space-y-2 text-sm">
            {stats.reformPriority.map((r, i) => (
              <li
                key={r.key}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E5E0] bg-white px-3 py-2.5"
              >
                <span>
                  <span className="mr-2 font-mono text-xs font-bold text-[color:var(--rdpi-blue)]">
                    #{i + 1}
                  </span>
                  {r.label}
                </span>
                <span className="font-mono text-xs tabular-nums text-[#78716c]">
                  {r.avgRank.toFixed(1)}
                </span>
              </li>
            ))}
          </ol>
        </ChartPanel>
        <ChartPanel title="Opportunités & numérisation">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#78716c]">
                Positionnement réglementaire
              </p>
              <DonutWithLegend items={stats.byOpportunity} />
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#78716c]">
                Perception numérisée nécessaire
              </p>
              <DonutWithLegend items={stats.byDigitize} />
            </div>
          </div>
        </ChartPanel>
      </div>

      <VisualCard className="mt-4 overflow-hidden">
        <div className="border-b border-[#E5E5E0] px-5 py-4">
          <h3 className="text-sm font-bold">Dernières réponses</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-black/[0.03] text-[10px] uppercase tracking-wide text-[#78716c]">
              <tr>
                <th className="px-4 py-3 font-bold">Date</th>
                <th className="px-4 py-3 font-bold">Nom</th>
                <th className="px-4 py-3 font-bold">Province</th>
                <th className="px-4 py-3 font-bold">Activité</th>
                <th className="px-4 py-3 font-bold">Impact</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-[#a8a29e]"
                  >
                    Aucune réponse pour l&apos;instant.
                  </td>
                </tr>
              ) : (
                stats.recent.map((r) => (
                  <tr key={r.id} className="border-t border-[#E5E5E0]">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[#78716c]">
                      {new Date(r.createdAt).toLocaleString("fr-CD", {
                        timeZone: "Africa/Kinshasa",
                      })}
                    </td>
                    <td className="px-4 py-3">{r.fullName ?? "-"}</td>
                    <td className="px-4 py-3">{r.province ?? "-"}</td>
                    <td className="px-4 py-3">{r.activity ?? "-"}</td>
                    <td className="px-4 py-3">{r.impactOrg || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </VisualCard>

      <RdpiPoweredFooter />
    </div>
  );
}

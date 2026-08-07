"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RdpiPoweredFooter } from "@/components/rdpi/rdpi-powered-footer";
import {
  RdpiIlluChart,
  RdpiIlluShield,
  RdpiIlluSunburst,
} from "@/components/rdpi/rdpi-illustrations";
import {
  RDPI_CHART,
  RDPI_SERIES,
  RdpiDonutLegend,
  RdpiGauge,
  RdpiHorizontalBars,
  RdpiScoreRing,
  RdpiStatTile,
  RdpiVerticalBars,
} from "@/components/rdpi/rdpi-stats-visuals";

type CountBucket = { label: string; value: number; color?: string };
type Stats = {
  total: number;
  provinceCoverage: number;
  provinceTotal: number;
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
    impactOrgColor: string | null;
    email: string;
    phone: string;
    mcbuleliContactOptIn: boolean;
    foreignInvestors: string;
    concernDisposition: string;
    innovationEffects: string;
    startupMeasures: string;
    reconcileFiscal: string;
    extraObservations: string;
  }>;
};

function formatRdpiPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("243")) {
    return `+243 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  if (digits.length === 9 && digits.startsWith("8")) {
    return `+243 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return raw.trim();
}

function OpenAnswerCell({
  text,
  expanded,
}: {
  text: string;
  expanded: boolean;
}) {
  const t = text.trim();
  if (!t) {
    return <span className="text-[#a8a29e]">-</span>;
  }
  return (
    <p
      className={`max-w-[18rem] whitespace-pre-wrap break-words text-xs leading-relaxed text-[#44403c] md:max-w-[22rem] ${
        expanded ? "" : "line-clamp-3"
      }`}
    >
      {t}
    </p>
  );
}

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

export function RdpiDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<
    "unauthenticated" | "forbidden" | "unverified" | "error" | null
  >(null);
  const [email, setEmail] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pageSize, setPageSize] = useState<20 | 30 | 50>(20);
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
          const body = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          if (!cancelled) {
            setError(body?.error === "unverified" ? "unverified" : "forbidden");
          }
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
      <div className="mx-auto w-full max-w-6xl px-4 py-20 text-center text-sm text-[#78716c] sm:px-6 md:px-8">
        Chargement des réponses...
      </div>
    );
  }

  if (error === "unauthenticated") {
    return (
      <div className="mx-auto max-w-lg sm:max-w-xl md:max-w-2xl px-4 py-12">
        <VisualCard className="overflow-hidden !p-0 text-center">
          <div className="relative overflow-hidden bg-black px-6 py-8 text-white">
            <RdpiIlluSunburst className="pointer-events-none absolute -right-4 -top-2 h-28 w-28 opacity-25" />
            <RdpiIlluShield className="relative mx-auto mb-4 h-16 w-16" />
            <p className="relative text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--rdpi-gold)]">
              Accès RDPI
            </p>
            <h1 className="relative mt-2 font-[family-name:var(--font-rdpi-display)] text-2xl font-semibold">
              Connexion requise
            </h1>
            <p className="relative mt-3 text-sm text-white/75">
              Créez un compte McBuleli avec votre email professionnel{" "}
              <span className="text-[color:var(--rdpi-gold)]">
                @rdpithinktank.org
              </span>{" "}
              (email vérifié) pour consulter les réponses.
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

  if (error === "unverified") {
    return (
      <div className="mx-auto max-w-lg sm:max-w-xl md:max-w-2xl px-4 py-12">
        <VisualCard className="overflow-hidden !p-0 text-center">
          <div className="relative overflow-hidden bg-black px-6 py-8 text-white">
            <RdpiIlluSunburst className="pointer-events-none absolute -left-6 top-0 h-28 w-28 opacity-20" />
            <RdpiIlluShield className="relative mx-auto mb-4 h-16 w-16" />
            <p className="relative text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--rdpi-gold)]">
              Vérification requise
            </p>
            <h1 className="relative mt-2 font-[family-name:var(--font-rdpi-display)] text-2xl font-semibold">
              Email non vérifié
            </h1>
            <p className="relative mt-3 text-sm text-white/75">
              Confirmez votre adresse{" "}
              <span className="text-[color:var(--rdpi-gold)]">
                @rdpithinktank.org
              </span>{" "}
              sur McBuleli pour accéder aux réponses.
            </p>
          </div>
          <div className="bg-[#FAFAF8] px-6 py-5">
            <Link
              href="/verify-email/pending"
              className="inline-flex w-full items-center justify-center rounded-full bg-[color:var(--rdpi-blue)] px-5 py-3 text-sm font-bold text-white"
            >
              Vérifier mon email
            </Link>
          </div>
        </VisualCard>
        <RdpiPoweredFooter />
      </div>
    );
  }

  if (error === "forbidden") {
    return (
      <div className="mx-auto max-w-lg sm:max-w-xl md:max-w-2xl px-4 py-12">
        <VisualCard className="overflow-hidden !p-0 text-center">
          <div className="relative overflow-hidden bg-black px-6 py-8 text-white">
            <RdpiIlluSunburst className="pointer-events-none absolute -left-6 top-0 h-28 w-28 opacity-20" />
            <RdpiIlluShield className="relative mx-auto mb-4 h-16 w-16" />
            <p className="relative text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--rdpi-gold)]">
              Accès restreint
            </p>
            <h1 className="relative mt-2 font-[family-name:var(--font-rdpi-display)] text-2xl font-semibold">
              Compte non autorisé
            </h1>
            <p className="relative mt-3 text-sm text-white/75">
              Réservé aux comptes McBuleli avec un email professionnel{" "}
              <span className="text-[color:var(--rdpi-gold)]">
                @rdpithinktank.org
              </span>{" "}
              vérifié.
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
  const negImpactPct =
    stats.total > 0 ? Math.round((negImpact / stats.total) * 100) : 0;
  const impactMax = Math.max(...stats.byImpactOrg.map((y) => y.value), 1);
  const reformMax =
    Math.max(...stats.reformPriority.map((r) => r.avgRank), 1) || 1;
  const negColor =
    stats.byImpactOrg.find((x) => x.label === "Négatif")?.color ??
    RDPI_CHART.gold;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6 md:px-8">
      <VisualCard className="mb-5 overflow-hidden !p-0">
        <div className="relative flex flex-col gap-4 overflow-hidden border-b border-[#E5E5E0] bg-black px-5 py-5 text-white sm:flex-row sm:items-end sm:justify-between sm:px-6 md:px-8">
          <RdpiIlluChart className="pointer-events-none absolute -right-2 top-2 h-28 w-36 opacity-25" />
          <div className="relative">
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
          <RdpiStatTile
            label="Réponses"
            value={stats.total}
            hint="Total collecté"
            color={RDPI_CHART.blue}
            maxHint={40}
          />
          <RdpiStatTile
            label="Impact négatif"
            value={negImpact}
            hint="Négatif + Très négatif"
            color={negColor}
            maxHint={Math.max(stats.total, 1)}
          />
          <RdpiStatTile
            label="Activité dominante"
            value={
              topActivity.length > 18
                ? `${topActivity.slice(0, 18)}...`
                : topActivity
            }
            color={RDPI_CHART.soft}
          />
          <RdpiStatTile
            label="Provinces"
            value={stats.provinceCoverage ?? stats.byProvince.length}
            hint={`sur ${stats.provinceTotal ?? 26}`}
            color={RDPI_CHART.ink}
            maxHint={stats.provinceTotal ?? 26}
          />
        </div>
      </VisualCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Répartition par sexe">
          <RdpiVerticalBars
            buckets={stats.bySex.map((x, i) => ({
              label: x.label,
              count: x.value,
              color: x.color ?? RDPI_SERIES[i % RDPI_SERIES.length],
            }))}
            totalLabel={`${stats.total} réponses`}
          />
        </ChartPanel>

        <ChartPanel title="Tranches d'âge">
          <RdpiVerticalBars
            buckets={stats.byAge.map((x, i) => ({
              label: x.label,
              count: x.value,
              color: x.color ?? RDPI_SERIES[i % RDPI_SERIES.length],
            }))}
          />
        </ChartPanel>

        <ChartPanel title="Impact sur l'organisation">
          <div className="flex flex-col items-center gap-5">
            <RdpiScoreRing
              value={negImpactPct}
              label="Négatif"
              color={negColor}
            />
            <div className="w-full">
              <RdpiHorizontalBars
                items={stats.byImpactOrg.map((x) => ({
                  label: x.label,
                  value: x.value,
                  max: impactMax,
                  color: x.color,
                }))}
              />
            </div>
          </div>
        </ChartPanel>

        <ChartPanel title="Coût pour les consommateurs">
          <RdpiVerticalBars
            buckets={stats.byConsumerCost.map((x, i) => ({
              label: x.label,
              count: x.value,
              color:
                x.label === "Oui"
                  ? "#DC2626"
                  : x.label === "Non"
                    ? "#15803D"
                    : RDPI_SERIES[i % RDPI_SERIES.length],
            }))}
          />
        </ChartPanel>

        <ChartPanel title="Activités (top)">
          <RdpiHorizontalBars
            color={RDPI_CHART.blue}
            items={stats.byActivity.slice(0, 8).map((x) => ({
              label: x.label,
              value: x.value,
              max: Math.max(...stats.byActivity.map((y) => y.value), 1),
            }))}
          />
        </ChartPanel>

        <ChartPanel title="Provinces (top)">
          <RdpiHorizontalBars
            color={RDPI_CHART.gold}
            items={stats.byProvince.slice(0, 8).map((x) => ({
              label: x.label,
              value: x.value,
              max: Math.max(...stats.byProvince.map((y) => y.value), 1),
            }))}
          />
        </ChartPanel>

        <ChartPanel title="Perception (moyenne Likert 1-5)">
          <RdpiHorizontalBars
            color={RDPI_CHART.soft}
            valueDecimals={1}
            items={stats.likertAvg.map((x) => ({
              label:
                x.label.length > 42 ? `${x.label.slice(0, 42)}...` : x.label,
              value: x.avg,
              max: 5,
            }))}
          />
        </ChartPanel>

        <ChartPanel title="Obstacles (intensité moyenne)">
          {stats.obstaclesAvg.length === 0 ? (
            <p className="text-sm text-[#a8a29e]">Pas encore de données.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {stats.obstaclesAvg.map((x, i) => (
                <RdpiGauge
                  key={x.key}
                  value={x.avg}
                  max={5}
                  label={x.label}
                  color={RDPI_SERIES[i % RDPI_SERIES.length]}
                />
              ))}
            </div>
          )}
        </ChartPanel>

        <ChartPanel title="Priorités de réforme (score moyen - 1 = plus important)">
          <RdpiHorizontalBars
            color={RDPI_CHART.blue}
            valueDecimals={1}
            invertFill
            items={stats.reformPriority.map((r) => ({
              label: r.label,
              value: r.avgRank,
              max: Math.max(reformMax, 7),
            }))}
          />
        </ChartPanel>

        <ChartPanel title="Opportunités & numérisation">
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-[#78716c]">
                Positionnement réglementaire
              </p>
              <RdpiDonutLegend items={stats.byOpportunity} />
            </div>
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-[#78716c]">
                Perception numérisée nécessaire
              </p>
              <RdpiDonutLegend items={stats.byDigitize} />
            </div>
            {stats.byThreeRegimes.length > 0 ? (
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-[#78716c]">
                  Trois régimes
                </p>
                <RdpiVerticalBars
                  buckets={stats.byThreeRegimes.map((x) => ({
                    label: x.label,
                    count: x.value,
                  }))}
                />
              </div>
            ) : null}
          </div>
        </ChartPanel>
      </div>

      <VisualCard className="mt-4 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#E5E5E0] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold">Dernières réponses</h3>
            <p className="mt-1 text-xs text-[#78716c]">
              Cliquez une ligne pour afficher les réponses ouvertes en entier.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-[#78716c]">
              Afficher
            </span>
            {([20, 30, 50] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setPageSize(n);
                  setPage(0);
                  setExpandedId(null);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  pageSize === n
                    ? "bg-[color:var(--rdpi-blue)] text-white"
                    : "border border-[#E5E5E0] bg-white text-[#1c1917]"
                }`}
              >
                {n}
              </button>
            ))}
            <div className="ml-1 flex items-center gap-1">
              <button
                type="button"
                aria-label="Page précédente"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E5E0] bg-white text-sm font-bold disabled:opacity-35"
              >
                ←
              </button>
              <span className="min-w-[4.5rem] text-center font-mono text-[11px] tabular-nums text-[#78716c]">
                {stats.recent.length === 0
                  ? "0 / 0"
                  : `${page + 1} / ${Math.max(
                      1,
                      Math.ceil(stats.recent.length / pageSize),
                    )}`}
              </span>
              <button
                type="button"
                aria-label="Page suivante"
                disabled={
                  stats.recent.length === 0 ||
                  page >= Math.ceil(stats.recent.length / pageSize) - 1
                }
                onClick={() =>
                  setPage((p) =>
                    Math.min(
                      Math.max(0, Math.ceil(stats.recent.length / pageSize) - 1),
                      p + 1,
                    ),
                  )
                }
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E5E0] bg-white text-sm font-bold disabled:opacity-35"
              >
                →
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1280px] w-full text-left text-sm">
            <thead className="bg-black/[0.03] text-[10px] uppercase tracking-wide text-[#78716c]">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 font-bold">Date</th>
                <th className="whitespace-nowrap px-4 py-3 font-bold">Nom</th>
                <th className="whitespace-nowrap px-4 py-3 font-bold">Email</th>
                <th className="whitespace-nowrap px-4 py-3 font-bold">
                  Téléphone
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-bold">
                  Province
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-bold">
                  Activité
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-bold">Impact</th>
                <th className="min-w-[12rem] px-4 py-3 font-bold">
                  Investisseurs (D5)
                </th>
                <th className="min-w-[12rem] px-4 py-3 font-bold">
                  Préoccupation (G1)
                </th>
                <th className="min-w-[12rem] px-4 py-3 font-bold">
                  Effets innovation (G2)
                </th>
                <th className="min-w-[12rem] px-4 py-3 font-bold">
                  Mesures startups (G3)
                </th>
                <th className="min-w-[12rem] px-4 py-3 font-bold">
                  Conciliation (G4)
                </th>
                <th className="min-w-[12rem] px-4 py-3 font-bold">
                  Observations (G6)
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.length === 0 ? (
                <tr>
                  <td
                    colSpan={13}
                    className="px-4 py-8 text-center text-[#a8a29e]"
                  >
                    Aucune réponse pour l&apos;instant.
                  </td>
                </tr>
              ) : (
                stats.recent
                  .slice(page * pageSize, page * pageSize + pageSize)
                  .map((r) => {
                    const expanded = expandedId === r.id;
                    return (
                      <tr
                        key={r.id}
                        className={`cursor-pointer border-t border-[#E5E5E0] transition-colors ${
                          expanded
                            ? "bg-[color:var(--rdpi-blue)]/[0.04]"
                            : "hover:bg-black/[0.02]"
                        }`}
                        onClick={() =>
                          setExpandedId((id) => (id === r.id ? null : r.id))
                        }
                      >
                        <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-[#78716c]">
                          {new Date(r.createdAt).toLocaleString("fr-CD", {
                            timeZone: "Africa/Kinshasa",
                          })}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 align-top font-medium">
                          {r.fullName ?? "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 align-top text-xs">
                          {r.email ? (
                            <a
                              href={`mailto:${r.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-block font-medium text-[color:var(--rdpi-blue)] underline-offset-2 hover:underline"
                            >
                              {r.email}
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 align-top text-xs">
                          {r.phone ? (
                            <a
                              href={`https://wa.me/${r.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="font-mono tabular-nums tracking-wide text-[color:var(--rdpi-blue)] underline-offset-2 hover:underline"
                            >
                              {formatRdpiPhone(r.phone)}
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 align-top">
                          {r.province ?? "-"}
                        </td>
                        <td className="max-w-[10rem] px-4 py-3 align-top">
                          {r.activity ?? "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 align-top">
                          <span
                            className="font-semibold"
                            style={{
                              color: r.impactOrgColor ?? undefined,
                            }}
                          >
                            {r.impactOrg || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <OpenAnswerCell
                            text={r.foreignInvestors}
                            expanded={expanded}
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <OpenAnswerCell
                            text={r.concernDisposition}
                            expanded={expanded}
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <OpenAnswerCell
                            text={r.innovationEffects}
                            expanded={expanded}
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <OpenAnswerCell
                            text={r.startupMeasures}
                            expanded={expanded}
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <OpenAnswerCell
                            text={r.reconcileFiscal}
                            expanded={expanded}
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <OpenAnswerCell
                            text={r.extraObservations}
                            expanded={expanded}
                          />
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </VisualCard>

      <RdpiPoweredFooter />
    </div>
  );
}

import { readEnvKey } from "@/lib/env";
import { categoryLabelFr, urgencyLabelFr } from "@/lib/labels";
import { listSessions, type AlertSessionRecord } from "@/lib/sessions/store";

export type ZoneBucket = {
  zoneKey: string;
  count: number;
  urgencyMax: string;
  categories: Record<string, number>;
};

export type CategoryBucket = {
  category: string;
  label: string;
  count: number;
};

export type DayBucket = {
  day: string;
  count: number;
};

export type ObservatorySnapshot = {
  k: number;
  generatedAt: string;
  windowDays: number;
  totalSessionsInWindow: number;
  publishedZones: ZoneBucket[];
  suppressedZones: number;
  suppressedCount: number;
  byCategory: CategoryBucket[];
  byDay: DayBucket[];
  note: string;
};

const URGENCY_RANK: Record<string, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function kAnonymityThreshold(): number {
  const raw = Number(readEnvKey("NGEMBA_K_ANONYMITY") || "5");
  if (!Number.isFinite(raw) || raw < 1) return 5;
  return Math.min(50, Math.floor(raw));
}

function zoneKey(session: AlertSessionRecord): string {
  const commune = session.commune?.trim();
  if (commune) return commune;
  const label = session.locationLabel?.trim();
  if (label) {
    const first = label.split(",")[0]?.trim();
    if (first) return first;
  }
  return "Lieu non precise";
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function maxUrgency(a: string, b: string): string {
  return (URGENCY_RANK[a] ?? 0) >= (URGENCY_RANK[b] ?? 0) ? a : b;
}

export function buildObservatorySnapshot(
  windowDays = 30,
  sessions?: AlertSessionRecord[],
): ObservatorySnapshot {
  const k = kAnonymityThreshold();
  const all = sessions ?? listSessions(500);
  const cutoff = Date.now() - windowDays * 86_400_000;
  const inWindow = all.filter((s) => {
    const t = Date.parse(s.createdAt);
    return Number.isFinite(t) && t >= cutoff;
  });

  const zones = new Map<
    string,
    { count: number; urgencyMax: string; categories: Record<string, number> }
  >();
  const categories = new Map<string, number>();
  const days = new Map<string, number>();

  for (const s of inWindow) {
    const z = zoneKey(s);
    const cur = zones.get(z) ?? {
      count: 0,
      urgencyMax: "info",
      categories: {},
    };
    cur.count += 1;
    cur.urgencyMax = maxUrgency(cur.urgencyMax, s.urgency);
    cur.categories[s.category] = (cur.categories[s.category] ?? 0) + 1;
    zones.set(z, cur);

    categories.set(s.category, (categories.get(s.category) ?? 0) + 1);
    const d = dayKey(s.createdAt);
    days.set(d, (days.get(d) ?? 0) + 1);
  }

  const publishedZones: ZoneBucket[] = [];
  let suppressedZones = 0;
  let suppressedCount = 0;

  for (const [zoneKeyName, row] of zones) {
    if (row.count >= k) {
      publishedZones.push({
        zoneKey: zoneKeyName,
        count: row.count,
        urgencyMax: row.urgencyMax,
        categories: row.categories,
      });
    } else {
      suppressedZones += 1;
      suppressedCount += row.count;
    }
  }

  publishedZones.sort((a, b) => b.count - a.count);

  const byCategory: CategoryBucket[] = [...categories.entries()]
    .map(([category, count]) => ({
      category,
      label: categoryLabelFr(category),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const byDay: DayBucket[] = [...days.entries()]
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day));

  return {
    k,
    generatedAt: new Date().toISOString(),
    windowDays,
    totalSessionsInWindow: inWindow.length,
    publishedZones,
    suppressedZones,
    suppressedCount,
    byCategory,
    byDay,
    note:
      "Aucune PII - zones affichees seulement si count >= k (k-anonymity). " +
      "Pas de points individuels ni d'identifiants de session.",
  };
}

export function exportAnonymizedRows(
  windowDays = 30,
  sessions?: AlertSessionRecord[],
): Array<{
  day: string;
  zoneKey: string;
  category: string;
  categoryLabel: string;
  urgency: string;
  urgencyLabel: string;
  source: string;
  status: string;
}> {
  const snap = buildObservatorySnapshot(windowDays, sessions);
  const allowed = new Set(
    snap.publishedZones.map((z) => z.zoneKey.toLowerCase()),
  );

  const all = sessions ?? listSessions(500);
  const cutoff = Date.now() - windowDays * 86_400_000;

  return all
    .filter((s) => {
      const t = Date.parse(s.createdAt);
      if (!Number.isFinite(t) || t < cutoff) return false;
      return allowed.has(zoneKey(s).toLowerCase());
    })
    .map((s) => ({
      day: dayKey(s.createdAt),
      zoneKey: zoneKey(s),
      category: s.category,
      categoryLabel: categoryLabelFr(s.category),
      urgency: s.urgency,
      urgencyLabel: urgencyLabelFr(s.urgency),
      source: s.source,
      status: s.status,
    }));
}
export function csvFromAnonymized(
  rows: ReturnType<typeof exportAnonymizedRows>,
): string {
  const header =
    "day,zone_key,category,category_label,urgency,urgency_label,source,status";
  const lines = rows.map((r) =>
    [
      r.day,
      csvEscape(r.zoneKey),
      r.category,
      csvEscape(r.categoryLabel),
      r.urgency,
      csvEscape(r.urgencyLabel),
      r.source,
      r.status,
    ].join(","),
  );
  return [header, ...lines].join("\n");
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

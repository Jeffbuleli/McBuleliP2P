import { readEnvKey } from "@/lib/env";
import { categoryLabelFr, urgencyLabelFr } from "@/lib/labels";
import { listSessions, type AlertSessionRecord } from "@/lib/sessions/store";
import { resolveZoneGeo } from "@/lib/observatory/geo";

export type ZoneBucket = {
  zoneKey: string;
  province: string | null;
  provinceId: string | null;
  lat: number | null;
  lng: number | null;
  count: number;
  urgencyMax: string;
  categories: Record<string, number>;
};

export type MapPoint = {
  zoneKey: string;
  province: string | null;
  lat: number;
  lng: number;
  count: number;
  urgencyMax: string;
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

export type ObservatoryFilters = {
  provinceId?: string | null;
  category?: string | null;
};

export type ObservatorySnapshot = {
  k: number;
  generatedAt: string;
  windowDays: number;
  filters: {
    provinceId: string | null;
    category: string | null;
  };
  totalSessionsInWindow: number;
  publishedZones: ZoneBucket[];
  mapPoints: MapPoint[];
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

function sessionMatchesFilters(
  session: AlertSessionRecord,
  filters: ObservatoryFilters,
): boolean {
  if (filters.category?.trim()) {
    if (session.category !== filters.category.trim()) return false;
  }
  if (filters.provinceId?.trim()) {
    const geo = resolveZoneGeo(zoneKey(session), session.locationLabel);
    if (geo.provinceId !== filters.provinceId.trim()) return false;
  }
  return true;
}

export function buildObservatorySnapshot(
  windowDays = 30,
  sessions?: AlertSessionRecord[],
  filters: ObservatoryFilters = {},
): ObservatorySnapshot {
  const k = kAnonymityThreshold();
  const all = sessions ?? listSessions(500);
  const cutoff = Date.now() - windowDays * 86_400_000;
  const provinceId = filters.provinceId?.trim() || null;
  const category = filters.category?.trim() || null;

  const inWindow = all.filter((s) => {
    const t = Date.parse(s.createdAt);
    if (!Number.isFinite(t) || t < cutoff) return false;
    return sessionMatchesFilters(s, { provinceId, category });
  });

  const zones = new Map<
    string,
    {
      count: number;
      urgencyMax: string;
      categories: Record<string, number>;
      province: string | null;
      provinceId: string | null;
      lat: number | null;
      lng: number | null;
    }
  >();
  const categories = new Map<string, number>();
  const days = new Map<string, number>();

  for (const s of inWindow) {
    const z = zoneKey(s);
    const geo = resolveZoneGeo(z, s.locationLabel);
    const cur = zones.get(z) ?? {
      count: 0,
      urgencyMax: "info",
      categories: {},
      province: geo.province,
      provinceId: geo.provinceId,
      lat: geo.lat,
      lng: geo.lng,
    };
    cur.count += 1;
    cur.urgencyMax = maxUrgency(cur.urgencyMax, s.urgency);
    cur.categories[s.category] = (cur.categories[s.category] ?? 0) + 1;
    if (!cur.province && geo.province) {
      cur.province = geo.province;
      cur.provinceId = geo.provinceId;
    }
    if ((cur.lat == null || cur.lng == null) && geo.lat != null && geo.lng != null) {
      cur.lat = geo.lat;
      cur.lng = geo.lng;
    }
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
        province: row.province,
        provinceId: row.provinceId,
        lat: row.lat,
        lng: row.lng,
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

  const mapPoints: MapPoint[] = publishedZones
    .filter((z) => z.lat != null && z.lng != null)
    .map((z) => ({
      zoneKey: z.zoneKey,
      province: z.province,
      lat: z.lat as number,
      lng: z.lng as number,
      count: z.count,
      urgencyMax: z.urgencyMax,
    }));

  const byCategory: CategoryBucket[] = [...categories.entries()]
    .map(([cat, count]) => ({
      category: cat,
      label: categoryLabelFr(cat),
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
    filters: { provinceId, category },
    totalSessionsInWindow: inWindow.length,
    publishedZones,
    mapPoints,
    suppressedZones,
    suppressedCount,
    byCategory,
    byDay,
    note:
      "Aucune PII - zones affichees seulement si count >= k (k-anonymity). " +
      "Carte = centroides de communes/villes uniquement, pas de points individuels.",
  };
}

export function exportAnonymizedRows(
  windowDays = 30,
  sessions?: AlertSessionRecord[],
  filters: ObservatoryFilters = {},
): Array<{
  day: string;
  zoneKey: string;
  province: string;
  category: string;
  categoryLabel: string;
  urgency: string;
  urgencyLabel: string;
  source: string;
  status: string;
}> {
  const snap = buildObservatorySnapshot(windowDays, sessions, filters);
  const allowed = new Set(
    snap.publishedZones.map((z) => z.zoneKey.toLowerCase()),
  );

  const all = sessions ?? listSessions(500);
  const cutoff = Date.now() - windowDays * 86_400_000;
  const provinceId = filters.provinceId?.trim() || null;
  const category = filters.category?.trim() || null;

  return all
    .filter((s) => {
      const t = Date.parse(s.createdAt);
      if (!Number.isFinite(t) || t < cutoff) return false;
      if (!sessionMatchesFilters(s, { provinceId, category })) return false;
      return allowed.has(zoneKey(s).toLowerCase());
    })
    .map((s) => {
      const z = zoneKey(s);
      const geo = resolveZoneGeo(z, s.locationLabel);
      return {
        day: dayKey(s.createdAt),
        zoneKey: z,
        province: geo.province ?? "",
        category: s.category,
        categoryLabel: categoryLabelFr(s.category),
        urgency: s.urgency,
        urgencyLabel: urgencyLabelFr(s.urgency),
        source: s.source,
        status: s.status,
      };
    });
}

export function csvFromAnonymized(
  rows: ReturnType<typeof exportAnonymizedRows>,
): string {
  const header =
    "day,zone_key,province,category,category_label,urgency,urgency_label,source,status";
  const lines = rows.map((r) =>
    [
      r.day,
      csvEscape(r.zoneKey),
      csvEscape(r.province),
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

import { resolveSessionPlace } from "@/lib/partners/match";
import type { RequiredService } from "@/lib/response-engine/types";
import { listUnits } from "@/lib/units/store";
import type { OperationalUnit, UnitMatch } from "@/lib/units/types";

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function zoneOk(
  unit: OperationalUnit,
  provinceId: string | null,
  commune: string | null,
): boolean {
  if (!unit.zoneProvinceIds.length && !unit.zoneCommunes.length) return true;
  if (commune && unit.zoneCommunes.length) {
    const cn = norm(commune);
    if (unit.zoneCommunes.some((c) => norm(c) === cn)) return true;
  }
  if (provinceId && unit.zoneProvinceIds.includes(provinceId)) return true;
  // National-ish units with empty zones already returned true
  return unit.zoneProvinceIds.length === 0 && unit.zoneCommunes.length === 0;
}

/**
 * Matching unites pour un incident - suggestion seulement (Phase 5).
 * Le dispatch auto arrive en Phase 6.
 */
export function matchUnitsForIncident(input: {
  requiredServices: RequiredService[];
  commune?: string | null;
  locationLabel?: string | null;
  lat?: number | null;
  lng?: number | null;
  limit?: number;
}): UnitMatch[] {
  const place = resolveSessionPlace({
    commune: input.commune ?? null,
    locationLabel: input.locationLabel ?? null,
  });
  const required = [...new Set(input.requiredServices)];
  const units = listUnits({ availableOnly: true });
  const matches: UnitMatch[] = [];

  for (const unit of units) {
    if (!zoneOk(unit, place.provinceId, place.commune)) continue;

    const matchedCapabilities = unit.capabilities.filter((c) =>
      required.includes(c),
    );
    if (!matchedCapabilities.length && required.length) continue;
    if (!required.length && !unit.capabilities.includes("operator")) continue;

    let score = 40 + matchedCapabilities.length * 15;
    score += Math.min(20, unit.reliabilityScore / 5);
    score += unit.accreditationLevel * 3;

    let reason = `Competences : ${matchedCapabilities.join(", ") || "generique"}`;

    if (
      input.lat != null &&
      input.lng != null &&
      unit.lat != null &&
      unit.lng != null
    ) {
      const km = haversineKm(
        { lat: input.lat, lng: input.lng },
        { lat: unit.lat, lng: unit.lng },
      );
      const eta = Math.max(5, Math.round(km * 3 + 5));
      score += Math.max(0, 30 - km);
      reason += ` · ~${km.toFixed(1)} km · ETA ~${eta} min`;
    } else if (place.commune || place.provinceId) {
      reason += " · zone compatible";
      score += 10;
    }

    matches.push({ unit, score: Math.round(score), reason, matchedCapabilities });
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, input.limit ?? 6);
}

export function estimateEtaMinutes(
  unit: OperationalUnit,
  lat: number | null,
  lng: number | null,
): number | null {
  if (lat == null || lng == null || unit.lat == null || unit.lng == null) {
    return unit.etaMinutes ?? 20;
  }
  const km = haversineKm(
    { lat, lng },
    { lat: unit.lat, lng: unit.lng },
  );
  return Math.max(5, Math.round(km * 3 + 5));
}

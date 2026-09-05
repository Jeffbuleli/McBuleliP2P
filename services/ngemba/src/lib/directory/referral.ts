import { listSeedServices, serviceLabel } from "@/lib/directory/seed";
import type {
  DirectoryService,
  ReferralMatch,
  ReferralResult,
} from "@/lib/directory/types";
import { resolveSessionPlace } from "@/lib/partners/match";
import type { RoutingScope } from "@/lib/partners/types";
import type { RequiredService } from "@/lib/response-engine/types";

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function covers(
  service: DirectoryService,
  provinceId: string | null,
  commune: string | null,
): { ok: boolean; scope: RoutingScope } {
  const local =
    service.coverageProvinceIds.length > 0 ||
    service.coverageCommunes.length > 0;

  if (!local) {
    return {
      ok: service.nationalFallback,
      scope: service.nationalFallback ? "national_fallback" : "unassigned",
    };
  }

  if (service.coverageCommunes.length && commune) {
    const cn = norm(commune);
    if (service.coverageCommunes.some((c) => norm(c) === cn)) {
      return { ok: true, scope: "local" };
    }
  }

  if (provinceId && service.coverageProvinceIds.includes(provinceId)) {
    return { ok: true, scope: "local" };
  }

  if (service.nationalFallback) {
    return { ok: true, scope: "national_fallback" };
  }

  return { ok: false, scope: "unassigned" };
}

function scoreService(
  service: DirectoryService,
  scope: RoutingScope,
  code: RequiredService,
): number {
  let score = 50;
  if (service.code === code) score += 40;
  if (scope === "local") score += 30;
  if (scope === "national_fallback") score += 10;
  if (service.nationalFallback) score += 5;
  return score;
}

/**
 * Referral Engine Phase 4.
 * Entree : services requis (IA / Response Engine) + lieu.
 * Sortie : organisations/services classes (pas de dispatch auto).
 */
export function buildReferrals(input: {
  requiredServices: RequiredService[];
  commune?: string | null;
  locationLabel?: string | null;
  category?: string | null;
  limit?: number;
}): ReferralResult {
  const required = [...new Set(input.requiredServices)];
  const place = resolveSessionPlace({
    commune: input.commune ?? null,
    locationLabel: input.locationLabel ?? null,
  });
  const catalog = listSeedServices();
  const matches: ReferralMatch[] = [];
  const unmatched: RequiredService[] = [];

  for (const code of required) {
    const candidates: ReferralMatch[] = [];
    for (const service of catalog) {
      if (service.code !== code) continue;
      if (
        input.category &&
        service.categories.length &&
        !service.categories.includes(input.category) &&
        !["operator", "prevention"].includes(code)
      ) {
        // soft filter - still allow if national operator-like
      }
      const geo = covers(service, place.provinceId, place.commune);
      if (!geo.ok) continue;
      const score = scoreService(service, geo.scope, code);
      candidates.push({
        serviceId: service.id,
        serviceCode: code,
        serviceName: service.name,
        partnerSeedId: service.partnerSeedId,
        organizationName: service.organizationName,
        contactHint: service.contactHint,
        rank: 0,
        score,
        reason:
          geo.scope === "local"
            ? `Service local ${serviceLabel(code)}`
            : `Fallback ${serviceLabel(code)}`,
        scope: geo.scope,
      });
    }

    candidates.sort((a, b) => b.score - a.score);
    if (!candidates.length) {
      unmatched.push(code);
      continue;
    }
    // Top 2 par code
    candidates.slice(0, 2).forEach((c, i) => {
      matches.push({ ...c, rank: matches.length + 1 + i });
    });
  }

  matches.sort((a, b) => b.score - a.score);
  const limit = input.limit ?? 8;
  const trimmed = matches.slice(0, limit).map((m, i) => ({ ...m, rank: i + 1 }));

  return { requiredServices: required, matches: trimmed, unmatched };
}

export function listDirectoryServices(): DirectoryService[] {
  return listSeedServices();
}

import { resolveZoneGeo } from "@/lib/observatory/geo";
import { getPartner, listPartners, partnersForRole } from "@/lib/partners/directory";
import type {
  PartnerOrg,
  SessionRoutingMeta,
} from "@/lib/partners/types";
import type { OpsRole } from "@/lib/ops/roles";

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function categoryOk(partner: PartnerOrg, category: string): boolean {
  if (!partner.categories.length) return true;
  return partner.categories.includes(category);
}

function coversPlace(
  partner: PartnerOrg,
  provinceId: string | null,
  commune: string | null,
): boolean {
  // Couverture nationale explicite
  if (
    partner.coverageProvinceIds.length === 0 &&
    partner.coverageCommunes.length === 0
  ) {
    return true;
  }

  if (partner.coverageCommunes.length && commune) {
    const cn = norm(commune);
    if (partner.coverageCommunes.some((c) => norm(c) === cn)) return true;
  }

  if (provinceId && partner.coverageProvinceIds.includes(provinceId)) {
    return true;
  }

  return false;
}

export function resolveSessionPlace(session: {
  commune: string | null;
  locationLabel: string | null;
}): { provinceId: string | null; provinceName: string | null; commune: string | null } {
  const zone =
    session.commune?.trim() ||
    session.locationLabel?.split(",")[0]?.trim() ||
    "";
  const geo = resolveZoneGeo(zone || "Lieu non precise", session.locationLabel);
  return {
    provinceId: geo.provinceId,
    provinceName: geo.province,
    commune: session.commune?.trim() || geo.zoneKey || null,
  };
}

function isLocalPartner(partner: PartnerOrg): boolean {
  return (
    partner.coverageProvinceIds.length > 0 ||
    partner.coverageCommunes.length > 0
  );
}

/** Partenaires locaux qui couvrent lieu + categorie. */
export function matchLocalPartners(session: {
  commune: string | null;
  locationLabel: string | null;
  category: string;
}): PartnerOrg[] {
  const place = resolveSessionPlace(session);
  return listPartners().filter(
    (p) =>
      isLocalPartner(p) &&
      categoryOk(p, session.category) &&
      coversPlace(p, place.provinceId, place.commune),
  );
}

export function buildRoutingMeta(session: {
  commune: string | null;
  locationLabel: string | null;
  category: string;
}): SessionRoutingMeta {
  const place = resolveSessionPlace(session);
  const local = matchLocalPartners(session);

  if (local.length) {
    return {
      provinceId: place.provinceId,
      provinceName: place.provinceName,
      commune: place.commune,
      matchedPartnerIds: local.map((p) => p.id),
      scope: "local",
      note: `Bassin local - ${local.map((p) => p.name).join(", ")}`,
    };
  }

  const fallback = listPartners().filter(
    (p) =>
      p.nationalFallback &&
      categoryOk(p, session.category) &&
      (!isLocalPartner(p) ||
        coversPlace(p, place.provinceId, place.commune)),
  );

  if (fallback.length) {
    return {
      provinceId: place.provinceId,
      provinceName: place.provinceName,
      commune: place.commune,
      matchedPartnerIds: fallback.map((p) => p.id),
      scope: "national_fallback",
      note:
        "Hors zone locale - file nationale / pilote (aucun partenaire local actif pour ce lieu).",
    };
  }

  return {
    provinceId: place.provinceId,
    provinceName: place.provinceName,
    commune: place.commune,
    matchedPartnerIds: [],
    scope: "unassigned",
    note: "Aucun partenaire annuaire pour ce lieu / type - visible admin.",
  };
}

export function partnerCoversSession(
  partner: PartnerOrg,
  session: {
    commune: string | null;
    locationLabel: string | null;
    category: string;
  },
  meta?: SessionRoutingMeta,
): boolean {
  if (!categoryOk(partner, session.category)) return false;
  const routing = meta ?? buildRoutingMeta(session);
  const place = {
    provinceId: routing.provinceId,
    commune: routing.commune,
  };

  if (isLocalPartner(partner)) {
    return coversPlace(partner, place.provinceId, place.commune);
  }

  // National : voit les alertes locales de sa categorie seulement en fallback
  // s'il est nationalFallback, ou toujours s'il n'y a pas de local
  if (partner.nationalFallback) {
    if (routing.scope === "national_fallback" || routing.scope === "unassigned") {
      return true;
    }
    // Aussi voir si inclus dans matched (ex. seul national et aussi local empty coverage)
    return routing.matchedPartnerIds.includes(partner.id);
  }

  return coversPlace(partner, place.provinceId, place.commune);
}

/**
 * Visibilite geographique pour un role.
 * - admin : tout
 * - sinon : union des partenaires du role (local match OU fallback national)
 * - si aucun partenaire pour le role : pas de filtre geo (compat)
 */
export function sessionInRoleCoverage(
  role: OpsRole,
  session: {
    commune: string | null;
    locationLabel: string | null;
    category: string;
    routingMeta?: SessionRoutingMeta | null;
  },
  boundPartnerId?: string | null,
): boolean {
  if (role === "admin") return true;

  const meta = session.routingMeta ?? buildRoutingMeta(session);

  if (boundPartnerId) {
    const p = getPartner(boundPartnerId);
    if (!p || !p.opsRoles.includes(role)) return false;
    return partnerCoversSession(p, session, meta);
  }

  const orgs = partnersForRole(role);
  if (!orgs.length) return true;

  return orgs.some((p) => partnerCoversSession(p, session, meta));
}

export function partnersForSessionDisplay(session: {
  commune: string | null;
  locationLabel: string | null;
  category: string;
  routingMeta?: SessionRoutingMeta | null;
}): PartnerOrg[] {
  const meta = session.routingMeta ?? buildRoutingMeta(session);
  return meta.matchedPartnerIds
    .map((id) => getPartner(id))
    .filter((p): p is PartnerOrg => Boolean(p));
}

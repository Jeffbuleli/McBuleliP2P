import type { OpsRole } from "@/lib/ops/roles";

export type PartnerOrg = {
  id: string;
  name: string;
  slug: string;
  /** Roles ops qui voient les alertes de ce partenaire */
  opsRoles: OpsRole[];
  /** Categories couvertes (vide = toutes pour le role) */
  categories: string[];
  /** Provinces rdc-places ids (vide = couverture nationale) */
  coverageProvinceIds: string[];
  /** Communes / villes (optionnel, filtre fin) */
  coverageCommunes: string[];
  /** Recoit les alertes hors zone locale (pilote national) */
  nationalFallback: boolean;
  active: boolean;
  contactHint?: string | null;
  /** Env optionnel pour token dedie (ex. NGEMBA_OPS_TOKEN_NGO_JGL) */
  tokenEnv?: string | null;
};

export type RoutingScope = "local" | "national_fallback" | "unassigned";

export type SessionRoutingMeta = {
  provinceId: string | null;
  provinceName: string | null;
  commune: string | null;
  matchedPartnerIds: string[];
  scope: RoutingScope;
  note: string;
};

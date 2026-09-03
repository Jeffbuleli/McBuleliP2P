import type { PartnerOrg } from "@/lib/partners/types";

/** Annuaire seed - editable via NGEMBA_PARTNERS_JSON (tableau JSON). */
const SEED_PARTNERS: PartnerOrg[] = [
  {
    id: "mcbuleli-national",
    name: "McBuleli NGEMBA (national)",
    slug: "mcbuleli",
    opsRoles: ["admin"],
    categories: [],
    coverageProvinceIds: [],
    coverageCommunes: [],
    nationalFallback: true,
    active: true,
    contactHint: "hi@mcbuleli.org",
  },
  {
    id: "jgl-africa",
    name: "Justicia Great Lakes (JGL AFRICA)",
    slug: "jgl",
    opsRoles: ["ngo"],
    categories: [
      "vbg",
      "sexual_violence",
      "domestic_violence",
      "child_danger",
      "harassment",
      "school",
      "unknown",
      "other",
    ],
    coverageProvinceIds: [],
    coverageCommunes: [],
    nationalFallback: true,
    active: true,
    contactHint: "Me Arjoule Karinda",
    tokenEnv: "NGEMBA_OPS_TOKEN_NGO_JGL",
    slaMinutesCritical: 5,
  },
  {
    id: "kinshasa-school-pilot",
    name: "Referent ecole pilote Kinshasa",
    slug: "school-kin",
    opsRoles: ["school"],
    categories: ["school", "child_danger"],
    coverageProvinceIds: ["kinshasa"],
    coverageCommunes: [],
    nationalFallback: false,
    active: true,
    contactHint: "Safe School Kinshasa",
    tokenEnv: "NGEMBA_OPS_TOKEN_SCHOOL",
    slaMinutesCritical: 10,
  },
  {
    id: "security-national",
    name: "File securite nationale (pilote)",
    slug: "security-national",
    opsRoles: ["security"],
    categories: [
      "assault",
      "robbery",
      "fire",
      "flood",
      "accident",
      "medical",
      "child_danger",
      "unknown",
    ],
    coverageProvinceIds: [],
    coverageCommunes: [],
    nationalFallback: true,
    active: true,
    contactHint: null,
  },
  {
    id: "partner-infra-kin",
    name: "Partenaire infrastructure Kinshasa",
    slug: "infra-kin",
    opsRoles: ["partner"],
    categories: ["infrastructure", "lighting"],
    coverageProvinceIds: ["kinshasa"],
    coverageCommunes: [],
    nationalFallback: true,
    active: true,
    contactHint: "Observatoire / prevention urbaine",
  },
];

function parseEnvPartners(): PartnerOrg[] | null {
  const raw = process.env.NGEMBA_PARTNERS_JSON?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const out: PartnerOrg[] = [];
    for (const row of parsed) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      const id = typeof r.id === "string" ? r.id.trim() : "";
      const name = typeof r.name === "string" ? r.name.trim() : "";
      if (!id || !name) continue;
      const opsRoles = Array.isArray(r.opsRoles)
        ? (r.opsRoles.filter((x) => typeof x === "string") as PartnerOrg["opsRoles"])
        : [];
      out.push({
        id,
        name,
        slug: typeof r.slug === "string" ? r.slug : id,
        opsRoles: opsRoles.length ? opsRoles : ["ngo"],
        categories: Array.isArray(r.categories)
          ? r.categories.filter((x): x is string => typeof x === "string")
          : [],
        coverageProvinceIds: Array.isArray(r.coverageProvinceIds)
          ? r.coverageProvinceIds.filter((x): x is string => typeof x === "string")
          : [],
        coverageCommunes: Array.isArray(r.coverageCommunes)
          ? r.coverageCommunes.filter((x): x is string => typeof x === "string")
          : [],
        nationalFallback: Boolean(r.nationalFallback),
        active: r.active !== false,
        contactHint:
          typeof r.contactHint === "string" ? r.contactHint : null,
        tokenEnv: typeof r.tokenEnv === "string" ? r.tokenEnv : null,
        slaMinutesCritical:
          typeof r.slaMinutesCritical === "number"
            ? r.slaMinutesCritical
            : null,
      });
    }
    return out.length ? out : null;
  } catch {
    console.warn("[ngemba] NGEMBA_PARTNERS_JSON invalid");
    return null;
  }
}

export function listPartners(): PartnerOrg[] {
  return (parseEnvPartners() ?? SEED_PARTNERS).filter((p) => p.active);
}

export function getPartner(id: string): PartnerOrg | undefined {
  return listPartners().find((p) => p.id === id);
}

export function partnersForRole(role: PartnerOrg["opsRoles"][number]): PartnerOrg[] {
  return listPartners().filter((p) => p.opsRoles.includes(role));
}

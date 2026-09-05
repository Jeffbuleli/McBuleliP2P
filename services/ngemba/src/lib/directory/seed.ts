import type { RequiredService } from "@/lib/response-engine/types";
import type { DirectoryService } from "@/lib/directory/types";
import { listPartners } from "@/lib/partners/directory";

const SERVICE_LABELS: Record<RequiredService, string> = {
  ngo_vbg: "ONG VBG / protection",
  ngo_child_protection: "Protection de l'enfant",
  psychosocial: "Soutien psychosocial",
  medical: "Soins medicaux",
  ambulance: "Ambulance / evacuation",
  firefighters: "Pompiers / secours",
  police_info: "Orientation police (info)",
  security: "Securite / urgence",
  school_referent: "Referent ecole",
  infrastructure: "Infrastructure urbaine",
  prevention: "Prevention / ressources",
  operator: "Operateur NGEMBA",
};

/** Codes services typiques par org seed. */
const ORG_SERVICE_MAP: Record<string, RequiredService[]> = {
  "mcbuleli-national": ["operator", "prevention"],
  "jgl-africa": ["ngo_vbg", "psychosocial", "ngo_child_protection"],
  "kinshasa-school-pilot": ["school_referent", "ngo_child_protection"],
  "security-national": [
    "security",
    "police_info",
    "firefighters",
    "ambulance",
    "medical",
  ],
  "partner-infra-kin": ["infrastructure", "prevention"],
};

function categoryServices(categories: string[]): RequiredService[] {
  const out: RequiredService[] = [];
  for (const c of categories) {
    if (
      ["vbg", "sexual_violence", "domestic_violence", "harassment"].includes(c)
    ) {
      out.push("ngo_vbg", "psychosocial");
    }
    if (c === "child_danger") out.push("ngo_child_protection", "psychosocial");
    if (c === "medical" || c === "accident") out.push("medical", "ambulance");
    if (c === "fire") out.push("firefighters", "ambulance");
    if (c === "flood") out.push("firefighters", "operator");
    if (c === "assault" || c === "robbery") {
      out.push("security", "police_info", "medical");
    }
    if (c === "infrastructure" || c === "lighting") out.push("infrastructure");
    if (c === "school") out.push("school_referent");
    if (c === "scam" || c === "cyber_threat") out.push("prevention");
  }
  return [...new Set(out)];
}

/** Catalogue seed derive des partenaires (0 DB requis). */
export function listSeedServices(): DirectoryService[] {
  const partners = listPartners();
  const out: DirectoryService[] = [];

  for (const p of partners) {
    const codes = [
      ...new Set([
        ...(ORG_SERVICE_MAP[p.id] ?? []),
        ...categoryServices(p.categories),
      ]),
    ];
    if (!codes.length) codes.push("operator");

    for (const code of codes) {
      out.push({
        id: `svc-${p.id}-${code}`,
        partnerSeedId: p.id,
        organizationName: p.name,
        code,
        name: `${SERVICE_LABELS[code]} - ${p.name}`,
        description: `Service ${code} via ${p.name}`,
        categories: p.categories,
        coverageProvinceIds: p.coverageProvinceIds,
        coverageCommunes: p.coverageCommunes,
        nationalFallback: p.nationalFallback,
        contactHint: p.contactHint ?? null,
        active: p.active,
      });
    }
  }

  return out.filter((s) => s.active);
}

export function serviceLabel(code: RequiredService): string {
  return SERVICE_LABELS[code] ?? code;
}

export function listOrganizationsView() {
  return listPartners().map((p) => ({
    ...p,
    orgType: p.opsRoles[0] ?? "partner",
    verified: p.id === "jgl-africa" ? false : true,
    serviceCodes: [
      ...new Set([
        ...(ORG_SERVICE_MAP[p.id] ?? []),
        ...categoryServices(p.categories),
      ]),
    ] as RequiredService[],
  }));
}

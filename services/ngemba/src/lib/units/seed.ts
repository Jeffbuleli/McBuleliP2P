import type { OperationalUnit, UnitType } from "@/lib/units/types";
import type { RequiredService } from "@/lib/response-engine/types";
import { listPartners } from "@/lib/partners/directory";

const PARTNER_UNITS: Array<{
  partnerId: string;
  name: string;
  unitType: UnitType;
  capabilities: RequiredService[];
  capacity: number;
  lat: number;
  lng: number;
  locationLabel: string;
  zoneProvinceIds: string[];
  zoneCommunes: string[];
  accreditationLevel: number;
}> = [
  {
    partnerId: "jgl-africa",
    name: "Equipe JGL Kinshasa A",
    unitType: "ngo_team",
    capabilities: ["ngo_vbg", "psychosocial", "ngo_child_protection"],
    capacity: 3,
    lat: -4.3276,
    lng: 15.3136,
    locationLabel: "Gombe, Kinshasa",
    zoneProvinceIds: ["kinshasa"],
    zoneCommunes: ["Gombe", "Kinshasa"],
    accreditationLevel: 2,
  },
  {
    partnerId: "jgl-africa",
    name: "Equipe JGL mobile B",
    unitType: "ngo_team",
    capabilities: ["ngo_vbg", "psychosocial"],
    capacity: 2,
    lat: -4.4419,
    lng: 15.2663,
    locationLabel: "Ngaliema, Kinshasa",
    zoneProvinceIds: ["kinshasa"],
    zoneCommunes: ["Ngaliema"],
    accreditationLevel: 2,
  },
  {
    partnerId: "bloc-citoyen-amani",
    name: "Equipe BCA Bukavu - protection enfant",
    unitType: "ngo_team",
    capabilities: ["ngo_child_protection", "psychosocial", "prevention"],
    capacity: 3,
    lat: -2.5,
    lng: 28.87,
    locationLabel: "Bukavu (Ibanda / Kadutu)",
    zoneProvinceIds: ["sud-kivu"],
    zoneCommunes: ["Bukavu", "Ibanda", "Kadutu", "Bagira"],
    accreditationLevel: 2,
  },
  {
    partnerId: "bloc-citoyen-amani",
    name: "Equipe BCA Uvira - paix & orientation",
    unitType: "community",
    capabilities: ["prevention", "psychosocial", "ngo_child_protection"],
    capacity: 2,
    lat: -3.4,
    lng: 29.14,
    locationLabel: "Uvira / Ruzizi",
    zoneProvinceIds: ["sud-kivu"],
    zoneCommunes: ["Uvira", "Baraka"],
    accreditationLevel: 2,
  },
  {
    partnerId: "kinshasa-school-pilot",
    name: "Referent Safe School Kin",
    unitType: "school",
    capabilities: ["school_referent", "ngo_child_protection"],
    capacity: 1,
    lat: -4.325,
    lng: 15.322,
    locationLabel: "Kinshasa centre",
    zoneProvinceIds: ["kinshasa"],
    zoneCommunes: [],
    accreditationLevel: 2,
  },
  {
    partnerId: "security-national",
    name: "Patrouille securite P1",
    unitType: "patrol",
    capabilities: ["security", "police_info"],
    capacity: 4,
    lat: -4.3,
    lng: 15.3,
    locationLabel: "Kinshasa",
    zoneProvinceIds: ["kinshasa"],
    zoneCommunes: [],
    accreditationLevel: 3,
  },
  {
    partnerId: "security-national",
    name: "Ambulance pilote A1",
    unitType: "ambulance",
    capabilities: ["ambulance", "medical"],
    capacity: 2,
    lat: -4.35,
    lng: 15.28,
    locationLabel: "Kinshasa sud",
    zoneProvinceIds: ["kinshasa"],
    zoneCommunes: [],
    accreditationLevel: 3,
  },
  {
    partnerId: "security-national",
    name: "Unite secours incendie F1",
    unitType: "firefighter",
    capabilities: ["firefighters", "ambulance"],
    capacity: 5,
    lat: -4.31,
    lng: 15.29,
    locationLabel: "Kinshasa",
    zoneProvinceIds: ["kinshasa"],
    zoneCommunes: [],
    accreditationLevel: 3,
  },
  {
    partnerId: "partner-infra-kin",
    name: "Equipe infra urbaine",
    unitType: "community",
    capabilities: ["infrastructure", "prevention"],
    capacity: 2,
    lat: -4.33,
    lng: 15.31,
    locationLabel: "Kinshasa",
    zoneProvinceIds: ["kinshasa"],
    zoneCommunes: [],
    accreditationLevel: 1,
  },
  {
    partnerId: "mcbuleli-national",
    name: "Ops NGEMBA national",
    unitType: "other",
    capabilities: ["operator", "prevention"],
    capacity: 5,
    lat: -4.32,
    lng: 15.31,
    locationLabel: "National",
    zoneProvinceIds: [],
    zoneCommunes: [],
    accreditationLevel: 4,
  },
];

/** Seed unites - capabilities firefighters uses rescue loosely; map rescue→operator if needed. */
export function listSeedUnits(): OperationalUnit[] {
  const partners = listPartners();
  const now = new Date().toISOString();
  const out: OperationalUnit[] = [];

  for (const row of PARTNER_UNITS) {
    const partner = partners.find((p) => p.id === row.partnerId);
    if (!partner?.active) continue;

    const capabilities = [...row.capabilities];
    if (row.unitType === "firefighter" && !capabilities.includes("firefighters")) {
      capabilities.push("firefighters");
    }

    out.push({
      id: `unit-${row.partnerId}-${row.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 40)}`,
      partnerSeedId: row.partnerId,
      organizationName: partner.name,
      name: row.name,
      unitType: row.unitType,
      capabilities,
      capacity: row.capacity,
      status: "AVAILABLE",
      lat: row.lat,
      lng: row.lng,
      locationLabel: row.locationLabel,
      zoneProvinceIds: row.zoneProvinceIds,
      zoneCommunes: row.zoneCommunes,
      accreditationLevel: row.accreditationLevel,
      assignedSessionId: null,
      etaMinutes: null,
      reliabilityScore: 75,
      lastHeartbeatAt: now,
      active: true,
      updatedAt: now,
      createdAt: now,
    });
  }

  return out;
}

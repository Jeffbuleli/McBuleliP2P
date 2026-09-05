import type { RequiredService } from "@/lib/response-engine/types";

export type UnitStatus =
  | "AVAILABLE"
  | "ASSIGNED"
  | "EN_ROUTE"
  | "ON_SCENE"
  | "BUSY"
  | "OFFLINE"
  | "UNAVAILABLE";

export type UnitType =
  | "patrol"
  | "ambulance"
  | "medical_team"
  | "firefighter"
  | "rescue"
  | "security"
  | "ngo_team"
  | "community"
  | "school"
  | "other";

export type OperationalUnit = {
  id: string;
  partnerSeedId: string | null;
  organizationName: string | null;
  name: string;
  unitType: UnitType;
  capabilities: RequiredService[];
  capacity: number;
  status: UnitStatus;
  lat: number | null;
  lng: number | null;
  locationLabel: string | null;
  zoneProvinceIds: string[];
  zoneCommunes: string[];
  accreditationLevel: number;
  assignedSessionId: string | null;
  etaMinutes: number | null;
  reliabilityScore: number;
  lastHeartbeatAt: string | null;
  active: boolean;
  updatedAt: string;
  createdAt: string;
};

export type UnitMatch = {
  unit: OperationalUnit;
  score: number;
  reason: string;
  matchedCapabilities: RequiredService[];
};

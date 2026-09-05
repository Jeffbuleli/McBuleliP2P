import type { RequiredService } from "@/lib/response-engine/types";
import type { PartnerOrg, RoutingScope } from "@/lib/partners/types";

export type DirectoryService = {
  id: string;
  /** Partner seed id (ex. jgl-africa) ou org slug. */
  partnerSeedId: string | null;
  organizationName: string | null;
  code: RequiredService;
  name: string;
  description: string | null;
  categories: string[];
  coverageProvinceIds: string[];
  coverageCommunes: string[];
  nationalFallback: boolean;
  contactHint: string | null;
  active: boolean;
};

export type ReferralMatch = {
  serviceId: string;
  serviceCode: RequiredService;
  serviceName: string;
  partnerSeedId: string | null;
  organizationName: string | null;
  contactHint: string | null;
  rank: number;
  score: number;
  reason: string;
  scope: RoutingScope;
};

export type ReferralResult = {
  requiredServices: RequiredService[];
  matches: ReferralMatch[];
  unmatched: RequiredService[];
};

export type OrganizationView = PartnerOrg & {
  orgType: string;
  verified: boolean;
  serviceCodes: RequiredService[];
};

import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/db";
import { listDirectoryServices, listOrganizationsView } from "@/lib/directory";
import { TRIAGE_PROMPT_VERSION } from "@/lib/ai/triage-schema";
import { RESPONSE_POLICY_VERSION } from "@/lib/response-engine";
import { sessionStoreInfo } from "@/lib/sessions/store";
import { unitStats } from "@/lib/units";

export async function GET() {
  const store = sessionStoreInfo();
  const units = unitStats();
  return NextResponse.json({
    ok: true,
    service: "ngemba",
    phase: "5",
    domain: "ngemba-rdc.org",
    time: new Date().toISOString(),
    incidentCore: {
      databaseConfigured: isDatabaseConfigured(),
      sessionPrimary: store.primary,
      pgEnabled: store.pgEnabled,
      jsonCount: store.jsonCount,
    },
    ai: {
      promptVersion: TRIAGE_PROMPT_VERSION,
      policyVersion: RESPONSE_POLICY_VERSION,
    },
    access: {
      model: "rbac+abac",
      bridge: "legacy_token",
    },
    directory: {
      organizations: listOrganizationsView().length,
      services: listDirectoryServices().length,
    },
    units: {
      total: units.total,
      available: units.available,
      assigned: units.assigned,
    },
  });
}

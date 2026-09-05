import { NextResponse } from "next/server";
import {
  listDirectoryServices,
  listOrganizationsView,
} from "@/lib/directory";
import { requireOpsAuth } from "@/lib/ops/auth";

/** Annuaire organisations + services (Phase 4). */
export async function GET(req: Request) {
  const auth = await requireOpsAuth(req, {
    permission: "alerts.list",
  });
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") || "all";

  const organizations = listOrganizationsView().map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    orgType: o.orgType,
    verified: o.verified,
    opsRoles: o.opsRoles,
    categories: o.categories,
    coverageProvinceIds: o.coverageProvinceIds,
    coverageCommunes: o.coverageCommunes,
    nationalFallback: o.nationalFallback,
    contactHint: o.contactHint ?? null,
    serviceCodes: o.serviceCodes,
    slaMinutesCritical: o.slaMinutesCritical ?? null,
  }));

  const services = listDirectoryServices().map((s) => ({
    id: s.id,
    code: s.code,
    name: s.name,
    partnerSeedId: s.partnerSeedId,
    organizationName: s.organizationName,
    categories: s.categories,
    coverageProvinceIds: s.coverageProvinceIds,
    coverageCommunes: s.coverageCommunes,
    nationalFallback: s.nationalFallback,
    contactHint: s.contactHint,
  }));

  if (kind === "organizations") {
    return NextResponse.json({ organizations });
  }
  if (kind === "services") {
    return NextResponse.json({ services });
  }

  return NextResponse.json({
    organizations,
    services,
    counts: {
      organizations: organizations.length,
      services: services.length,
    },
  });
}

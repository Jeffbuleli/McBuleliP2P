import { NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { listOrganizationsView, listDirectoryServices } from "@/lib/directory";

export async function GET(req: Request) {
  const auth = await requireOpsAuth(req, {
    permission: "alerts.list",
    roles: ["admin"],
  });
  if (auth instanceof NextResponse) return auth;

  const organizations = listOrganizationsView();
  const services = listDirectoryServices();

  const partners = organizations.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    opsRoles: p.opsRoles,
    categories: p.categories,
    coverageProvinceIds: p.coverageProvinceIds,
    coverageCommunes: p.coverageCommunes,
    nationalFallback: p.nationalFallback,
    contactHint: p.contactHint ?? null,
    orgType: p.orgType,
    verified: p.verified,
    serviceCodes: p.serviceCodes,
    servicesCount: services.filter((s) => s.partnerSeedId === p.id).length,
  }));

  return NextResponse.json({
    partners,
    servicesCount: services.length,
  });
}

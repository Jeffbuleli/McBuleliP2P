import { NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { listPartners } from "@/lib/partners/directory";

export async function GET(req: Request) {
  const auth = await requireOpsAuth(req, {
    permission: "alerts.list",
    roles: ["admin"],
  });
  if (auth instanceof NextResponse) return auth;

  const partners = listPartners().map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    opsRoles: p.opsRoles,
    categories: p.categories,
    coverageProvinceIds: p.coverageProvinceIds,
    coverageCommunes: p.coverageCommunes,
    nationalFallback: p.nationalFallback,
    contactHint: p.contactHint ?? null,
  }));

  return NextResponse.json({ partners });
}

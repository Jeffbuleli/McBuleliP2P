import { NextResponse } from "next/server";
import {
  listAdminAcademyOverview,
  listAdminEditionEnrollments,
} from "@/lib/academy-service";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const editionSlug = url.searchParams.get("edition")?.trim();
  if (editionSlug) {
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const limit = Math.min(
      200,
      Math.max(10, Number(url.searchParams.get("limit") ?? "50")),
    );
    const { rows, total } = await listAdminEditionEnrollments({
      editionSlug,
      limit,
      offset: (page - 1) * limit,
    });
    return NextResponse.json({ enrollments: rows, total, page, pageSize: limit });
  }

  const overview = await listAdminAcademyOverview();
  return NextResponse.json(overview);
}

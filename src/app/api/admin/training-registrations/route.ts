import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";
import { listTrainingRegistrations } from "@/lib/training-registration-service";

export async function GET(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(
    100,
    Math.max(10, Number(url.searchParams.get("limit") ?? "50")),
  );
  const offset = (page - 1) * limit;

  const { rows, total } = await listTrainingRegistrations({ limit, offset });

  return NextResponse.json({
    registrations: rows,
    total,
    page,
    pageSize: limit,
  });
}

import { NextResponse } from "next/server";
import {
  listAdminAcademyOverview,
  listAdminEditionEnrollments,
  listAdminEditionSessions,
  updateAdminSession,
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
  const sessionsOnly = url.searchParams.get("sessions") === "1";

  if (editionSlug && sessionsOnly) {
    const data = await listAdminEditionSessions(editionSlug);
    return NextResponse.json(data);
  }

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

export async function PATCH(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const sessionId =
    typeof json?.sessionId === "string" ? json.sessionId.trim() : "";
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const liveUrl =
    json?.liveUrl === null || typeof json?.liveUrl === "string"
      ? json.liveUrl
      : undefined;
  const replayUrl =
    json?.replayUrl === null || typeof json?.replayUrl === "string"
      ? json.replayUrl
      : undefined;

  const result = await updateAdminSession({ sessionId, liveUrl, replayUrl });
  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

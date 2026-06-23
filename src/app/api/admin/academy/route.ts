import { NextResponse } from "next/server";
import {
  getAdminEditionDetail,
  listAdminAcademyOverview,
  listAdminEditionEnrollments,
  listAdminEditionSessions,
  updateAdminEdition,
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
  const detailOnly = url.searchParams.get("detail") === "1";

  if (editionSlug && detailOnly) {
    const detail = await getAdminEditionDetail(editionSlug);
    if (!detail) {
      return NextResponse.json({ error: "edition_not_found" }, { status: 404 });
    }
    return NextResponse.json(detail);
  }

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

  const overview = await listAdminAcademyOverview({
    funnelEditionSlug: url.searchParams.get("funnelEdition")?.trim() || null,
  });
  return NextResponse.json({
    ...overview,
    viewer: {
      id: u.id,
      name: u.email?.split("@")[0] || "McBuleli",
    },
  });
}

export async function PATCH(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);

  const editionId =
    typeof json?.editionId === "string" ? json.editionId.trim() : "";
  if (editionId) {
    const status =
      typeof json?.status === "string" ? json.status.trim() : undefined;
    const liveBaseUrl =
      json?.liveBaseUrl === null || typeof json?.liveBaseUrl === "string"
        ? json.liveBaseUrl
        : undefined;
    const tutorEnabled =
      typeof json?.tutorEnabled === "boolean" ? json.tutorEnabled : undefined;

    const result = await updateAdminEdition({
      editionId,
      status,
      liveBaseUrl,
      tutorEnabled,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.code }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

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
  const replayR2Key =
    json?.replayR2Key === null || typeof json?.replayR2Key === "string"
      ? json.replayR2Key
      : undefined;

  const result = await updateAdminSession({
    sessionId,
    liveUrl,
    replayUrl,
    replayR2Key,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

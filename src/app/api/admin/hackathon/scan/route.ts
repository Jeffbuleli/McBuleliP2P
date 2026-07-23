import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, hackathonEditions } from "@/db";
import {
  eventDayIndex,
  getAccessRoster,
  recordAccessScan,
  rosterBuckets,
} from "@/lib/hackathon/access";
import { StaffAuthError, requireStaffScope } from "@/lib/session-user";

export const dynamic = "force-dynamic";

function authError(e: unknown) {
  const msg = e instanceof StaffAuthError ? e.message : "Forbidden";
  return NextResponse.json({ error: msg }, { status: 403 });
}

export async function GET(req: Request) {
  try {
    await requireStaffScope("hackathon_scan");
  } catch (e) {
    return authError(e);
  }

  const url = new URL(req.url);
  const editionId = url.searchParams.get("editionId");
  if (!editionId) {
    return NextResponse.json({ error: "editionId_required" }, { status: 400 });
  }

  const db = getDb();
  const [edition] = await db
    .select()
    .from(hackathonEditions)
    .where(eq(hackathonEditions.id, editionId))
    .limit(1);
  if (!edition) {
    return NextResponse.json({ error: "edition_not_found" }, { status: 404 });
  }

  const dayParam = Number(url.searchParams.get("dayIndex") || "0");
  const dayIndex = ([1, 2, 3].includes(dayParam)
    ? dayParam
    : eventDayIndex(edition)) as 1 | 2 | 3;

  const roster = await getAccessRoster({ editionId, dayIndex });
  const all = [...roster.participants, ...roster.partners];
  const buckets = rosterBuckets(all);

  return NextResponse.json({
    edition: {
      id: edition.id,
      nameFr: edition.nameFr,
      startDate: edition.startDate?.toISOString() ?? null,
    },
    dayIndex,
    suggestedDayIndex: eventDayIndex(edition),
    counts: {
      absent: buckets.absent.length,
      inside: buckets.inside.length,
      outside: buckets.outside.length,
      total: all.length,
    },
    roster: {
      absent: buckets.absent,
      inside: buckets.inside,
      outside: buckets.outside,
    },
    recentEvents: roster.recentEvents,
  });
}

const scanZ = z.object({
  code: z.string().trim().min(3).max(500),
  mode: z.enum(["in", "out"]),
  dayIndex: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  editionId: z.string().uuid().optional(),
  note: z.string().trim().max(200).optional(),
});

export async function POST(req: Request) {
  let staff;
  try {
    staff = await requireStaffScope("hackathon_scan");
  } catch (e) {
    return authError(e);
  }

  const json = await req.json().catch(() => null);
  const parsed = scanZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const result = await recordAccessScan({
    codeOrUrl: parsed.data.code,
    mode: parsed.data.mode,
    dayIndex: parsed.data.dayIndex,
    staffId: staff.id,
    note: parsed.data.note,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.code, message: result.message },
      { status: 409 },
    );
  }

  if (
    parsed.data.editionId &&
    result.pass.editionId !== parsed.data.editionId
  ) {
    return NextResponse.json(
      {
        error: "wrong_edition",
        message: "Ce badge appartient à une autre édition",
      },
      { status: 409 },
    );
  }

  return NextResponse.json({
    ok: true,
    mode: parsed.data.mode,
    dayIndex: parsed.data.dayIndex,
    previousStatus: result.previousStatus,
    presenceStatus: result.presenceStatus,
    eventId: result.eventId,
    pass: {
      subjectType: result.pass.subjectType,
      subjectId: result.pass.subjectId,
      ticketCode: result.pass.ticketCode,
      displayName: result.pass.displayName,
      orgOrEmail: result.pass.orgOrEmail,
      presenceStatus: result.presenceStatus,
    },
  });
}

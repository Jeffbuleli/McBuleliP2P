import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session-user";
import { canManageEvents, resolveEventRole } from "@/lib/events/permissions";
import {
  createEvent,
  listEvents,
} from "@/lib/events/events-service";
import { UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(8000).optional(),
  category: z.string().max(64).optional(),
  coverImage: z.string().url().nullable().optional(),
  trainerId: z.string().uuid(),
  trainerName: z.string().min(2).max(120),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  timezone: z.string().max(64).optional(),
  durationMinutes: z.number().int().positive().optional(),
  locationType: z.string().max(16).optional(),
  maxParticipants: z.number().int().positive().nullable().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().max(16).optional(),
  eventType: z.enum(["FREE", "PAID"]).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "COMMUNITY"]).optional(),
  audienceMode: z.enum(["ALL_ACADEMY_MEMBERS", "MANUAL"]).optional(),
  editionId: z.string().uuid().nullable().optional(),
});

export async function GET(req: Request) {
  const me = await getSessionUser();
  const url = new URL(req.url);
  const upcoming = url.searchParams.get("upcoming") === "1";
  const status = url.searchParams.get("status") ?? undefined;

  const events = await listEvents({
    userId: me?.id ?? null,
    appRole: me?.role ?? null,
    status,
    upcoming,
  });
  return NextResponse.json({ ok: true, events });
}

export async function POST(req: Request) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = resolveEventRole({ userId: me.id, appRole: me.role });
  if (!canManageEvents(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (me.role !== UserRole.SUPER_ADMIN && parsed.data.trainerId !== me.id) {
    return NextResponse.json({ error: "trainer_must_be_self" }, { status: 403 });
  }

  const out = await createEvent({
    input: parsed.data,
    createdBy: me.id,
  });
  if (!out.ok) return NextResponse.json({ error: out.code }, { status: 400 });
  return NextResponse.json({ ok: true, event: out.event }, { status: 201 });
}

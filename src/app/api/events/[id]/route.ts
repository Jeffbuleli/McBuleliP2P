import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session-user";
import {
  deleteEvent,
  getEventPublic,
  updateEvent,
} from "@/lib/events/events-service";

export const dynamic = "force-dynamic";

const patchSchema = z
  .object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().max(8000).optional(),
    category: z.string().max(64).optional(),
    coverImage: z.string().url().nullable().optional(),
    trainerId: z.string().uuid().optional(),
    trainerName: z.string().min(2).max(120).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    timezone: z.string().max(64).optional(),
    durationMinutes: z.number().int().positive().optional(),
    locationType: z.string().max(16).optional(),
    maxParticipants: z.number().int().positive().nullable().optional(),
    price: z.number().min(0).optional(),
    eventType: z.enum(["FREE", "PAID"]).optional(),
    visibility: z.enum(["PUBLIC", "PRIVATE", "COMMUNITY"]).optional(),
    audienceMode: z.enum(["ALL_ACADEMY_MEMBERS", "MANUAL"]).optional(),
  })
  .partial();

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const me = await getSessionUser();
  const out = await getEventPublic({
    idOrSlug: id,
    userId: me?.id ?? null,
    appRole: me?.role ?? null,
  });
  if (!out.ok) {
    return NextResponse.json({ error: out.code }, { status: out.code === "event_forbidden" ? 403 : 404 });
  }
  return NextResponse.json({ ok: true, event: out.event });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const out = await updateEvent({
    idOrSlug: id,
    userId: me.id,
    appRole: me.role,
    patch: parsed.data,
  });
  if (!out.ok) {
    const status = out.code === "event_forbidden" ? 403 : 404;
    return NextResponse.json({ error: out.code }, { status });
  }
  return NextResponse.json({ ok: true, event: out.event });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const out = await deleteEvent({ idOrSlug: id, userId: me.id, appRole: me.role });
  if (!out.ok) {
    const status = out.code === "event_forbidden" ? 403 : 404;
    return NextResponse.json({ error: out.code }, { status });
  }
  return NextResponse.json({ ok: true });
}

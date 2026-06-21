import { NextResponse } from "next/server";
import { buildGoogleCalendarUrl, buildIcsContent } from "@/lib/events/calendar";
import { getEventByIdOrSlug } from "@/lib/events/events-service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const format = url.searchParams.get("format");

  const event = await getEventByIdOrSlug(id);
  if (!event) return NextResponse.json({ error: "event_not_found" }, { status: 404 });

  if (format === "ics") {
    const ics = buildIcsContent(event);
    return new NextResponse(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    googleCalendarUrl: buildGoogleCalendarUrl(event),
    icsPath: `/api/events/${event.slug}/calendar?format=ics`,
  });
}

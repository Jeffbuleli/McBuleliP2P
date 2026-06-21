import { NextResponse } from "next/server";
import { getEventByIdOrSlug } from "@/lib/events/events-service";
import { renderEventPosterBuffer } from "@/lib/events/poster";
import type { PosterTemplate } from "@/lib/events/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const template = (url.searchParams.get("template") ?? "square") as PosterTemplate;
  const ext = url.searchParams.get("ext") === "jpg" ? "jpeg" : "png";

  if (!["portrait", "square", "banner"].includes(template)) {
    return NextResponse.json({ error: "invalid_template" }, { status: 400 });
  }

  const event = await getEventByIdOrSlug(id);
  if (!event) return NextResponse.json({ error: "event_not_found" }, { status: 404 });

  const buf = await renderEventPosterBuffer({
    event: {
      title: event.title,
      trainerName: event.trainerName,
      startDate: event.startDate,
      timezone: event.timezone,
      price: event.price,
      eventType: event.eventType as "FREE" | "PAID",
      coverImage: event.coverImage,
    },
    template,
    format: ext === "jpeg" ? "jpeg" : "png",
  });

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": ext === "jpeg" ? "image/jpeg" : "image/png",
      "Cache-Control": "public, max-age=300",
    },
  });
}

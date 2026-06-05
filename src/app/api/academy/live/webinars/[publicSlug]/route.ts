import { NextResponse } from "next/server";
import { getWebinarByPublicSlug } from "@/lib/academy-webinar-service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ publicSlug: string }> },
) {
  const { publicSlug } = await ctx.params;
  const w = await getWebinarByPublicSlug(publicSlug.trim());
  if (!w) {
    return NextResponse.json({ error: "academy_webinar_not_found" }, { status: 404 });
  }
  return NextResponse.json({ webinar: w });
}

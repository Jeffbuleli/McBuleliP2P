import { NextResponse } from "next/server";
import { listWebinarRegistrations } from "@/lib/academy-webinar-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ editionSlug: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { editionSlug } = await ctx.params;
  const out = await listWebinarRegistrations({
    ownerUserId: userId,
    editionSlug: editionSlug.trim(),
  });
  if (!out.ok) {
    return NextResponse.json({ error: out.code }, { status: 403 });
  }
  return NextResponse.json({ registrations: out.rows });
}

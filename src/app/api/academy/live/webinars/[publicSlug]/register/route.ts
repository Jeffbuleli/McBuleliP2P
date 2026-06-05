import { NextResponse } from "next/server";
import { registerForWebinar } from "@/lib/academy-webinar-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ publicSlug: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { publicSlug } = await ctx.params;
  const out = await registerForWebinar({ userId, publicSlug: publicSlug.trim() });
  if (!out.ok) {
    return NextResponse.json({ error: out.code }, { status: 400 });
  }
  return NextResponse.json(out);
}

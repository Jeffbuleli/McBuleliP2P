import { NextResponse } from "next/server";
import { getStoryEngagement } from "@/lib/community/stories-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: storyId } = await ctx.params;
  const viewerId = await getSessionUserId();
  const engagement = await getStoryEngagement({ storyId, viewerId });
  return NextResponse.json(engagement);
}

import { NextResponse } from "next/server";
import { communityEnabled } from "@/lib/community/config";
import { getQuestionDetail } from "@/lib/community/qa-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!communityEnabled()) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }

  const { id } = await ctx.params;
  const viewerId = await getSessionUserId();
  const question = await getQuestionDetail({ questionId: id, viewerId });
  if (!question) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ question });
}

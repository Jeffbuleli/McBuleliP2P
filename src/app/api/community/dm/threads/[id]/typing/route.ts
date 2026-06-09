import { NextResponse } from "next/server";
import { communityEnabled } from "@/lib/community/config";
import { setDmTyping } from "@/lib/community/dm-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!communityEnabled()) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  await setDmTyping({ userId, threadId: id });
  return NextResponse.json({ ok: true });
}

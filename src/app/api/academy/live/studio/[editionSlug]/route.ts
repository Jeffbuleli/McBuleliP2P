import { NextResponse } from "next/server";
import { cancelOwnerWebinar } from "@/lib/academy-webinar-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ editionSlug: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { editionSlug } = await ctx.params;
  const out = await cancelOwnerWebinar({ userId, editionSlug });
  if (!out.ok) {
    return NextResponse.json({ error: out.code }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

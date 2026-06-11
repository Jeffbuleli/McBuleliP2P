import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { mineAtSite } from "@/lib/game/economy-engine";
import { ensureGameSchema } from "@/lib/game/game-schema-ensure";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await ensureGameSchema();

  const body = (await req.json()) as { siteId?: string };
  if (!body.siteId) {
    return NextResponse.json({ message: "siteId required" }, { status: 400 });
  }

  const result = await mineAtSite({ playerId: userId, siteId: body.siteId });
  if (!result.ok) {
    return NextResponse.json({ message: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}

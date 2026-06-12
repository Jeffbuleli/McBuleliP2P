import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { gameErrorResponse } from "@/lib/game/game-api";
import { ensureGameSchema } from "@/lib/game/game-schema-ensure";
import { travelToRegion } from "@/lib/game/region-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await ensureGameSchema();

  const body = (await req.json()) as { regionKey?: string };
  if (!body.regionKey) {
    return NextResponse.json({ message: "regionKey required" }, { status: 400 });
  }

  const result = await travelToRegion({ playerId: userId, regionKey: body.regionKey });
  if (!result.ok) return gameErrorResponse(result.error);

  return NextResponse.json({
    ...result,
    message: `Traveled to ${result.regionName}.`,
    messageFr: `Voyage vers ${result.regionNameFr}.`,
  });
}

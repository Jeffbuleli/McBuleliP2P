import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { ensureGameSchema } from "@/lib/game/game-schema-ensure";
import { godotClientManifest } from "@/lib/game/nakama-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await ensureGameSchema();

  return NextResponse.json({
    ...godotClientManifest(),
    authenticated: true,
    playerId: userId,
  });
}

import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { ensureGameSchema } from "@/lib/game/game-schema-ensure";
import { getOrCreatePlayer, getPlayerDashboard } from "@/lib/game/player-state";
import { nakamaConnectionInfo } from "@/lib/game/nakama-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await ensureGameSchema();
  const dashboard = await getPlayerDashboard(userId);

  return NextResponse.json({
    ...dashboard,
    nakama: nakamaConnectionInfo(),
  });
}

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await ensureGameSchema();
  const player = await getOrCreatePlayer(userId);
  return NextResponse.json({ ok: true, player });
}

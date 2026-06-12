import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { VEHICLES, type MineralKey } from "@/lib/game/constants";
import { ensureGameSchema } from "@/lib/game/game-schema-ensure";
import { getOrCreatePlayer } from "@/lib/game/player-state";
import { gameErrorResponse } from "@/lib/game/game-api";
import { quoteTransport } from "@/lib/game/transport-engine";
import { eq, and } from "drizzle-orm";
import { gameMineralStocks, getDb } from "@/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await ensureGameSchema();

  const url = new URL(req.url);
  const mineralKey = url.searchParams.get("mineralKey") as MineralKey | null;
  const quantityKg = Number(url.searchParams.get("quantityKg") ?? 0);
  const vehicleKey = url.searchParams.get("vehicleKey") as keyof typeof VEHICLES | null;
  const routeKey = url.searchParams.get("routeKey") ?? "";

  if (!mineralKey || !vehicleKey || !routeKey || quantityKg <= 0) {
    return NextResponse.json({ message: "Invalid query" }, { status: 400 });
  }

  const player = await getOrCreatePlayer(userId);
  const db = getDb();
  const [stock] = await db
    .select()
    .from(gameMineralStocks)
    .where(
      and(
        eq(gameMineralStocks.playerId, userId),
        eq(gameMineralStocks.mineralKey, mineralKey),
      ),
    )
    .limit(1);

  const purityPct = stock ? Number(stock.purityPct) : 75;

  const quote = await quoteTransport({
    mineralKey,
    quantityKg,
    vehicleKey,
    routeKey,
    purityPct,
    xp: player.xp,
  });

  if (!quote.ok) {
    return gameErrorResponse(quote.error);
  }

  return NextResponse.json(quote);
}

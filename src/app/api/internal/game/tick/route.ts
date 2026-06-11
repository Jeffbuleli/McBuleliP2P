import { NextResponse } from "next/server";
import { runEconomyTick } from "@/lib/game/economy-engine";
import { ensureGameSchema } from "@/lib/game/game-schema-ensure";
import { getCronSecret } from "@/lib/pool-env";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? "";
  if (secret !== getCronSecret()) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await ensureGameSchema();
  const result = await runEconomyTick();
  return NextResponse.json({ ok: true, ...result });
}

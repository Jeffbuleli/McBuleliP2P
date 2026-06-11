import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { UPGRADE_CATALOG } from "@/lib/game/constants";
import { purchaseUpgrade } from "@/lib/game/economy-engine";
import { ensureGameSchema } from "@/lib/game/game-schema-ensure";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    items: UPGRADE_CATALOG.map((u) => ({
      key: u.key,
      category: u.category,
      label: u.label,
      labelFr: u.labelFr,
      costMcb: u.costMcb,
      minRole: u.minRole,
      effects: u.effects,
    })),
    count: UPGRADE_CATALOG.length,
  });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await ensureGameSchema();

  const body = (await req.json()) as { itemKey?: string };
  if (!body.itemKey) {
    return NextResponse.json({ message: "itemKey required" }, { status: 400 });
  }

  const result = await purchaseUpgrade({ playerId: userId, itemKey: body.itemKey });
  if (!result.ok) {
    return NextResponse.json({ message: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

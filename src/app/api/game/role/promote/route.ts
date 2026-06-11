import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { ensureGameSchema } from "@/lib/game/game-schema-ensure";
import { getRolePromotion, promotePlayerRole } from "@/lib/game/role-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await ensureGameSchema();
  const promotion = await getRolePromotion(userId);
  return NextResponse.json(promotion);
}

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await ensureGameSchema();
  const result = await promotePlayerRole(userId);
  if (!result.ok) {
    return NextResponse.json({ message: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}

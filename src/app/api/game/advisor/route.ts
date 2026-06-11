import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { askBuleziAdvisor, listAdvisorHistory } from "@/lib/game/ai-advisor";
import { ensureGameSchema } from "@/lib/game/game-schema-ensure";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await ensureGameSchema();
  const history = await listAdvisorHistory(userId, 15);
  return NextResponse.json({ history });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await ensureGameSchema();

  const body = (await req.json()) as { question?: string };
  if (!body.question?.trim()) {
    return NextResponse.json({ message: "question required" }, { status: 400 });
  }

  try {
    const result = await askBuleziAdvisor({
      playerId: userId,
      question: body.question,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "advisor_error";
    return NextResponse.json({ message: msg }, { status: 400 });
  }
}

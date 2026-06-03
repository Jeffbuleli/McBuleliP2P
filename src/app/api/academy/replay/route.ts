import { NextResponse } from "next/server";
import { z } from "zod";
import { logReplayView } from "@/lib/academy-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  sessionId: z.string().uuid(),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const result = await logReplayView({
    userId,
    sessionId: parsed.data.sessionId,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

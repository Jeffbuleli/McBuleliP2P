import { NextResponse } from "next/server";
import { z } from "zod";
import { checkInSession } from "@/lib/academy-service";
import { getSessionUserId } from "@/lib/session";

const bodySchema = z.object({
  sessionId: z.string().uuid(),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const result = await checkInSession({
    userId,
    sessionId: parsed.data.sessionId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    grantedBp: result.grantedBp,
  });
}

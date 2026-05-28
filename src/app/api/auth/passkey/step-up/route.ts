import { NextResponse } from "next/server";
import { z } from "zod";
import { passkeyStepUpOptions, passkeyStepUpVerify } from "@/lib/auth/passkeys";
import { setStepUpVerified } from "@/lib/auth/step-up";
import { getSessionUserId } from "@/lib/session";

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { options, challengeId } = await passkeyStepUpOptions(userId);
    return NextResponse.json({ options, challengeId });
  } catch {
    return NextResponse.json({ error: "passkey_not_found" }, { status: 404 });
  }
}

const verifyZ = z.object({
  challengeId: z.string().uuid(),
  response: z.unknown(),
});

export async function PUT(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = verifyZ.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const result = await passkeyStepUpVerify({
    userId,
    challengeId: parsed.data.challengeId,
    response: parsed.data.response,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  await setStepUpVerified(userId);
  return NextResponse.json({ ok: true });
}

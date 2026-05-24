import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import {
  passkeyRegisterOptions,
  passkeyRegisterVerify,
} from "@/lib/auth/passkeys";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    deviceName?: string;
  } | null;

  try {
    const { options, challengeId } = await passkeyRegisterOptions(
      userId,
      body?.deviceName,
    );
    return NextResponse.json({ options, challengeId });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
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

  const result = await passkeyRegisterVerify({
    userId,
    challengeId: parsed.data.challengeId,
    response: parsed.data.response,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

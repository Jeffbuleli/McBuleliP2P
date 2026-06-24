import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { assertStepUp } from "@/lib/auth/step-up";
import {
  clearAntiPhishingCode,
  isAntiPhishingSet,
  setAntiPhishingCode,
} from "@/lib/anti-phishing";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const set = await isAntiPhishingSet(userId);
  return NextResponse.json({ set });
}

const setZ = z.object({
  code: z.string().min(4).max(20),
  totpCode: z.string().optional(),
});

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = setZ.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const step = await assertStepUp({
    userId,
    totpCode: parsed.data.totpCode ?? null,
  });
  if (!step.ok) {
    return NextResponse.json({ error: step.error }, { status: 403 });
  }

  const result = await setAntiPhishingCode(userId, parsed.data.code);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, set: true });
}

const deleteZ = z.object({
  totpCode: z.string().optional(),
});

export async function DELETE(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = deleteZ.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const step = await assertStepUp({
    userId,
    totpCode: parsed.data.totpCode ?? null,
  });
  if (!step.ok) {
    return NextResponse.json({ error: step.error }, { status: 403 });
  }

  await clearAntiPhishingCode(userId);
  return NextResponse.json({ ok: true, set: false });
}

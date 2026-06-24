import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, userPasskeys } from "@/db";
import { getSessionUserId } from "@/lib/session";
import { assertStepUp } from "@/lib/auth/step-up";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  const rows = await db
    .select({
      id: userPasskeys.id,
      deviceName: userPasskeys.deviceName,
      createdAt: userPasskeys.createdAt,
      lastUsedAt: userPasskeys.lastUsedAt,
    })
    .from(userPasskeys)
    .where(eq(userPasskeys.userId, userId))
    .orderBy(userPasskeys.createdAt);
  return NextResponse.json({
    passkeys: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      lastUsedAt: r.lastUsedAt?.toISOString() ?? null,
    })),
  });
}

const deleteZ = z.object({
  passkeyId: z.string().uuid(),
  totpCode: z.string().optional(),
});

export async function DELETE(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = deleteZ.safeParse(await req.json().catch(() => null));
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

  const db = getDb();
  const result = await db
    .delete(userPasskeys)
    .where(
      and(
        eq(userPasskeys.id, parsed.data.passkeyId),
        eq(userPasskeys.userId, userId),
      ),
    )
    .returning({ id: userPasskeys.id });

  if (!result[0]) {
    return NextResponse.json({ error: "passkey_not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { effectiveP2pCountryCode } from "@/lib/p2p-country-code";
import { P2P_COUNTRY_CODES } from "@/lib/p2p-config";
import { getSessionUserId } from "@/lib/session";

const patchZ = z.object({
  displayName: z.string().min(2).max(64).optional(),
  countryCode: z.enum(P2P_COUNTRY_CODES).optional(),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const [u] = await db
    .select({
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      countryCode: users.countryCode,
      email: users.email,
      piUsername: users.piUsername,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    ok: true,
    displayName: u.displayName ?? "",
    avatarUrl: u.avatarUrl ?? null,
    countryCode: effectiveP2pCountryCode(u.countryCode),
    email: u.email,
    piUsername: u.piUsername ?? "",
  });
}

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = patchZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "profile_invalid_input" }, { status: 400 });
  }

  const patch: { displayName?: string; countryCode?: string } = {};
  if (parsed.data.displayName !== undefined) {
    patch.displayName = parsed.data.displayName.trim();
  }
  if (parsed.data.countryCode !== undefined) {
    patch.countryCode = effectiveP2pCountryCode(parsed.data.countryCode);
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "profile_invalid_input" }, { status: 400 });
  }

  const db = getDb();
  await db.update(users).set(patch).where(eq(users.id, userId));

  return NextResponse.json({ ok: true });
}

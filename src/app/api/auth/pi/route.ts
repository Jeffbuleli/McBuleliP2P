import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { sessionCookieName, signSessionToken } from "@/lib/jwt";
import { getSessionCookieWriteOptions } from "@/lib/session-cookie";
import { effectiveP2pCountryCode } from "@/lib/p2p-country-code";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type PiMe = {
  uid?: string;
  username?: string;
};

function piEmailForUsername(username: string): string {
  const u = username.trim().toLowerCase().replace(/[^a-z0-9_\\-\\.]/g, "_");
  return `pi_${u}@pi.local`;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { accessToken?: string }
    | null;
  const accessToken = body?.accessToken?.trim() ?? "";
  if (!accessToken) {
    return NextResponse.json({ message: "Missing accessToken." }, { status: 400 });
  }

  const meRes = await fetch("https://api.minepi.com/v2/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  }).catch(() => null);

  if (!meRes || !meRes.ok) {
    const status = meRes?.status ?? 0;
    let detail: string | null = null;
    try {
      detail = meRes ? await meRes.text() : null;
    } catch {
      detail = null;
    }
    console.error("[auth/pi] /v2/me failed", {
      status,
      detail: detail?.slice(0, 300) ?? null,
    });
    return NextResponse.json({ message: "Invalid Pi access token." }, { status: 401 });
  }

  const me = (await meRes.json().catch(() => ({}))) as PiMe;
  const username = me.username?.trim() ?? "";
  if (!username) {
    return NextResponse.json({ message: "Pi user missing username." }, { status: 502 });
  }

  const email = piEmailForUsername(username);
  const db = getDb();
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const userId = existing?.id;
  const piUid = me.uid?.trim() ?? null;

  const resolvedUserId =
    userId ??
    (
      await db
        .insert(users)
        .values({
          email,
          passwordHash: await bcrypt.hash(crypto.randomUUID(), 12),
          role: "user",
          tradeLiveEnabled: false,
          staffScopes: null,
          countryCode: "CD",
          piUid,
          piUsername: username,
        })
        .returning({ id: users.id })
    )[0]!.id;

  // Keep Pi identifiers up to date for A2U payouts.
  if (userId && (piUid || username)) {
    await db
      .update(users)
      .set({ piUid, piUsername: username })
      .where(eq(users.id, userId));
  }

  // Fix invalid/empty country codes (e.g. "-", "-") so P2P payment methods match.
  const [crow] = await db
    .select({ countryCode: users.countryCode })
    .from(users)
    .where(eq(users.id, resolvedUserId))
    .limit(1);
  const norm = effectiveP2pCountryCode(crow?.countryCode ?? null);
  if ((crow?.countryCode ?? "").trim().toUpperCase() !== norm) {
    await db
      .update(users)
      .set({ countryCode: norm })
      .where(eq(users.id, resolvedUserId));
  }

  const token = await signSessionToken(resolvedUserId);
  const res = NextResponse.json({
    ok: true,
    user: { id: resolvedUserId, email },
    pi: { username, uid: me.uid ?? null },
  });
  res.cookies.set(
    sessionCookieName(),
    token,
    getSessionCookieWriteOptions(),
  );
  return res;
}


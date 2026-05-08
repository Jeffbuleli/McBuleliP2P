import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { getSessionUserId } from "@/lib/session";

type PiMe = {
  uid?: string;
  username?: string;
};

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { accessToken?: string }
    | null;
  const accessToken = body?.accessToken?.trim() ?? "";
  if (!accessToken) {
    return NextResponse.json({ error: "Missing accessToken." }, { status: 400 });
  }

  const meRes = await fetch("https://api.minepi.com/v2/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  }).catch(() => null);

  if (!meRes || !meRes.ok) {
    return NextResponse.json({ error: "Invalid Pi access token." }, { status: 401 });
  }

  const me = (await meRes.json().catch(() => ({}))) as PiMe;
  const username = me.username?.trim() ?? "";
  const piUid = me.uid?.trim() ?? "";
  if (!username || !piUid) {
    return NextResponse.json({ error: "Pi user missing uid/username." }, { status: 502 });
  }

  const db = getDb();

  // Prevent linking a Pi UID already attached to a different account.
  const [dup] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.piUid, piUid))
    .limit(1);
  if (dup && dup.id !== userId) {
    return NextResponse.json({ error: "pi_uid_already_linked" }, { status: 409 });
  }

  await db
    .update(users)
    .set({ piUid, piUsername: username })
    .where(eq(users.id, userId));

  return NextResponse.json({ ok: true, pi: { uid: piUid, username } });
}


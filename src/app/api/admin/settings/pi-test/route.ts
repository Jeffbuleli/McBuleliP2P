import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, users } from "@/db";
import { requireSuperAdmin, StaffAuthError } from "@/lib/session-user";
import {
  adjustPiTestBalance,
  getPiTestBalance,
  listPiTestLedger,
} from "@/lib/pi-test-settings";

export const dynamic = "force-dynamic";

const postZ = z.object({
  kind: z.enum(["deposit", "withdraw"]),
  amount: z.string().min(1),
  memo: z.string().optional(),
  targetUserId: z.string().uuid().optional(),
});

export async function GET(req: Request) {
  try {
    const me = await requireSuperAdmin();
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? "30");
    const targetUserId =
      url.searchParams.get("userId")?.trim() || me.id;

    const db = getDb();
    const [exists] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);
    if (!exists) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const [balance, ledger] = await Promise.all([
      getPiTestBalance(targetUserId),
      listPiTestLedger(targetUserId, Number.isFinite(limit) ? limit : 30),
    ]);
    return NextResponse.json({ ok: true, balance, ledger, targetUserId });
  } catch (e) {
    const msg = e instanceof StaffAuthError ? e.message : "Forbidden";
    return NextResponse.json({ ok: false, error: msg }, { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    const me = await requireSuperAdmin();
    const json = await req.json().catch(() => null);
    const parsed = postZ.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
    }
    const amt = Number(parsed.data.amount.replace(",", "."));
    const targetUserId = parsed.data.targetUserId ?? me.id;

    const db = getDb();
    const [exists] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);
    if (!exists) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 400 });
    }

    const r = await adjustPiTestBalance({
      kind: parsed.data.kind,
      amount: amt,
      memo: parsed.data.memo ?? null,
      actorUserId: me.id,
      targetUserId,
    });
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: r.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, balance: r.balance, targetUserId });
  } catch (e) {
    const msg = e instanceof StaffAuthError ? e.message : "Forbidden";
    return NextResponse.json({ ok: false, error: msg }, { status: 403 });
  }
}

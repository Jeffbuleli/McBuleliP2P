import { NextResponse } from "next/server";
import { z } from "zod";
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
});

export async function GET(req: Request) {
  try {
    await requireSuperAdmin();
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? "30");
    const [balance, ledger] = await Promise.all([
      getPiTestBalance(),
      listPiTestLedger(Number.isFinite(limit) ? limit : 30),
    ]);
    return NextResponse.json({ ok: true, balance, ledger });
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
    const r = await adjustPiTestBalance({
      kind: parsed.data.kind,
      amount: amt,
      memo: parsed.data.memo ?? null,
      actorUserId: me.id,
    });
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: r.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, balance: r.balance });
  } catch (e) {
    const msg = e instanceof StaffAuthError ? e.message : "Forbidden";
    return NextResponse.json({ ok: false, error: msg }, { status: 403 });
  }
}


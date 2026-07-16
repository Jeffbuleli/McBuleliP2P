import { NextResponse } from "next/server";
import { z } from "zod";
import { creditMcbCustodial } from "@/lib/community/mcb-custodial-service";
import { StaffAuthError, requireSuperAdmin } from "@/lib/session-user";

export const dynamic = "force-dynamic";

const bodyZ = z.object({
  brandId: z.string().uuid(),
  amount: z.number().positive().max(1_000_000),
  note: z.string().max(200).optional(),
});

/** Admin top-up brand McB custodial (prep / dry-run before BSC settle). */
export async function POST(req: Request) {
  try {
    await requireSuperAdmin();
  } catch (e) {
    const msg = e instanceof StaffAuthError ? e.message : "Forbidden";
    return NextResponse.json({ message: msg }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "invalid_body" }, { status: 400 });
  }

  const result = await creditMcbCustodial({
    kind: "brand",
    refId: parsed.data.brandId,
    amount: parsed.data.amount,
    entryType: "admin_credit",
    meta: { note: parsed.data.note ?? null },
  });
  if (!result.ok) {
    return NextResponse.json({ message: result.code }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    balance: result.balance,
    batchId: result.batchId,
  });
}

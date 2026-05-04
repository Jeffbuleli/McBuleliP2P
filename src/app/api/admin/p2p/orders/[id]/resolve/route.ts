import { NextResponse } from "next/server";
import { z } from "zod";
import { StaffAuthError, requireStaff } from "@/lib/session-user";
import { adminResolveP2pOrder } from "@/lib/p2p-service";

const bodyZ = z.object({
  resolution: z.enum(["release_buyer", "refund_seller"]),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireStaff();
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const r = await adminResolveP2pOrder({
    orderId: id,
    resolution: parsed.data.resolution,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

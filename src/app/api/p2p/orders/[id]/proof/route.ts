import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { getP2pPaymentProof, upsertP2pPaymentProof } from "@/lib/p2p-service";

const postZ = z.object({
  dataUrl: z.string().min(20).max(2_000_000),
  mime: z.string().min(3).max(64),
  sizeBytes: z.number().int().min(1).max(5_000_000),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const r = await getP2pPaymentProof({ orderId: id, userId });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 404 });
  }
  return NextResponse.json({ proof: r.proof });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = postZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "p2p_proof_invalid" }, { status: 400 });
  }
  const r = await upsertP2pPaymentProof({
    orderId: id,
    userId,
    dataUrl: parsed.data.dataUrl,
    mime: parsed.data.mime,
    sizeBytes: parsed.data.sizeBytes,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: r.id });
}


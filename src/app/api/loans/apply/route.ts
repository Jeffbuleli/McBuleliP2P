import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { createLoan } from "@/lib/loans-service";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as null | { amountUsdt?: string };
  const amountUsdt = body?.amountUsdt ?? "";

  const res = await createLoan({ userId, amountUsdtStr: amountUsdt });
  if (!res.ok) return NextResponse.json(res, { status: 400 });
  return NextResponse.json(res);
}


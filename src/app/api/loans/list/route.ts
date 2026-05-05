import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { listOpenLoans } from "@/lib/loans-service";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });

  const res = await listOpenLoans(userId);
  if (!res.ok) return NextResponse.json(res, { status: 400 });
  return NextResponse.json(res);
}


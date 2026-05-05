import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getLoansSnapshot } from "@/lib/loans-service";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });

  const snap = await getLoansSnapshot(userId);
  if (!snap.ok) return NextResponse.json(snap, { status: 400 });
  return NextResponse.json(snap);
}


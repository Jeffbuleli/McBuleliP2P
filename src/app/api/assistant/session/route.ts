import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Lightweight auth probe for the assistant widget (no conversation created). */
export async function GET() {
  const userId = await getSessionUserId();
  return NextResponse.json({ sessionUserId: userId ?? null });
}

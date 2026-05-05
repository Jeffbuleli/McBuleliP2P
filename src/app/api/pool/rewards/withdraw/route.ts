import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session-user";
import { withdrawLpPoolRewards } from "@/lib/lp-pool-service";

export const dynamic = "force-dynamic";

export async function POST() {
  const u = await getSessionUser();
  if (!u) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const out = await withdrawLpPoolRewards({ userId: u.id });
  if (!out.ok) {
    return NextResponse.json({ message: out.message }, { status: 400 });
  }
  return NextResponse.json(out);
}


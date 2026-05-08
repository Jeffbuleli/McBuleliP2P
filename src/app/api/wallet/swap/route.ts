import { NextResponse } from "next/server";

/** In-wallet swap was removed — use P2P for conversions between assets. */
export async function POST() {
  return NextResponse.json(
    { error: "wallet_swap_disabled" },
    { status: 410 },
  );
}

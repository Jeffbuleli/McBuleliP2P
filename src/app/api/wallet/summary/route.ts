import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getLocale } from "@/lib/get-locale";
import { getWalletUserState } from "@/lib/wallet-user-state";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const locale = await getLocale();
  const state = await getWalletUserState(userId, locale);
  if (!state) {
    return NextResponse.json({ error: "wallet_not_found" }, { status: 404 });
  }
  return NextResponse.json(state);
}

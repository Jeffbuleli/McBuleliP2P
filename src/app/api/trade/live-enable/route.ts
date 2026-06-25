import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { checkKycGate } from "@/lib/kyc-guard";
import { enableTradeLiveForUser } from "@/lib/trade-live-governance";
import { getLocale } from "@/lib/get-locale";

export const dynamic = "force-dynamic";

function clientIp(req: Request): string | null {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() ?? null;
  return req.headers.get("x-real-ip");
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const kyc = await checkKycGate(userId, "trade_live");
  if (!kyc.ok) {
    return NextResponse.json({ error: kyc.error }, { status: 403 });
  }
  const locale = await getLocale();
  const r = await enableTradeLiveForUser({
    userId,
    ip: clientIp(req),
    locale: locale === "en" ? "en" : "fr",
  });
  if (!r.ok) {
    const status =
      r.error === "trade_live_graduation_required" ||
      r.error === "trade_live_admin_disabled"
        ? 403
        : 400;
    return NextResponse.json(
      { error: r.error, meta: r.meta ?? null },
      { status },
    );
  }
  return NextResponse.json({ ok: true });
}

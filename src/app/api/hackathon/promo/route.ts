import { NextResponse } from "next/server";
import { resolveActivePromo } from "@/lib/hackathon/promo";

export const dynamic = "force-dynamic";

/** Resolve a partner promo code for the registration form (locked chip). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code")?.trim() ?? "";
  const editionId = url.searchParams.get("editionId")?.trim() || null;
  if (!code) {
    return NextResponse.json({ error: "missing_code" }, { status: 400 });
  }

  try {
    const promo = await resolveActivePromo({ code, editionId });
    if (!promo) {
      return NextResponse.json({ error: "invalid_promo" }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      code: promo.code,
      orgName: promo.orgName,
      discountPercent: promo.discountPercent,
      cashbackUsd: promo.cashbackUsd,
      priceUsd: promo.priceUsd,
    });
  } catch (e) {
    console.error("[hackathon/promo]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

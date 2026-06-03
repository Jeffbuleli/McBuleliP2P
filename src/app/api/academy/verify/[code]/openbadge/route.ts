import { NextResponse } from "next/server";
import { buildOpenBadgeForVerifyCode } from "@/lib/academy-open-badge";
import { getLocale } from "@/lib/get-locale";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ code: string }> },
) {
  const { code } = await ctx.params;
  const locale = await getLocale();
  const badge = await buildOpenBadgeForVerifyCode(code, locale);
  if (!badge) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(badge, {
    headers: {
      "Content-Type": "application/ld+json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}

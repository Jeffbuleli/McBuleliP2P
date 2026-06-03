import { NextResponse } from "next/server";
import { getCredentialByVerifyCode } from "@/lib/academy-service";
import { getLocale } from "@/lib/get-locale";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ code: string }> },
) {
  const { code } = await ctx.params;
  const locale = await getLocale();
  const cred = await getCredentialByVerifyCode(code, locale);
  if (!cred) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(cred);
}

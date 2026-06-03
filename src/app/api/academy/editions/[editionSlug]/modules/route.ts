import { NextResponse } from "next/server";
import { listEditionModules } from "@/lib/academy-modules";
import { getLocale } from "@/lib/get-locale";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ editionSlug: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { editionSlug } = await ctx.params;
  const programSlug =
    new URL(req.url).searchParams.get("program")?.trim() || undefined;
  const locale = await getLocale();

  const result = await listEditionModules({
    userId,
    editionSlug,
    programSlug,
    locale,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: 400 });
  }
  return NextResponse.json({ modules: result.modules });
}

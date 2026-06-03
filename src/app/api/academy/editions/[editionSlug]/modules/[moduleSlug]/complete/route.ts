import { NextResponse } from "next/server";
import { completeEditionModule } from "@/lib/academy-modules";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ editionSlug: string; moduleSlug: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { editionSlug, moduleSlug } = await ctx.params;
  const json = await req.json().catch(() => ({}));
  const programSlug =
    typeof json?.programSlug === "string" ? json.programSlug.trim() : undefined;

  const result = await completeEditionModule({
    userId,
    editionSlug,
    moduleSlug,
    programSlug,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: 400 });
  }
  return NextResponse.json({ ok: true, alreadyDone: result.alreadyDone });
}

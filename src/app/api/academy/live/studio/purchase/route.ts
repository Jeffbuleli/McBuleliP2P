import { NextResponse } from "next/server";
import { z } from "zod";
import {
  normalizeAcademyLivePurchaseError,
  purchaseAcademyLivePlan,
} from "@/lib/academy-live-service";
import { isAcademyLivePlanId } from "@/lib/academy-live-plans";
import { getSessionUserId } from "@/lib/session";

const bodySchema = z.object({
  planId: z.string().trim(),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success || !isAcademyLivePlanId(parsed.data.planId)) {
    return NextResponse.json({ error: "academy_live_invalid_plan" }, { status: 400 });
  }

  try {
    const result = await purchaseAcademyLivePlan({
      userId,
      planId: parsed.data.planId,
    });

    if (!result.ok) {
      const status =
        result.message === "academy_db_not_migrated" ? 503 : 400;
      return NextResponse.json({ error: result.message }, { status });
    }

    return NextResponse.json({ ok: true, purchase: result.purchase });
  } catch (e) {
    const code = normalizeAcademyLivePurchaseError(e);
    const status = code === "academy_db_not_migrated" ? 503 : 500;
    console.error("[academy/live/studio/purchase]", e);
    return NextResponse.json({ error: code }, { status });
  }
}

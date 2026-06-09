import { NextResponse } from "next/server";
import { z } from "zod";
import { communityEnabled } from "@/lib/community/config";
import {
  checkTranslateRateLimit,
  translateCommunityText,
} from "@/lib/community/translate-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const bodyZ = z.object({
  text: z.string().min(2).max(4000),
  targetLocale: z.enum(["en", "fr"]),
});

export async function POST(req: Request) {
  if (!communityEnabled()) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkTranslateRateLimit(userId)) {
    return NextResponse.json({ error: "translate_rate_limit" }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const result = await translateCommunityText({
      text: parsed.data.text,
      targetLocale: parsed.data.targetLocale,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "translate_failed";
    if (msg === "invalid_text_length") {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: "translate_failed" }, { status: 500 });
  }
}

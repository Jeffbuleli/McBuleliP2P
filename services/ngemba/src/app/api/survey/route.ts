import { NextResponse } from "next/server";
import { z } from "zod";
import { isLocale } from "@/lib/i18n";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { saveSurvey } from "@/lib/survey/store";

const answer = z.string().trim().max(80).optional().nullable();

const bodySchema = z.object({
  locale: z.string().trim().max(8).optional(),
  concern: answer,
  firstHelp: answer,
  alertUseful: answer,
  communityNeed: answer,
  place: z.string().trim().max(80).optional().nullable(),
  note: z.string().trim().max(400).optional().nullable(),
});

function clean(value: string | null | undefined): string | null {
  const text = value?.trim() ?? "";
  return text.length ? text : null;
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`survey:${ip}`, 8, 60 * 60_000);
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const answers = {
    concern: clean(parsed.data.concern),
    firstHelp: clean(parsed.data.firstHelp),
    alertUseful: clean(parsed.data.alertUseful),
    communityNeed: clean(parsed.data.communityNeed),
    place: clean(parsed.data.place),
    note: clean(parsed.data.note),
  };
  if (!Object.values(answers).some(Boolean)) {
    return NextResponse.json({ error: "empty" }, { status: 400 });
  }

  const locale = parsed.data.locale && isLocale(parsed.data.locale)
    ? parsed.data.locale
    : "fr";
  const saved = saveSurvey({ locale, answers });
  return NextResponse.json({ ok: true, id: saved.id });
}

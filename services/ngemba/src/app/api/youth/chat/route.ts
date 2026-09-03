import { NextResponse } from "next/server";
import { z } from "zod";
import { isLocale } from "@/lib/i18n";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { getYouthScenario } from "@/lib/youth/scenarios";
import { runYouthChat } from "@/lib/youth/youth-chat";

const bodySchema = z.object({
  scenarioId: z.string().min(2).max(40),
  locale: z.string().default("fr"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .max(20),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`youth-chat:${ip}`, 30, 60_000);
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

  const scenario = getYouthScenario(parsed.data.scenarioId);
  if (!scenario) {
    return NextResponse.json({ error: "unknown_scenario" }, { status: 404 });
  }

  const locale = isLocale(parsed.data.locale) ? parsed.data.locale : "fr";

  const result = await runYouthChat({
    scenarioId: scenario.id,
    locale,
    history: parsed.data.history,
  });

  return NextResponse.json({
    reply: result.reply,
    suggestSos: result.suggestSos,
    provider: result.provider,
  });
}

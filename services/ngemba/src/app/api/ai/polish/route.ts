import { polishCitizenText } from "@/lib/ai/polish";
import {
  clientIp,
  rateLimit,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

const MAX_CHARS = 2000;

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`polish:${ip}`, 20, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  let body: { text?: string; locale?: string };
  try {
    body = (await req.json()) as { text?: string; locale?: string };
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text : "";
  const locale = typeof body.locale === "string" ? body.locale : "fr";

  if (text.trim().length < 3) {
    return Response.json({ error: "text_too_short" }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return Response.json({ error: "text_too_long" }, { status: 400 });
  }

  const result = await polishCitizenText({ text, locale });
  return Response.json({
    text: result.text,
    provider: result.provider,
  });
}

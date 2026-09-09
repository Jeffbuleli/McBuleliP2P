import { NextResponse } from "next/server";
import { z } from "zod";
import { sendOpsRecoverRequest } from "@/lib/ops/auth-recover";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

const bodySchema = z.object({
  organization: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  referent: z.string().trim().max(120).optional().or(z.literal("")),
  note: z.string().trim().max(400).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rlIp = rateLimit(`ops-recover:ip:${ip}`, 3, 15 * 60_000);
  if (!rlIp.ok) return rateLimitResponse(rlIp.retryAfterSec);

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

  const email = parsed.data.email.toLowerCase();
  const rlEmail = rateLimit(`ops-recover:email:${email}`, 2, 60 * 60_000);
  if (!rlEmail.ok) return rateLimitResponse(rlEmail.retryAfterSec);

  const result = await sendOpsRecoverRequest(
    {
      organization: parsed.data.organization,
      email,
      phone: parsed.data.phone || undefined,
      referent: parsed.data.referent || undefined,
      note: parsed.data.note || undefined,
    },
    { ip },
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error === "email_not_configured" ? 503 : 502 },
    );
  }

  return NextResponse.json({ ok: true });
}

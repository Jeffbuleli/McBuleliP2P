import { NextResponse } from "next/server";
import { z } from "zod";
import { findUserByAuthEmail } from "@/lib/auth/email-uniqueness";
import { normalizeAuthEmail } from "@/lib/auth/email-normalize";
import { sendPasswordResetEmail } from "@/lib/email/messages/password-reset";
import { resolveEmailLocale } from "@/lib/email/locale";
import {
  checkRateLimit,
  rateLimitedResponse,
  rateLimitKeyEmail,
  rateLimitKeyIp,
} from "@/lib/rate-limit";

const bodyZ = z.object({
  email: z.string().trim().min(3).max(255).email(),
});

export async function POST(req: Request) {
  const ipLimit = checkRateLimit({
    key: rateLimitKeyIp("auth:forgot-password", req),
    limit: 10,
    windowMs: 60_000,
  });
  if (!ipLimit.ok) {
    return rateLimitedResponse(ipLimit.retryAfterSec);
  }

  const parsed = bodyZ.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const email = normalizeAuthEmail(parsed.data.email);
  const emailLimit = checkRateLimit({
    key: rateLimitKeyEmail("auth:forgot-password", email),
    limit: 3,
    windowMs: 60 * 60_000,
  });
  if (!emailLimit.ok) {
    return rateLimitedResponse(emailLimit.retryAfterSec);
  }

  const locale = await resolveEmailLocale(req);
  const user = await findUserByAuthEmail(email);

  if (user) {
    await sendPasswordResetEmail({
      userId: user.id,
      email: user.email,
      locale,
    });
  }

  return NextResponse.json({
    ok: true,
    message: "If this email exists, a reset link was sent.",
  });
}

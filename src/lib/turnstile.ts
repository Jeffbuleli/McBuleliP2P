import { clientIpFromRequest } from "@/lib/rate-limit";

export function turnstileSiteKey(): string | null {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  return key || null;
}

export function turnstileConfigured(): boolean {
  return Boolean(
    turnstileSiteKey() && process.env.TURNSTILE_SECRET_KEY?.trim(),
  );
}

/** Verify Cloudflare Turnstile token. Skips when unset (local dev); required in production. */
export async function verifyTurnstileToken(
  token: string | undefined | null,
  req: Request,
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[turnstile] TURNSTILE_SECRET_KEY missing in production");
      return {
        ok: false,
        status: 503,
        message: "Captcha verification unavailable.",
      };
    }
    return { ok: true };
  }

  const response = token?.trim();
  if (!response) {
    return { ok: false, status: 400, message: "Captcha required." };
  }

  const verifyRes = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        response,
        remoteip: clientIpFromRequest(req),
      }),
    },
  ).catch(() => null);

  if (!verifyRes?.ok) {
    return {
      ok: false,
      status: 502,
      message: "Captcha verification failed.",
    };
  }

  const data = (await verifyRes.json().catch(() => ({}))) as {
    success?: boolean;
  };
  if (!data.success) {
    return { ok: false, status: 403, message: "Invalid captcha." };
  }
  return { ok: true };
}

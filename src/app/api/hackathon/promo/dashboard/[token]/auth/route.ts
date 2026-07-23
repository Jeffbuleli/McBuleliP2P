import { NextResponse } from "next/server";
import {
  promoDashCookieName,
  requestPromoDashOtp,
  verifyPromoDashOtp,
} from "@/lib/hackathon/promo-dashboard-auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const json = (await req.json().catch(() => null)) as {
    action?: string;
    code?: string;
  } | null;
  const action = json?.action ?? "request";

  if (action === "request") {
    const result = await requestPromoDashOtp(token);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      ok: true,
      maskedEmail: result.maskedEmail,
    });
  }

  if (action === "verify") {
    const code = String(json?.code ?? "").trim();
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "invalid_code" }, { status: 400 });
    }
    const result = await verifyPromoDashOtp({ dashboardToken: token, code });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    const res = NextResponse.json({ ok: true, email: result.email });
    res.cookies.set(promoDashCookieName(), result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  }

  return NextResponse.json({ error: "bad_action" }, { status: 400 });
}

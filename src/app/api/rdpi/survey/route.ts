import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { submitRdpiSurvey, validateRdpiAnswers } from "@/lib/rdpi/survey";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const recentIp = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const max = 8;
  const prev = (recentIp.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (prev.length >= max) {
    recentIp.set(ip, prev);
    return true;
  }
  prev.push(now);
  recentIp.set(ip, prev);
  return false;
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const validated = validateRdpiAnswers(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 32);
  const row = await submitRdpiSurvey({
    answers: validated.answers,
    meta: {
      userAgent: req.headers.get("user-agent"),
      ipHash,
      locale: "fr",
    },
  });

  return NextResponse.json({ ok: true, id: row?.id });
}

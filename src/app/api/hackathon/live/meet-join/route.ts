import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceIpRateLimit } from "@/lib/api-rate-limit";
import { resolveHackathonLiveMeetJoinUrl } from "@/lib/hackathon/live-meet-join";
import { ensureMcSessionHydrated } from "@/lib/hackathon/mc-state";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  slug: z.string().trim().min(1).max(80),
});

export async function GET(req: Request) {
  const limited = enforceIpRateLimit(
    "hackathon_live_meet",
    req,
    30,
    60_000,
  );
  if (limited) return limited;

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ slug: url.searchParams.get("slug") });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  }

  await ensureMcSessionHydrated();
  const out = await resolveHackathonLiveMeetJoinUrl(parsed.data.slug);
  if (!out.ok) {
    const status =
      out.code === "meet_not_active" || out.code === "meet_closed" ? 403 : 404;
    return NextResponse.json({ error: out.code }, { status });
  }

  return NextResponse.json({ ok: true, url: out.url });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { readCitizenToken } from "@/lib/citizen/token";
import { reverseGeocode } from "@/lib/location/geoapify";
import { getSession, updateSessionGps } from "@/lib/sessions/store";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracyM: z.number().min(0).max(100_000),
});

/** Le téléphone envoie son GPS après l'ouverture du dossier. */
export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const ip = clientIp(req);
  const rl = rateLimit(`gps:${ip}`, 12, 60_000);
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

  const session = getSession(id);
  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const citizen = await readCitizenToken();
  if (!citizen || session.citizenToken !== citizen) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

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

  const accuracyM = Math.round(parsed.data.accuracyM);
  if (accuracyM > 1000) {
    return NextResponse.json({ ok: false, reason: "too_wide" });
  }

  const resolved = await reverseGeocode(
    parsed.data.lat,
    parsed.data.lng,
    accuracyM,
  );
  const locationSource =
    accuracyM <= 80
      ? `${resolved.source}+gps_precise`
      : accuracyM > 400
        ? `${resolved.source}+gps_wide`
        : resolved.source;

  const next = updateSessionGps(id, {
    lat: parsed.data.lat,
    lng: parsed.data.lng,
    locationAccuracyM: accuracyM,
    locationLabel: resolved.label,
    locationSource,
    commune: resolved.commune,
    locationConsentAt: new Date().toISOString(),
  });
  if (!next) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    locationLabel: next.locationLabel,
    accuracyM: next.locationAccuracyM,
  });
}

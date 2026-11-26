import { NextResponse } from "next/server";
import { z } from "zod";
import { citizenCanAccessSession } from "@/lib/citizen/access";
import { reverseGeocode } from "@/lib/location/geoapify";
import { notifySessionUpdated } from "@/lib/ops/notify";
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
  if (!(await citizenCanAccessSession(req, session))) {
    console.warn("[ngemba] location forbidden", id.slice(0, 8));
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
  if (accuracyM > 2500) {
    return NextResponse.json({ ok: false, reason: "too_wide", persisted: false });
  }

  const resolved = await reverseGeocode(
    parsed.data.lat,
    parsed.data.lng,
    accuracyM,
  );
  const locationSource =
    accuracyM <= 80
      ? `${resolved.source}+gps_precise`
      : `${resolved.source}+gps_wide`;

  const hadGps =
    session.lat != null &&
    session.lng != null &&
    session.locationAccuracyM != null;
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
  const persisted =
    next.lat != null &&
    next.lng != null &&
    (next.locationAccuracyM != null ||
      /gps_precise|gps_wide/.test(next.locationSource ?? "")) &&
    (!hadGps ||
      next.lat !== session.lat ||
      next.lng !== session.lng ||
      (next.locationAccuracyM != null &&
        session.locationAccuracyM != null &&
        next.locationAccuracyM < session.locationAccuracyM));
  if (persisted) {
    console.info("[ngemba] location saved", {
      id: id.slice(0, 8),
      accuracyM,
    });
    void notifySessionUpdated(next);
  } else {
    console.warn("[ngemba] location not persisted", {
      id: id.slice(0, 8),
      accuracyM,
    });
  }
  return NextResponse.json({
    ok: persisted,
    persisted,
    locationLabel: next.locationLabel,
    accuracyM: next.locationAccuracyM,
    reason: persisted ? undefined : "not_saved",
  });
}

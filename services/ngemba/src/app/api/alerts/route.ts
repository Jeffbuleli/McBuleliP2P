import { NextResponse } from "next/server";
import { z } from "zod";
import { runTriage } from "@/lib/ai/triage";
import { isLocale } from "@/lib/i18n";
import {
  resolveCommuneOnly,
  resolveManualPlace,
  reverseGeocode,
} from "@/lib/location/geoapify";
import { opsSummaryFr } from "@/lib/labels";
import { notifyNewAlert } from "@/lib/ops/notify";
import { requireOpsAuth } from "@/lib/ops/auth";
import { sessionVisibleToRole } from "@/lib/ops/roles";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { createSession, getSession, listSessions } from "@/lib/sessions/store";

const createBody = z.object({
  message: z.string().trim().min(3).max(4000),
  locale: z.string().default("fr"),
  source: z.enum(["sos_button", "witness", "chat"]).default("sos_button"),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  shareLocation: z.boolean().optional(),
  provinceId: z.string().nullable().optional(),
  cityId: z.string().nullable().optional(),
  commune: z.string().nullable().optional(),
  locationLabel: z.string().nullable().optional(),
  locationSource: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`alert-create:${ip}`, 12, 60_000);
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = createBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const body = parsed.data;
  const locale = isLocale(body.locale) ? body.locale : "fr";

  let lat: number | null = null;
  let lng: number | null = null;
  let locationLabel: string | null = body.locationLabel ?? null;
  let commune: string | null = body.commune ?? null;
  let locationSource: string | null = body.locationSource ?? null;
  let locationConsentAt: string | null = null;

  if (
    body.shareLocation &&
    typeof body.lat === "number" &&
    typeof body.lng === "number"
  ) {
    const resolved = await reverseGeocode(body.lat, body.lng);
    lat = resolved.lat;
    lng = resolved.lng;
    locationLabel = resolved.label;
    commune = resolved.commune;
    locationSource = resolved.source;
    locationConsentAt = new Date().toISOString();
  } else if (body.provinceId?.trim()) {
    const resolved = resolveManualPlace(
      body.provinceId.trim(),
      body.cityId?.trim() || undefined,
    );
    lat = resolved.lat;
    lng = resolved.lng;
    locationLabel = resolved.label;
    commune = resolved.commune;
    locationSource = resolved.source;
    locationConsentAt = new Date().toISOString();
  } else if (body.commune?.trim()) {
    const resolved = resolveCommuneOnly(body.commune.trim());
    lat = resolved.lat;
    lng = resolved.lng;
    locationLabel = resolved.label;
    commune = resolved.commune;
    locationSource = resolved.source;
    locationConsentAt = new Date().toISOString();
  }

  const { triage, routing, provider, aiMode } = await runTriage({
    message: body.message,
    locale,
    source: body.source,
  });

  const session = createSession({
    source: body.source,
    locale,
    message: body.message,
    urgency: triage.urgency,
    category: triage.category,
    immediateDanger: triage.immediate_danger,
    lat,
    lng,
    locationLabel,
    commune,
    locationSource,
    locationConsentAt,
    aiSummary:
      triage.summary_user_locale ||
      triage.summary_fr ||
      opsSummaryFr(triage.category, triage.urgency),
    aiConfidence: triage.confidence,
    aiPayload: triage,
    routingQueue: routing.queue,
    autoRoute: routing.autoRoute,
    provider,
    aiMode,
    status: "active",
  });

  await notifyNewAlert(session);

  return NextResponse.json({
    id: session.id,
    urgency: session.urgency,
    category: session.category,
    queue: session.routingQueue,
    summary: session.aiSummary,
    provider: session.provider,
    aiMode: session.aiMode,
    locationLabel: session.locationLabel,
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (id) {
    const session = getSession(id);
    if (!session) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ session });
  }

  const auth = await requireOpsAuth(req, { permission: "alerts.list" });
  if (auth instanceof NextResponse) return auth;

  const sessions = listSessions(80).filter((s) =>
    sessionVisibleToRole(auth.role, s),
  );

  const stats =
    auth.role === "admin"
      ? {
          total: sessions.length,
          critical: sessions.filter((s) => s.urgency === "critical").length,
          high: sessions.filter((s) => s.urgency === "high").length,
          open: sessions.filter(
            (s) => s.status !== "closed" && s.status !== "cancelled",
          ).length,
        }
      : undefined;

  return NextResponse.json({ sessions: sessions.slice(0, 40), stats, role: auth.role });
}

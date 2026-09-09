import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  CITIZEN_COOKIE,
  citizenCookieOptions,
  newCitizenToken,
  readCitizenToken,
} from "@/lib/citizen/token";
import { runTriage } from "@/lib/ai/triage";
import { evaluateResponse } from "@/lib/response-engine";
import { isLocale } from "@/lib/i18n";
import {
  resolveCommuneOnly,
  resolveManualPlace,
  reverseGeocode,
} from "@/lib/location/geoapify";
import { opsSummaryFr } from "@/lib/labels";
import { buildReferrals } from "@/lib/directory/referral";
import { saveReferrals } from "@/lib/directory/store";
import { notifyNewAlert } from "@/lib/ops/notify";
import { notifyTrustedContacts } from "@/lib/ops/notify-trusted-contacts";
import { requireOpsAuth } from "@/lib/ops/auth";
import { sessionVisibleToActor } from "@/lib/ops/visibility";
import { applySlaEscalationIfNeeded } from "@/lib/ops/sla-engine";
import { computeSlaDueAt, slaUiState } from "@/lib/ops/sla";
import { buildRoutingMeta } from "@/lib/partners/match";
import { listPartners } from "@/lib/partners/directory";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { createSession, getSession, listSessions } from "@/lib/sessions/store";
import {
  sanitizeCitizenSession,
  sanitizeOpsSessionForActor,
} from "@/lib/sessions/sanitize";
import { normalizeTrustedContacts } from "@/lib/trusted-contacts/types";
import { normalizeSchoolContext } from "@/lib/school/types";

const createBody = z.object({
  message: z.string().trim().min(1).max(500),
  locale: z.string().default("fr"),
  source: z
    .enum(["sos_button", "witness", "chat", "shake", "school"])
    .default("sos_button"),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  shareLocation: z.boolean().optional(),
  provinceId: z.string().nullable().optional(),
  cityId: z.string().nullable().optional(),
  commune: z.string().nullable().optional(),
  locationLabel: z.string().nullable().optional(),
  locationSource: z.string().nullable().optional(),
  discrete: z.boolean().optional(),
  trustedContacts: z.array(z.unknown()).max(3).optional(),
  schoolContext: z
    .object({
      concernType: z.string(),
      establishmentHint: z.string().nullable().optional(),
      isMinor: z.boolean().optional(),
    })
    .optional(),
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
  const discreteExtreme = Boolean(body.discrete);
  const trustedContacts = normalizeTrustedContacts(body.trustedContacts) ?? [];
  const schoolContext =
    body.source === "school"
      ? normalizeSchoolContext(body.schoolContext)
      : null;
  if (body.source === "school" && !schoolContext) {
    return NextResponse.json({ error: "invalid_school_context" }, { status: 400 });
  }

  let lat: number | null = null;
  let lng: number | null = null;
  let locationLabel: string | null = body.locationLabel ?? null;
  let commune: string | null = body.commune ?? null;
  let locationSource: string | null = body.locationSource ?? null;
  let locationConsentAt: string | null = null;

  // Mode discret = danger extrême : GPS accepté sans étape de consentement UI.
  const allowLocation =
    Boolean(body.shareLocation) ||
    discreteExtreme ||
    (typeof body.lat === "number" && typeof body.lng === "number");

  if (
    allowLocation &&
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

  if (discreteExtreme) {
    locationConsentAt = locationConsentAt || new Date().toISOString();
    locationSource = locationSource
      ? `${locationSource}+discrete_extreme`
      : "discrete_extreme_ip";
  }

  const triageRun = await runTriage({
    message: body.message,
    locale,
    source: body.source,
  });

  let triageForSession =
    body.source === "school" && triageRun.triage.category === "unknown"
      ? { ...triageRun.triage, category: "school" as const }
      : triageRun.triage;

  // Danger extrême : Ngemba IA force file urgente + prise en charge humaine.
  if (discreteExtreme) {
    const prefix =
      locale === "en"
        ? "[EXTREME DANGER · DISCRETE]"
        : "[DANGER EXTRÊME · MODE DISCRET]";
    triageForSession = {
      ...triageForSession,
      urgency: "critical",
      immediate_danger: true,
      routing_hint: "operator_required",
      summary_fr: `${prefix} ${triageForSession.summary_fr || ""}`.trim(),
      summary_user_locale:
        `${prefix} ${triageForSession.summary_user_locale || triageForSession.summary_fr || ""}`.trim(),
      required_services: Array.from(
        new Set([
          ...(triageForSession.required_services ?? []),
          "operator" as const,
        ]),
      ),
    };
  }

  const { routing, provider, aiMode } = discreteExtreme
    ? (() => {
        const decision = evaluateResponse({
          triage: triageForSession,
          source: body.source,
        });
        return {
          routing: {
            queue: decision.queue,
            autoRoute: decision.autoRoute,
          },
          provider: triageRun.provider,
          aiMode: triageRun.aiMode,
        };
      })()
    : {
        routing: triageRun.routing,
        provider: triageRun.provider,
        aiMode: triageRun.aiMode,
      };

  const jar = await cookies();
  let citizenToken = jar.get(CITIZEN_COOKIE)?.value ?? null;
  if (!citizenToken) citizenToken = newCitizenToken();

  const routingMeta = buildRoutingMeta({
    commune,
    locationLabel,
    category: triageForSession.category,
  });

  let partnerSla: number | null = null;
  for (const id of routingMeta.matchedPartnerIds) {
    const p = listPartners().find((x) => x.id === id);
    if (p?.slaMinutesCritical != null) {
      if (partnerSla == null || p.slaMinutesCritical < partnerSla) {
        partnerSla = p.slaMinutesCritical;
      }
    }
  }
  const createdAtPreview = new Date().toISOString();
  const slaDueAt = computeSlaDueAt(
    createdAtPreview,
    triageForSession.urgency,
    partnerSla,
  );

  const session = createSession({
    source: body.source,
    locale,
    message: body.message,
    urgency: triageForSession.urgency,
    category: triageForSession.category,
    immediateDanger: triageForSession.immediate_danger,
    lat,
    lng,
    locationLabel,
    commune,
    locationSource,
    locationConsentAt,
    aiSummary:
      triageForSession.summary_user_locale ||
      triageForSession.summary_fr ||
      opsSummaryFr(triageForSession.category, triageForSession.urgency),
    aiConfidence: triageForSession.confidence,
    aiPayload: triageForSession,
    routingQueue: routing.queue,
    autoRoute: routing.autoRoute,
    provider,
    aiMode,
    status: "active",
    citizenToken,
    clientIp: ip !== "unknown" ? ip : null,
    userAgent: req.headers.get("user-agent")?.slice(0, 300) || null,
    discreteMode: Boolean(body.discrete),
    trustedContacts,
    schoolContext,
    routingMeta,
    slaDueAt,
  });

  const referrals = buildReferrals({
    requiredServices: triageForSession.required_services ?? [],
    commune,
    locationLabel,
    category: triageForSession.category,
  });
  saveReferrals({
    sessionId: session.id,
    matches: referrals.matches,
    unmatched: referrals.unmatched,
  });

  await notifyNewAlert(session);
  if (discreteExtreme && trustedContacts.length > 0) {
    // Exception philo proches : danger extrême / mode discret → alerte auto cercle B.
    await notifyTrustedContacts(session, trustedContacts);
  }

  const response = NextResponse.json({
    id: session.id,
    urgency: session.urgency,
    category: session.category,
    queue: session.routingQueue,
    summary: session.aiSummary,
    provider: session.provider,
    aiMode: session.aiMode,
    locationLabel: session.locationLabel,
  });

  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(
    CITIZEN_COOKIE,
    citizenToken,
    citizenCookieOptions(secure),
  );
  return response;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (id) {
    const session = getSession(id);
    if (!session) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    // Jamais de fuite IP/UA/token via ?id= (vue citoyenne).
    return NextResponse.json({ session: sanitizeCitizenSession(session) });
  }

  const auth = await requireOpsAuth(req, { permission: "alerts.list" });
  if (auth instanceof NextResponse) return auth;

  const sessions = listSessions(80)
    .map((s) => applySlaEscalationIfNeeded(s))
    .filter((s) => sessionVisibleToActor(auth.actor, s, "operational"))
    .map((s) => {
      const base = sanitizeOpsSessionForActor(s, auth.actor);
      // File liste : pas d'IP/UA (investigation = dossier détail).
      return {
        ...base,
        clientIp: null,
        userAgent: null,
        trustedContacts: [],
        media: [],
        sla: slaUiState(s),
      };
    });

  const stats =
    auth.role === "admin"
      ? {
          total: sessions.length,
          critical: sessions.filter((s) => s.urgency === "critical").length,
          high: sessions.filter((s) => s.urgency === "high").length,
          open: sessions.filter(
            (s) => s.status !== "closed" && s.status !== "cancelled",
          ).length,
          slaBreached: sessions.filter((s) => s.sla.breached || s.sla.escalated)
            .length,
        }
      : undefined;

  return NextResponse.json({
    sessions: sessions.slice(0, 40),
    stats,
    role: auth.role,
    actor: {
      id: auth.actor.id,
      organizationId: auth.actor.organizationId,
      scopes: auth.actor.accreditation.scopes,
      level: auth.actor.accreditation.level,
    },
    partner: auth.partner
      ? { id: auth.partner.id, name: auth.partner.name }
      : null,
  });
}

import { NextResponse } from "next/server";
import {
  createOpenWaSession,
  getOpenWaHealth,
  getOpenWaSession,
  isOpenWaSessionLive,
  registerOpenWaWebhook,
} from "@/lib/auth/openwa-client";
import { requireSuperAdmin, StaffAuthError } from "@/lib/session-user";

export const dynamic = "force-dynamic";

/** Super-admin: OpenWA session status + setup hints. */
export async function GET() {
  try {
    await requireSuperAdmin();
  } catch (e) {
    const msg = e instanceof StaffAuthError ? e.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const health = await getOpenWaHealth();
  return NextResponse.json({
    ok: true,
    ...health,
    live: health.session ? isOpenWaSessionLive(health.session.status) : false,
    env: {
      apiBase: Boolean(process.env.OPENWA_API_BASE?.trim()),
      apiKey: Boolean(process.env.OPENWA_API_KEY?.trim()),
      sessionId: process.env.OPENWA_SESSION_ID?.trim() ?? null,
      webhookSecret: Boolean(process.env.OPENWA_WEBHOOK_SECRET?.trim()),
    },
    swaggerHint: process.env.OPENWA_API_BASE
      ? `${process.env.OPENWA_API_BASE.replace(/\/$/, "")}/api/docs`
      : "http://localhost:2785/api/docs",
  });
}

/**
 * Super-admin bootstrap: POST /api/sessions (name mcbuleli) + optional webhook.
 * Body: { registerWebhook?: boolean }
 */
export async function POST(req: Request) {
  try {
    await requireSuperAdmin();
  } catch (e) {
    const msg = e instanceof StaffAuthError ? e.message : "Forbidden";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    registerWebhook?: boolean;
    name?: string;
  };

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ??
    "https://mcbuleli.org";
  const webhookSecret = process.env.OPENWA_WEBHOOK_SECRET?.trim();
  const webhookUrl = `${appUrl}/api/webhooks/openwa/inbound`;

  const session = await createOpenWaSession({
    name: body.name?.trim() || "mcbuleli",
    autoReconnect: true,
    webhook:
      body.registerWebhook && webhookSecret
        ? {
            url: webhookUrl,
            events: ["message.received"],
            secret: webhookSecret,
          }
        : undefined,
  });

  if (!session) {
    return NextResponse.json({ error: "openwa_create_failed" }, { status: 502 });
  }

  if (body.registerWebhook && webhookSecret) {
    await registerOpenWaWebhook({
      sessionId: session.id,
      url: webhookUrl,
      secret: webhookSecret,
    });
  }

  const fresh = (await getOpenWaSession(session.id)) ?? session;

  return NextResponse.json({
    ok: true,
    session: fresh,
    nextSteps: [
      `Set OPENWA_SESSION_ID=${fresh.id} on Render`,
      "Scan QR: GET /api/sessions/{id}/qr on OpenWA (or Dashboard :2886)",
      `Register webhook → ${webhookUrl}`,
    ],
  });
}

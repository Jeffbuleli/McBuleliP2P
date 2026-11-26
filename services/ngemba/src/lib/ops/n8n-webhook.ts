import { createHmac } from "crypto";
import { readEnvKey } from "@/lib/env";
import type { AlertSessionRecord } from "@/lib/sessions/types";

function appUrl(): string {
  return (
    readEnvKey("APP_URL") ||
    readEnvKey("NEXT_PUBLIC_APP_URL") ||
    "http://localhost:3012"
  );
}

export function ngembaWebhookConfigured(): boolean {
  return Boolean(readEnvKey("NGEMBA_OPS_WEBHOOK_URL"));
}

export type NgembaWebhookType =
  | "ngemba.alert_escalated"
  | "ngemba.session.ai_accompaniment_started"
  | "ngemba.session.handoff_requested"
  | "ngemba.urgency_upgraded";

export function sessionWebhookPayload(session: AlertSessionRecord) {
  const shortId = session.id.slice(0, 8).toUpperCase();
  return {
    sessionId: session.id,
    shortId,
    urgency: session.urgency,
    category: session.category,
    locale: session.locale,
    status: session.status,
    source: session.source,
    primaryChannel: session.routingMeta?.primaryChannel ?? "app",
    accompanimentPhase: session.routingMeta?.accompanimentPhase ?? null,
    agentsNotified: Boolean(session.routingMeta?.agentsNotified),
    locationLabel: session.locationLabel,
    commune: session.commune,
    locationAccuracyM: session.locationAccuracyM,
    lat: session.lat,
    lng: session.lng,
    opsUrl: `${appUrl()}/ops/${session.id}`,
    citizenUrl: `${appUrl()}/session/${session.id}`,
  };
}

/** Événements métier NGEMBA → n8n (timers, Telegram groupe ops, relances). */
export async function postNgembaWebhook(
  type: NgembaWebhookType,
  payload: Record<string, unknown>,
): Promise<void> {
  const url = readEnvKey("NGEMBA_OPS_WEBHOOK_URL");
  if (!url) return;

  const body = { type, time: new Date().toISOString(), ...payload };
  const raw = JSON.stringify(body);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const secret = readEnvKey("NGEMBA_N8N_WEBHOOK_SECRET");
  if (secret) {
    const sig = createHmac("sha256", secret).update(raw).digest("hex");
    headers["X-Ngemba-Signature"] = `sha256=${sig}`;
  }

  const timeoutMs = Number(readEnvKey("NGEMBA_N8N_WEBHOOK_TIMEOUT_MS") || "8000");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: raw,
      signal: ctrl.signal,
    });
    if (!res.ok) {
      console.warn("[ngemba] n8n webhook", type, res.status);
    }
  } catch (err) {
    console.warn("[ngemba] n8n webhook failed", type, err);
  } finally {
    clearTimeout(timer);
  }
}
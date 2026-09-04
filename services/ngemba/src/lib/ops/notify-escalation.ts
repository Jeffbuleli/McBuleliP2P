import type { AlertSessionRecord } from "@/lib/sessions/store";
import {
  NGEMBA_EMAIL_FROM,
  NGEMBA_OPS_BCC_DEFAULT,
} from "@/lib/email/brand";
import { readEnvKey } from "@/lib/env";
import { categoryLabelFr, urgencyLabelFr } from "@/lib/labels";

function appUrl(): string {
  return (
    readEnvKey("APP_URL") ||
    readEnvKey("NEXT_PUBLIC_APP_URL") ||
    "http://localhost:3012"
  );
}

export async function notifyEscalation(session: AlertSessionRecord) {
  await Promise.allSettled([
    sendEscalationWebhook(session),
    sendEscalationEmail(session),
  ]);
}

async function sendEscalationWebhook(session: AlertSessionRecord) {
  const url = readEnvKey("NGEMBA_OPS_WEBHOOK_URL");
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "ngemba.alert_escalated",
        sessionId: session.id,
        urgency: session.urgency,
        category: session.category,
        escalation: session.escalation,
        routingMeta: session.routingMeta,
        url: `${appUrl()}/ops/${session.id}`,
      }),
    });
  } catch (err) {
    console.warn("[ngemba] escalation webhook failed", err);
  }
}

async function sendEscalationEmail(session: AlertSessionRecord) {
  const apiKey = readEnvKey("RESEND_API_KEY");
  const toRaw =
    readEnvKey("NGEMBA_OPS_EMAIL") ||
    (readEnvKey("NGEMBA_OPS_PILOT_VERIFIED") === "true"
      ? null
      : "info@ngemba-rdc.org");
  if (!apiKey || !toRaw) return;

  const to = toRaw
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const bcc = (
    readEnvKey("NGEMBA_OPS_EMAIL_BCC") || NGEMBA_OPS_BCC_DEFAULT
  )
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const from = readEnvKey("NGEMBA_OPS_EMAIL_FROM") || NGEMBA_EMAIL_FROM;
  const place = session.locationLabel || session.commune || "Lieu non precise";
  const reason = session.escalation?.reason ?? "SLA depasse";
  const text = [
    "NGEMBA - ESCALADE SLA",
    "",
    reason,
    `Urgence : ${urgencyLabelFr(session.urgency)}`,
    `Type : ${categoryLabelFr(session.category)}`,
    `Lieu : ${place}`,
    `Dossier : ${appUrl()}/ops/${session.id}`,
    "",
    "Prendre en charge des maintenant (file nationale / admin).",
  ].join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        bcc: bcc.length ? bcc : undefined,
        subject: `NGEMBA ESCALADE - ${urgencyLabelFr(session.urgency)} - ${place}`,
        text,
        headers: { "X-Entity-Ref-ID": `esc-${session.id}` },
      }),
    });
    if (!res.ok) {
      console.warn("[ngemba] escalation email failed", await res.text());
    }
  } catch (err) {
    console.warn("[ngemba] escalation email error", err);
  }
}

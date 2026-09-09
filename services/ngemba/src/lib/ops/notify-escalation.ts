import type { AlertSessionRecord } from "@/lib/sessions/store";
import {
  NGEMBA_EMAIL_ASSETS,
  NGEMBA_EMAIL_FROM,
  NGEMBA_OPS_BCC_DEFAULT,
  NGEMBA_OPS_EMAIL_DEFAULT,
} from "@/lib/email/brand";
import { renderOpsAlertEmail } from "@/lib/email/ops-alert-layout";
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
    readEnvKey("NGEMBA_OPS_EMAIL") || NGEMBA_OPS_EMAIL_DEFAULT;
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
  const replyTo =
    readEnvKey("NGEMBA_OPS_EMAIL_REPLY_TO") ||
    NGEMBA_EMAIL_ASSETS.supportEmail;
  const place = session.locationLabel || session.commune || "Lieu non précisé";
  const reason = session.escalation?.reason ?? "SLA dépassé";
  const urgency = urgencyLabelFr(session.urgency);
  const category = categoryLabelFr(session.category);
  const shortId = session.id.slice(0, 8).toUpperCase();
  const link = `${appUrl()}/ops/login?next=${encodeURIComponent(`/ops/${session.id}`)}`;

  const { html, text } = renderOpsAlertEmail({
    title: `Escalade SLA — ${place}`,
    preheader: `${urgency} · ${reason} · dossier ${shortId}`,
    greeting: "Bonjour,",
    body:
      "Cette alerte n’a pas été prise en charge dans les délais. " +
      "Merci d’intervenir immédiatement (file nationale / admin).",
    tone: "critical",
    badge: "Escalade",
    messageExcerpt: session.message.slice(0, 600) || undefined,
    summary: session.aiSummary || undefined,
    actionUrl: link,
    cta: "Prendre en charge maintenant",
    secondaryUrl: `${appUrl()}/ops`,
    secondaryLabel: "Ouvrir la file ops",
    footerNote: `Motif : ${reason}`,
    detailRows: [
      { label: "Urgence", value: urgency },
      { label: "Type", value: category },
      { label: "Lieu", value: place },
      { label: "Dossier", value: shortId },
      { label: "Motif", value: reason },
      ...(session.routingMeta?.scope
        ? [{ label: "Routage", value: session.routingMeta.scope }]
        : []),
    ],
  });

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
        reply_to: replyTo,
        subject: `[NGEMBA ESCALADE] ${urgency} · ${place}`,
        text,
        html,
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

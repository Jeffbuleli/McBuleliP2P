import type { AlertSessionRecord } from "@/lib/sessions/store";
import {
  NGEMBA_EMAIL_ASSETS,
  NGEMBA_EMAIL_FROM,
  NGEMBA_OPS_BCC_DEFAULT,
} from "@/lib/email/brand";
import { renderOpsAlertEmail } from "@/lib/email/ops-alert-layout";
import { readEnvKey } from "@/lib/env";
import {
  categoryLabelFr,
  sourceLabelFr,
  urgencyLabelFr,
} from "@/lib/labels";
import { emitOpsEvent } from "@/lib/ops/events";

function appUrl(): string {
  return (
    readEnvKey("APP_URL") ||
    readEnvKey("NEXT_PUBLIC_APP_URL") ||
    "http://localhost:3012"
  );
}

const NGEMBA_OPS_EMAIL_DEFAULT = "hi@mcbuleli.org";

/** Tant que le pilote JGL n'est pas valide par McBuleli, alertes → hi@ uniquement. */
function pilotVerified(): boolean {
  return readEnvKey("NGEMBA_OPS_PILOT_VERIFIED") === "true";
}

function opsEmails(): string[] {
  const raw = pilotVerified()
    ? readEnvKey("NGEMBA_OPS_EMAIL") || NGEMBA_OPS_EMAIL_DEFAULT
    : NGEMBA_OPS_EMAIL_DEFAULT;
  return raw
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function opsBccEmails(): string[] {
  const raw =
    readEnvKey("NGEMBA_OPS_EMAIL_BCC") || NGEMBA_OPS_BCC_DEFAULT;
  return raw
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function pilotPartnerLine(): string | undefined {
  const name = readEnvKey("NGEMBA_OPS_PARTNER_NAME");
  const contact = readEnvKey("NGEMBA_OPS_PARTNER_CONTACT");
  if (!name) return undefined;
  const referent = contact ? ` - ${contact}` : "";
  if (pilotVerified()) {
    return `Partenaire ONG pilote : ${name}${referent}.`;
  }
  return (
    `Partenaire ONG pilote prévu : ${name}${referent}. ` +
    `L'accès opérateur JGL n'est pas encore activé ; ` +
    `cette alerte vous est transmise sur hi@mcbuleli.org pour vérification par McBuleli.`
  );
}

export async function notifyNewAlert(session: AlertSessionRecord) {
  emitOpsEvent("alert_created", {
    id: session.id,
    urgency: session.urgency,
    category: session.category,
    createdAt: session.createdAt,
  });

  await Promise.allSettled([sendOpsWebhook(session), sendOpsEmail(session)]);
}

export async function notifySessionUpdated(session: AlertSessionRecord) {
  emitOpsEvent("alert_updated", {
    id: session.id,
    status: session.status,
    urgency: session.urgency,
    updatedAt: new Date().toISOString(),
  });
}

async function sendOpsWebhook(session: AlertSessionRecord) {
  const url = readEnvKey("NGEMBA_OPS_WEBHOOK_URL");
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "ngemba.alert_created",
        id: session.id,
        urgency: urgencyLabelFr(session.urgency),
        category: categoryLabelFr(session.category),
        source: sourceLabelFr(session.source),
        locale: session.locale,
        message: session.message.slice(0, 500),
        locationLabel: session.locationLabel,
        summary: session.aiSummary,
        opsUrl: `${appUrl()}/ops/login?next=${encodeURIComponent(`/ops/${session.id}`)}`,
        createdAt: session.createdAt,
      }),
    });
  } catch (err) {
    console.warn("[ngemba] ops webhook failed", err);
  }
}

async function sendOpsEmail(session: AlertSessionRecord) {
  const apiKey = readEnvKey("RESEND_API_KEY");
  const to = opsEmails();
  const bcc = opsBccEmails();
  if (!apiKey || to.length === 0) {
    console.warn(
      "[ngemba] ops email skipped - missing RESEND_API_KEY or NGEMBA_OPS_EMAIL",
    );
    return;
  }

  const from = readEnvKey("NGEMBA_OPS_EMAIL_FROM") || NGEMBA_EMAIL_FROM;
  const replyTo =
    readEnvKey("NGEMBA_OPS_EMAIL_REPLY_TO") ||
    NGEMBA_EMAIL_ASSETS.supportEmail;
  const link = `${appUrl()}/ops/login?next=${encodeURIComponent(`/ops/${session.id}`)}`;
  const place = session.locationLabel || session.commune || "Sans lieu";
  const urgency = urgencyLabelFr(session.urgency);
  const category = categoryLabelFr(session.category);
  const source = sourceLabelFr(session.source);
  const message = session.message.slice(0, 800);

  const subject = `NGEMBA - nouvelle alerte (${urgency})`;

  const { html, text } = renderOpsAlertEmail({
    title: "Nouvelle alerte citoyenne",
    preheader: `${urgency} - ${category} - ${place}`,
    greeting: "Bonjour,",
    body:
      "Une personne a signalé une situation via NGEMBA. " +
      "Merci de consulter le dossier et de la prendre en charge si nécessaire.",
    messageExcerpt: message,
    summary: session.aiSummary,
    actionUrl: link,
    cta: "Ouvrir le dossier",
    partnerLine: pilotPartnerLine(),
    detailRows: [
      { label: "Urgence", value: urgency },
      { label: "Type", value: category },
      { label: "Source", value: source },
      { label: "Lieu", value: place },
      { label: "Langue", value: session.locale.toUpperCase() },
      ...(session.discreteMode
        ? [{ label: "Mode", value: "Discret (vibration)" }]
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
        bcc,
        reply_to: replyTo,
        subject,
        text,
        html,
        headers: {
          "X-Entity-Ref-ID": session.id,
        },
      }),
    });
    const body = await res.text();
    if (!res.ok) {
      console.error("[ngemba] resend failed", res.status, body);
    } else {
      console.info("[ngemba] ops email sent", {
        to,
        bcc,
        id: session.id,
      });
    }
  } catch (err) {
    console.error("[ngemba] ops email failed", err);
  }
}

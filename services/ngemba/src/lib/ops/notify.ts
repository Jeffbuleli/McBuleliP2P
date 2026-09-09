import type { AlertSessionRecord } from "@/lib/sessions/store";
import {
  NGEMBA_EMAIL_ASSETS,
  NGEMBA_EMAIL_FROM,
  NGEMBA_OPS_BCC_DEFAULT,
  NGEMBA_OPS_EMAIL_DEFAULT,
} from "@/lib/email/brand";
import { renderOpsAlertEmail, toneFromUrgency } from "@/lib/email/ops-alert-layout";
import { readEnvKey } from "@/lib/env";
import {
  categoryLabelFr,
  sourceLabelFr,
  urgencyLabelFr,
} from "@/lib/labels";
import { SCHOOL_CONCERN_LABELS_FR } from "@/lib/school/types";
import { emitOpsEvent } from "@/lib/ops/events";

function appUrl(): string {
  return (
    readEnvKey("APP_URL") ||
    readEnvKey("NEXT_PUBLIC_APP_URL") ||
    "http://localhost:3012"
  );
}

const NGEMBA_OPS_EMAIL_FALLBACK = NGEMBA_OPS_EMAIL_DEFAULT;

/** Alertes → hi@mcbuleli.org (Resend mcbuleli.org). ONG pilote optionnelle si verifiee. */
function pilotVerified(): boolean {
  return readEnvKey("NGEMBA_OPS_PILOT_VERIFIED") === "true";
}

function opsEmails(): string[] {
  const raw = pilotVerified()
    ? readEnvKey("NGEMBA_OPS_EMAIL") || NGEMBA_OPS_EMAIL_FALLBACK
    : readEnvKey("NGEMBA_OPS_EMAIL") || NGEMBA_OPS_EMAIL_FALLBACK;
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
    `Cette alerte est transmise à hi@mcbuleli.org pour vérification (BCC McBuleli).`
  );
}

export async function notifyNewAlert(session: AlertSessionRecord) {
  emitOpsEvent("alert_created", {
    id: session.id,
    urgency: session.urgency,
    category: session.category,
    createdAt: session.createdAt,
  });

  // Proches : PAS de notify auto - visibles sur dossier ops (Appeler / WhatsApp / Email).
  // Voir docs/ngemba/19-PHILO-ORIENTATION-PROCHES.md
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
        discreteMode: session.discreteMode,
        immediateDanger: session.immediateDanger,
        clientIp: session.clientIp,
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
  const place = session.locationLabel || session.commune || "Lieu non précisé";
  const urgency = urgencyLabelFr(session.urgency);
  const category = categoryLabelFr(session.category);
  const source = sourceLabelFr(session.source);
  const message = session.message.slice(0, 800);
  const tone = toneFromUrgency(session.urgency);
  const shortId = session.id.slice(0, 8).toUpperCase();
  const province =
    session.routingMeta?.provinceName ||
    session.routingMeta?.provinceId ||
    null;

  const subject = session.discreteMode
    ? `[NGEMBA] DANGER EXTRÊME · MODE DISCRET · ${category} · ${place}`
    : `[NGEMBA] ${urgency} · ${category} · ${place}`;

  const { html, text } = renderOpsAlertEmail({
    title: session.discreteMode
      ? `DANGER EXTRÊME — ${place}`
      : `${category} — ${place}`,
    preheader: session.discreteMode
      ? `Mode discret · ${urgency} · ouvrir le dossier ${shortId} immédiatement`
      : `${urgency} · ${source} · ouvrir le dossier ${shortId}`,
    greeting: "Bonjour opérateur·rice,",
    body: session.discreteMode
      ? "Alerte MODE DISCRET : la personne a signalé un danger extrême. " +
        "Position / IP / proches peuvent être utilisés sans consentement supplémentaire. " +
        "Prenez en charge immédiatement, orientez le partenaire local, et contactez les proches si utile. " +
        "NGEMBA n’est pas un substitut police / SAMU."
      : "Une personne a signalé une situation via NGEMBA. " +
        "Ouvrez le dossier, vérifiez le résumé IA, puis prenez en charge ou orientez. " +
        "NGEMBA n’est pas un substitut police / SAMU.",
    tone: session.discreteMode ? "critical" : tone,
    badge: session.discreteMode ? "DANGER EXTRÊME" : urgency,
    messageExcerpt: message,
    summary: session.aiSummary,
    actionUrl: link,
    cta: "Ouvrir le dossier",
    secondaryUrl: `${appUrl()}/ops`,
    secondaryLabel: "Voir toute la file ops",
    partnerLine: pilotPartnerLine(),
    footerNote: `Réf. dossier ${shortId} · répondre sous SLA selon l’urgence.`,
    detailRows: [
      { label: "Urgence", value: urgency },
      { label: "Type", value: category },
      { label: "Source", value: source },
      { label: "Lieu", value: place },
      ...(province ? [{ label: "Province", value: String(province) }] : []),
      ...(session.routingMeta?.ipGeo?.label
        ? [
            {
              label: "Lieu IP ≈",
              value: session.routingMeta.ipGeo.label,
            },
          ]
        : []),
      ...(session.clientIp
        ? [{ label: "IP citoyenne", value: session.clientIp }]
        : []),
      { label: "Langue", value: session.locale.toUpperCase() },
      { label: "Dossier", value: shortId },
      ...(session.discreteMode
        ? [
            {
              label: "Mode",
              value: "Discret · danger extrême (GPS/IP/proches autorisés)",
            },
          ]
        : []),
      ...(session.schoolContext
        ? [
            {
              label: "Safe School",
              value:
                SCHOOL_CONCERN_LABELS_FR[session.schoolContext.concernType] ??
                session.schoolContext.concernType,
            },
            ...(session.schoolContext.establishmentHint
              ? [
                  {
                    label: "Établissement",
                    value: session.schoolContext.establishmentHint,
                  },
                ]
              : []),
          ]
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

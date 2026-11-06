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
import { juryEmails } from "@/lib/ops/team";

function appUrl(): string {
  return (
    readEnvKey("APP_URL") ||
    readEnvKey("NEXT_PUBLIC_APP_URL") ||
    "http://localhost:3012"
  );
}

const NGEMBA_OPS_EMAIL_FALLBACK = NGEMBA_OPS_EMAIL_DEFAULT;

function opsEmails(): string[] {
  const raw = readEnvKey("NGEMBA_OPS_EMAIL") || NGEMBA_OPS_EMAIL_FALLBACK;
  const extra = raw
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set([...juryEmails(), ...extra])];
}

function dutyLine(session: AlertSessionRecord): string {
  if (
    session.immediateDanger ||
    session.urgency === "critical" ||
    session.source === "sos_button" ||
    session.source === "shake" ||
    session.discreteMode
  ) {
    return "Joyce Dahudi prend ce danger immédiat. Jeff Buleli confirme.";
  }
  if (session.source === "witness") {
    return "Timothée S. prend ce témoignage. Jeff Buleli confirme.";
  }
  if (
    session.source === "school" ||
    ["vbg", "sexual_violence", "domestic_violence", "child_danger", "harassment"].includes(
      session.category,
    )
  ) {
    return "Jérémie Kimbiya prend cette protection. Jeff Buleli confirme.";
  }
  return "Jeff Buleli coordonne. L'équipe ouvre le dossier et répond dans le chat.";
}

function opsBccEmails(): string[] {
  const raw =
    readEnvKey("NGEMBA_OPS_EMAIL_BCC") || NGEMBA_OPS_BCC_DEFAULT;
  return raw
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
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
  await sendOpsEmail(session);
}

export async function notifySessionUpdated(session: AlertSessionRecord) {
  emitOpsEvent("alert_updated", {
    id: session.id,
    status: session.status,
    urgency: session.urgency,
    updatedAt: new Date().toISOString(),
  });
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
    greeting: "Équipe Ngemba,",
    body:
      `Ngemba a écouté et vous passe la main. ${dutyLine(session)} ` +
      "Ouvrez le dossier, lisez le résumé, puis répondez dans le chat. " +
      "Les organisations pilotes ne sont pas prévenues.",
    tone: session.discreteMode ? "critical" : tone,
    badge: session.discreteMode ? "DANGER EXTRÊME" : urgency,
    messageExcerpt: message,
    summary: session.aiSummary,
    actionUrl: link,
    cta: "Ouvrir le dossier",
    secondaryUrl: `${appUrl()}/ops`,
    secondaryLabel: "Voir toute la file ops",
    partnerLine: undefined,
    footerNote: `Réf. dossier ${shortId} · répondre sous SLA selon l’urgence.`,
    detailRows: [
      { label: "Urgence", value: urgency },
      { label: "Type", value: category },
      { label: "Source", value: source },
      { label: "Lieu", value: place },
      ...(session.locationAccuracyM != null
        ? [
            {
              label: "Précision GPS",
              value: `± ${session.locationAccuracyM} m`,
            },
          ]
        : []),
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

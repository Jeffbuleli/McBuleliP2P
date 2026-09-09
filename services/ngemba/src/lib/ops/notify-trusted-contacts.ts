import type { AlertSessionRecord } from "@/lib/sessions/store";
import type { TrustedContact } from "@/lib/trusted-contacts/types";
import { NGEMBA_EMAIL_ASSETS, NGEMBA_EMAIL_FROM } from "@/lib/email/brand";
import { renderOpsAlertEmail, toneFromUrgency } from "@/lib/email/ops-alert-layout";
import { readEnvKey } from "@/lib/env";
import { urgencyLabelFr } from "@/lib/labels";

function appUrl(): string {
  return (
    readEnvKey("APP_URL") ||
    readEnvKey("NEXT_PUBLIC_APP_URL") ||
    "http://localhost:3012"
  );
}

function contactMessage(session: AlertSessionRecord, contactName: string) {
  const place = session.locationLabel || session.commune || "lieu non précisé";
  const urgency = urgencyLabelFr(session.urgency);
  const maps =
    session.lat != null && session.lng != null
      ? `https://maps.google.com/?q=${session.lat},${session.lng}`
      : null;

  const lines = [
    `NGEMBA — alerte de ${contactName}`,
    "",
    `Une personne de votre cercle de confiance a envoyé une alerte (${urgency}).`,
    `Lieu : ${place}`,
    session.message ? `Message : ${session.message.slice(0, 200)}` : null,
    maps ? `Position : ${maps}` : null,
    "",
    "Les opérateurs NGEMBA sont informés. Contactez cette personne si vous le pouvez.",
    `Plus d'infos : ${appUrl()}`,
  ].filter(Boolean);

  return lines.join("\n");
}

async function sendContactEmail(
  contact: TrustedContact,
  session: AlertSessionRecord,
) {
  const apiKey = readEnvKey("RESEND_API_KEY");
  const email = contact.email?.trim();
  if (!apiKey || !email) return;

  const from = readEnvKey("NGEMBA_OPS_EMAIL_FROM") || NGEMBA_EMAIL_FROM;
  const place = session.locationLabel || session.commune || "Lieu non précisé";
  const urgency = urgencyLabelFr(session.urgency);
  const maps =
    session.lat != null && session.lng != null
      ? `https://maps.google.com/?q=${session.lat},${session.lng}`
      : null;
  const tone = toneFromUrgency(session.urgency);

  const { html, text } = renderOpsAlertEmail({
    title: `${contact.name} a besoin d’aide`,
    preheader: `Alerte ${urgency} · ${place}`,
    greeting: "Bonjour,",
    body:
      "Une personne de votre cercle de confiance a envoyé une alerte via NGEMBA. " +
      "Les opérateurs sont informés. Contactez-la si vous le pouvez en sécurité.",
    tone,
    badge: urgency,
    messageExcerpt: session.message
      ? session.message.slice(0, 400)
      : undefined,
    actionUrl: maps || appUrl(),
    cta: maps ? "Voir la position" : "Ouvrir NGEMBA",
    footerNote:
      "Cet email ne remplace pas les numéros d’urgence. En danger immédiat, appelez les services locaux.",
    detailRows: [
      { label: "Contact", value: contact.name },
      { label: "Urgence", value: urgency },
      { label: "Lieu", value: place },
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
        to: [email],
        reply_to: NGEMBA_EMAIL_ASSETS.supportEmail,
        subject: `[NGEMBA] ${contact.name} — alerte ${urgency}`,
        text: text || contactMessage(session, contact.name),
        html,
        headers: { "X-Entity-Ref-ID": `tc-${session.id}` },
      }),
    });
    if (!res.ok) {
      console.warn("[ngemba] trusted contact email failed", email, await res.text());
    }
  } catch (err) {
    console.warn("[ngemba] trusted contact email error", email, err);
  }
}

async function sendContactSms(
  contact: TrustedContact,
  session: AlertSessionRecord,
) {
  const phone = contact.phone?.replace(/\s+/g, "");
  if (!phone) return;

  const text = contactMessage(session, contact.name).slice(0, 480);

  const webhook = readEnvKey("NGEMBA_SMS_WEBHOOK_URL");
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ngemba.trusted_contact_alert",
          phone,
          message: text,
          sessionId: session.id,
        }),
      });
      return;
    } catch (err) {
      console.warn("[ngemba] SMS webhook failed", phone, err);
    }
  }

  const atUser = readEnvKey("NGEMBA_AT_USERNAME");
  const atKey = readEnvKey("NGEMBA_AT_API_KEY");
  const atFrom = readEnvKey("NGEMBA_AT_FROM");
  if (!atUser || !atKey || !atFrom) return;

  try {
    const body = new URLSearchParams({
      username: atUser,
      to: phone,
      message: text,
      from: atFrom,
    });
    const res = await fetch(
      "https://api.africastalking.com/version1/messaging",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          apiKey: atKey,
        },
        body: body.toString(),
      },
    );
    if (!res.ok) {
      console.warn("[ngemba] Africa's Talking SMS failed", phone, await res.text());
    }
  } catch (err) {
    console.warn("[ngemba] Africa's Talking SMS error", phone, err);
  }
}

export async function notifyTrustedContacts(
  session: AlertSessionRecord,
  contacts: TrustedContact[],
) {
  if (!contacts.length) return;

  await Promise.allSettled(
    contacts.flatMap((contact) => [
      sendContactEmail(contact, session),
      sendContactSms(contact, session),
    ]),
  );
}

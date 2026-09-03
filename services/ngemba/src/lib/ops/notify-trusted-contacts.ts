import type { AlertSessionRecord } from "@/lib/sessions/store";
import type { TrustedContact } from "@/lib/trusted-contacts/types";
import { NGEMBA_EMAIL_FROM } from "@/lib/email/brand";
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
  const place = session.locationLabel || session.commune || "lieu non precise";
  const urgency = urgencyLabelFr(session.urgency);
  const maps =
    session.lat != null && session.lng != null
      ? `https://maps.google.com/?q=${session.lat},${session.lng}`
      : null;

  const lines = [
    `NGEMBA - alerte de ${contactName}`,
    "",
    `Une personne de votre cercle de confiance a envoye une alerte (${urgency}).`,
    `Lieu : ${place}`,
    session.message ? `Message : ${session.message.slice(0, 200)}` : null,
    maps ? `Position : ${maps}` : null,
    "",
    "Les operateurs NGEMBA sont informes. Contactez cette personne si vous le pouvez.",
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
  const text = contactMessage(session, contact.name);
  const subject = `NGEMBA - ${contact.name} a besoin d'aide`;

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
        subject,
        text,
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

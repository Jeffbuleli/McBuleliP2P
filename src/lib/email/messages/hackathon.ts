import { eq } from "drizzle-orm";
import { getDb, hackathonEditions, hackathonRegistrations } from "@/db";
import { renderMcBuleliEmail } from "@/lib/email/layout";
import { sendEmail } from "@/lib/email/send";
import {
  HACKATHON_REMINDER_HOURS,
  HACKATHON_VENUE_SILIKIN,
} from "@/lib/hackathon/constants";
import { payLaterPublicUrl, ticketPublicUrl } from "@/lib/hackathon/service";

function venueLabel(edition: { venue: string | null; city: string } | null | undefined) {
  const venue = edition?.venue?.trim();
  if (venue && !/confirmer|tbd|tba|à définir/i.test(venue)) {
    return `${venue}, ${edition?.city ?? "Kinshasa"}`;
  }
  return `${HACKATHON_VENUE_SILIKIN}, Kinshasa`;
}

function dateLabel(isFr: boolean) {
  return isFr ? "Août 2026" : "August 2026";
}

export async function sendHackathonReserveEmail(args: {
  registrationId: string;
}): Promise<boolean> {
  const db = getDb();
  const [reg] = await db
    .select()
    .from(hackathonRegistrations)
    .where(eq(hackathonRegistrations.id, args.registrationId))
    .limit(1);
  if (!reg?.paymentToken || reg.paymentStatus !== "reserved") return false;

  const [edition] = await db
    .select()
    .from(hackathonEditions)
    .where(eq(hackathonEditions.id, reg.editionId))
    .limit(1);

  const isFr = reg.locale !== "en";
  const payUrl = payLaterPublicUrl(reg.paymentToken);
  const editionName = isFr
    ? (edition?.nameFr ?? "McBuleli Hackathon")
    : (edition?.nameEn ?? "McBuleli Hackathon");

  const subject = isFr
    ? `Place réservée - ${editionName}`
    : `Seat reserved - ${editionName}`;

  const { html, text } = renderMcBuleliEmail({
    locale: isFr ? "fr" : "en",
    illustration: "verify",
    actionUrl: payUrl,
    copy: {
      subject,
      preheader: isFr
        ? "Votre place est pré-réservée. Payez pour recevoir votre ticket QR officiel."
        : "Your seat is reserved. Pay to receive your official QR ticket.",
      title: isFr ? `Bonjour ${reg.firstName}` : `Hi ${reg.firstName}`,
      body: isFr
        ? `Votre pré-inscription à ${editionName} est enregistrée. Votre place est réservée sans expiration automatique. Nous vous rappelons toutes les ${HACKATHON_REMINDER_HOURS} h pour confirmer. Cliquez pour payer (${reg.priceUsd} USD) et recevoir votre ticket QR. Compte McBuleli : utilisez « Mot de passe oublié » sur mcbuleli.org/login si besoin.`
        : `Your pre-registration for ${editionName} is saved. Your seat is held with no automatic expiry. We remind you every ${HACKATHON_REMINDER_HOURS} h to confirm. Tap below to pay (${reg.priceUsd} USD) and receive your QR ticket. McBuleli account: use “Forgot password” on mcbuleli.org/login if needed.`,
      cta: isFr ? "Payer mon inscription" : "Pay my registration",
      footerHelp: isFr ? "Besoin d'aide ?" : "Need help?",
      footerContact: isFr ? "Contactez-nous" : "Contact us",
    },
    detailRows: [
      { label: isFr ? "Participant" : "Participant", value: `${reg.firstName} ${reg.lastName}` },
      { label: "Email", value: reg.email },
      { label: isFr ? "Téléphone" : "Phone", value: reg.phone },
      { label: isFr ? "Édition" : "Edition", value: editionName },
      { label: isFr ? "Lieu" : "Venue", value: venueLabel(edition) },
      { label: isFr ? "Date" : "Date", value: dateLabel(isFr) },
      {
        label: isFr ? "Pack" : "Pack",
        value: isFr ? "Programme 3 jours" : "3-day program",
      },
      {
        label: isFr ? "Montant" : "Amount",
        value: `${reg.priceUsd} USD`,
      },
    ],
  });

  return sendEmail({ to: reg.email, subject, html, text });
}

export async function sendHackathonHoldReminderEmail(args: {
  registrationId: string;
}): Promise<boolean> {
  const db = getDb();
  const [reg] = await db
    .select()
    .from(hackathonRegistrations)
    .where(eq(hackathonRegistrations.id, args.registrationId))
    .limit(1);
  if (!reg?.paymentToken || reg.paymentStatus !== "reserved") return false;

  const [edition] = await db
    .select()
    .from(hackathonEditions)
    .where(eq(hackathonEditions.id, reg.editionId))
    .limit(1);

  const isFr = reg.locale !== "en";
  const payUrl = payLaterPublicUrl(reg.paymentToken);
  const editionName = isFr
    ? (edition?.nameFr ?? "McBuleli Hackathon")
    : (edition?.nameEn ?? "McBuleli Hackathon");

  const subject = isFr
    ? `Rappel - finalisez votre inscription (${editionName})`
    : `Reminder - complete your registration (${editionName})`;

  const { html, text } = renderMcBuleliEmail({
    locale: isFr ? "fr" : "en",
    illustration: "verify",
    actionUrl: payUrl,
    copy: {
      subject,
      preheader: isFr
        ? "Confirmez votre réservation en payant votre inscription."
        : "Confirm your reservation by paying your registration.",
      title: isFr ? `Bonjour ${reg.firstName}` : `Hi ${reg.firstName}`,
      body: isFr
        ? `Rappel pour ${editionName} : votre place est toujours réservée (${reg.firstName} ${reg.lastName}). Payez pour confirmer et recevoir votre ticket QR. Nous vous rappelons toutes les ${HACKATHON_REMINDER_HOURS} h tant que le paiement n'est pas fait.`
        : `Reminder for ${editionName}: your seat is still reserved (${reg.firstName} ${reg.lastName}). Pay to confirm and receive your QR ticket. We remind you every ${HACKATHON_REMINDER_HOURS} h until payment is complete.`,
      cta: isFr ? "Payer maintenant" : "Pay now",
      footerHelp: isFr ? "Besoin d'aide ?" : "Need help?",
      footerContact: isFr ? "Contactez-nous" : "Contact us",
    },
    detailRows: [
      { label: isFr ? "Participant" : "Participant", value: `${reg.firstName} ${reg.lastName}` },
      { label: "Email", value: reg.email },
      { label: isFr ? "Lieu" : "Venue", value: venueLabel(edition) },
      { label: isFr ? "Date" : "Date", value: dateLabel(isFr) },
      {
        label: isFr ? "Montant" : "Amount",
        value: `${reg.priceUsd} USD`,
      },
    ],
  });

  return sendEmail({ to: reg.email, subject, html, text });
}

export async function sendHackathonTicketEmail(args: {
  registrationId: string;
}): Promise<boolean> {
  const db = getDb();
  const [reg] = await db
    .select()
    .from(hackathonRegistrations)
    .where(eq(hackathonRegistrations.id, args.registrationId))
    .limit(1);
  if (!reg?.ticketCode || reg.paymentStatus !== "paid") return false;

  const [edition] = await db
    .select()
    .from(hackathonEditions)
    .where(eq(hackathonEditions.id, reg.editionId))
    .limit(1);

  const isFr = reg.locale !== "en";
  const ticketUrl = ticketPublicUrl(reg.ticketCode);
  const editionName = isFr
    ? (edition?.nameFr ?? "McBuleli Hackathon")
    : (edition?.nameEn ?? "McBuleli Hackathon");

  const subject = isFr
    ? `Votre ticket officiel - ${editionName}`
    : `Your official ticket - ${editionName}`;

  const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(ticketUrl)}`;
  const extraHtml = `<div style="text-align:center;background:${"#e8f3ee"};border-radius:14px;padding:18px 16px;">
      <p style="margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#305f33;">${isFr ? "Ticket QR" : "QR ticket"}</p>
      <img src="${qrImg}" width="180" height="180" alt="QR ${reg.ticketCode}" style="display:block;margin:0 auto;border:0;border-radius:12px;background:#ffffff;padding:8px;" />
      <p style="margin:12px 0 0;font-family:ui-monospace,Menlo,monospace;font-size:16px;font-weight:800;letter-spacing:0.06em;color:#305f33;">${reg.ticketCode}</p>
      <p style="margin:8px 0 0;font-size:12px;line-height:1.45;color:#57534e;">${isFr ? "Présentez ce QR (ou le code) à l'entrée." : "Show this QR (or the code) at the entrance."}</p>
    </div>`;

  const { html, text } = renderMcBuleliEmail({
    locale: isFr ? "fr" : "en",
    illustration: "verify",
    actionUrl: ticketUrl,
    extraHtml,
    copy: {
      subject,
      preheader: isFr
        ? `Paiement confirmé · Ticket ${reg.ticketCode}. Présentez le QR à l'entrée.`
        : `Payment confirmed · Ticket ${reg.ticketCode}. Show the QR at the entrance.`,
      title: isFr ? `Bienvenue ${reg.firstName}` : `Welcome ${reg.firstName}`,
      body: isFr
        ? `Votre inscription à ${editionName} est confirmée. Conservez ce message et votre ticket QR (code ${reg.ticketCode}) - ils vous seront demandés à l'entrée du Silikin Village.`
        : `Your registration for ${editionName} is confirmed. Keep this email and your QR ticket (code ${reg.ticketCode}) - you will need them at the Silikin Village entrance.`,
      cta: isFr ? "Ouvrir mon ticket" : "Open my ticket",
      footerHelp: isFr ? "Besoin d'aide ?" : "Need help?",
      footerContact: isFr ? "Contactez-nous" : "Contact us",
    },
    detailRows: [
      { label: isFr ? "Participant" : "Participant", value: `${reg.firstName} ${reg.lastName}` },
      { label: "Email", value: reg.email },
      { label: isFr ? "Téléphone" : "Phone", value: reg.phone },
      { label: isFr ? "Édition" : "Edition", value: editionName },
      { label: isFr ? "Lieu" : "Venue", value: venueLabel(edition) },
      { label: isFr ? "Date" : "Date", value: dateLabel(isFr) },
      {
        label: isFr ? "Pack" : "Pack",
        value: isFr ? "Programme 3 jours · 100 USD" : "3-day program · 100 USD",
      },
      { label: isFr ? "Code ticket" : "Ticket code", value: reg.ticketCode },
      { label: isFr ? "Réf. inscription" : "Registration ID", value: reg.id.slice(0, 8).toUpperCase() },
    ],
  });

  return sendEmail({ to: reg.email, subject, html, text });
}

export async function sendHackathonPartnerAckEmail(args: {
  to: string;
  orgName: string;
  contactName: string;
  locale: "fr" | "en";
}): Promise<boolean> {
  const isFr = args.locale !== "en";
  const subject = isFr
    ? "Partenariat McBuleli Hackathon - demande reçue"
    : "McBuleli Hackathon partnership - request received";
  const { html, text } = renderMcBuleliEmail({
    locale: isFr ? "fr" : "en",
    illustration: "verify",
    actionUrl: "https://mcbuleli.org/hackathon#partner",
    copy: {
      subject,
      preheader: isFr
        ? "Merci. Notre équipe vous recontacte bientôt."
        : "Thanks. Our team will follow up soon.",
      title: isFr
        ? `Bonjour ${args.contactName}`
        : `Hi ${args.contactName}`,
      body: isFr
        ? `Nous avons bien reçu la demande de partenariat de ${args.orgName} pour le Hackathon McBuleli. Notre équipe revient vers vous sous peu.`
        : `We received the partnership request from ${args.orgName} for the McBuleli Hackathon. Our team will get back to you shortly.`,
      cta: isFr ? "Voir le programme" : "View the program",
      footerHelp: isFr ? "Besoin d'aide ?" : "Need help?",
      footerContact: isFr ? "Contactez-nous" : "Contact us",
    },
  });

  return sendEmail({ to: args.to, subject, html, text });
}

export async function sendHackathonSponsorAckEmail(args: {
  to: string;
  companyName: string;
  contactName: string;
  pack: string;
  locale: "fr" | "en";
}): Promise<boolean> {
  const isFr = args.locale !== "en";
  const subject = isFr
    ? "Sponsorship McBuleli Hackathon - demande reçue"
    : "McBuleli Hackathon sponsorship - request received";
  const { html, text } = renderMcBuleliEmail({
    locale: isFr ? "fr" : "en",
    illustration: "verify",
    actionUrl: "https://mcbuleli.org/hackathon#sponsor",
    copy: {
      subject,
      preheader: isFr
        ? "Merci pour votre intérêt."
        : "Thanks for your interest.",
      title: isFr
        ? `Bonjour ${args.contactName}`
        : `Hi ${args.contactName}`,
      body: isFr
        ? `Nous avons reçu la demande de sponsorship de ${args.companyName} (pack ${args.pack}). Nous revenons vers vous avec la grille et les prochaines étapes.`
        : `We received the sponsorship request from ${args.companyName} (pack ${args.pack}). We will follow up with the package details and next steps.`,
      cta: isFr ? "Voir le Hackathon" : "View the Hackathon",
      footerHelp: isFr ? "Besoin d'aide ?" : "Need help?",
      footerContact: isFr ? "Contactez-nous" : "Contact us",
    },
  });

  return sendEmail({ to: args.to, subject, html, text });
}

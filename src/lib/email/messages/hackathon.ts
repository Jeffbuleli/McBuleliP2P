import { eq } from "drizzle-orm";
import { getDb, hackathonEditions, hackathonRegistrations } from "@/db";
import { renderMcBuleliEmail } from "@/lib/email/layout";
import { sendEmail } from "@/lib/email/send";
import {
  HACKATHON_HOLD_HOURS,
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
  return isFr ? "Bientôt" : "Coming soon";
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
  const holdHours = HACKATHON_HOLD_HOURS;
  const expiresLabel = reg.holdExpiresAt
    ? reg.holdExpiresAt.toLocaleString(isFr ? "fr-FR" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

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
        ? `Votre place est pré-réservée ${holdHours} h. Payez quand vous êtes prêt.`
        : `Your seat is held for ${holdHours} h. Pay when you are ready.`,
      title: isFr ? `Bonjour ${reg.firstName}` : `Hi ${reg.firstName}`,
      body: isFr
        ? `Votre pré-inscription à ${editionName} est enregistrée. Votre place est réservée ${holdHours} heures${expiresLabel ? ` (jusqu'au ${expiresLabel})` : ""}. Cliquez pour payer et recevoir votre ticket QR. Compte McBuleli : utilisez « Mot de passe oublié » sur mcbuleli.org/login si besoin.`
        : `Your pre-registration for ${editionName} is saved. Your seat is held for ${holdHours} hours${expiresLabel ? ` (until ${expiresLabel})` : ""}. Tap below to pay and receive your QR ticket. McBuleli account: use “Forgot password” on mcbuleli.org/login if needed.`,
      cta: isFr ? "Payer mon inscription" : "Pay my registration",
      footerHelp: isFr ? "Besoin d'aide ?" : "Need help?",
      footerContact: isFr ? "Contactez-nous" : "Contact us",
    },
    detailRows: [
      { label: isFr ? "Édition" : "Edition", value: editionName },
      { label: isFr ? "Lieu" : "Venue", value: venueLabel(edition) },
      { label: isFr ? "Date" : "Date", value: dateLabel(isFr) },
      {
        label: isFr ? "Pack" : "Pack",
        value:
          reg.ticketPack === "day1"
            ? isFr
              ? "1 jour"
              : "1 day"
            : isFr
              ? "2 jours + Hackathon"
              : "2 days + Hackathon",
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
  const expiresLabel = reg.holdExpiresAt
    ? reg.holdExpiresAt.toLocaleString(isFr ? "fr-FR" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

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
        ? "Votre réservation expire bientôt. Payez pour garder votre place."
        : "Your hold expires soon. Pay to keep your seat.",
      title: isFr ? `Bonjour ${reg.firstName}` : `Hi ${reg.firstName}`,
      body: isFr
        ? `Dernière étape pour ${editionName} : payez avant ${expiresLabel ?? "l'expiration"} pour confirmer votre place et recevoir votre ticket QR.`
        : `Last step for ${editionName}: pay before ${expiresLabel ?? "expiry"} to confirm your seat and receive your QR ticket.`,
      cta: isFr ? "Payer maintenant" : "Pay now",
      footerHelp: isFr ? "Besoin d'aide ?" : "Need help?",
      footerContact: isFr ? "Contactez-nous" : "Contact us",
    },
    detailRows: [
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
    ? `Votre ticket - ${editionName}`
    : `Your ticket - ${editionName}`;

  const { html, text } = renderMcBuleliEmail({
    locale: isFr ? "fr" : "en",
    illustration: "verify",
    actionUrl: ticketUrl,
    copy: {
      subject,
      preheader: isFr
        ? "Paiement confirmé. Présentez votre QR à l'entrée."
        : "Payment confirmed. Show your QR at the entrance.",
      title: isFr ? `Bonjour ${reg.firstName}` : `Hi ${reg.firstName}`,
      body: isFr
        ? `Votre inscription à ${editionName} est confirmée. Conservez ce ticket (code ${reg.ticketCode}) - il vous sera demandé à l'entrée.`
        : `Your registration for ${editionName} is confirmed. Keep this ticket (code ${reg.ticketCode}) - you will need it at the entrance.`,
      cta: isFr ? "Voir mon ticket" : "View my ticket",
      footerHelp: isFr ? "Besoin d'aide ?" : "Need help?",
      footerContact: isFr ? "Contactez-nous" : "Contact us",
    },
    detailRows: [
      { label: isFr ? "Édition" : "Edition", value: editionName },
      { label: isFr ? "Lieu" : "Venue", value: venueLabel(edition) },
      { label: isFr ? "Date" : "Date", value: dateLabel(isFr) },
      {
        label: isFr ? "Pack" : "Pack",
        value:
          reg.ticketPack === "day1"
            ? isFr
              ? "1 jour"
              : "1 day"
            : isFr
              ? "2 jours + Hackathon"
              : "2 days + Hackathon",
      },
      { label: isFr ? "Code ticket" : "Ticket code", value: reg.ticketCode },
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

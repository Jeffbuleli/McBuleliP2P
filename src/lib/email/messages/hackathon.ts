import { eq } from "drizzle-orm";
import { getDb, hackathonEditions, hackathonRegistrations } from "@/db";
import { EMAIL_BRAND, logoUrl } from "@/lib/email/config";
import { renderMcBuleliEmail } from "@/lib/email/layout";
import { sendEmail } from "@/lib/email/send";
import {
  HACKATHON_REMINDER_HOURS,
  HACKATHON_VENUE_SILIKIN,
} from "@/lib/hackathon/constants";
import { passPublicUrl } from "@/lib/hackathon/access";
import { payLaterPublicUrl, ticketPublicUrl } from "@/lib/hackathon/service";

function venueLabel(edition: { venue: string | null; city: string } | null | undefined) {
  const venue = edition?.venue?.trim();
  if (venue && !/confirmer|tbd|tba|à définir/i.test(venue)) {
    return `${venue}, ${edition?.city ?? "Kinshasa"}`;
  }
  return `${HACKATHON_VENUE_SILIKIN}, Kinshasa`;
}

function dateLabel(isFr: boolean) {
  return isFr ? "28–29 Août 2026" : "August 28–29, 2026";
}

/** QR ticket/badge card with McBuleli logo centered (baked into QR + email-safe card). */
export function renderHackathonTicketQrCardHtml(args: {
  ticketUrl: string;
  ticketCode: string;
  isFr: boolean;
  /** Default: Ticket QR / QR ticket */
  heading?: string;
  hint?: string;
}): string {
  const { ticketUrl, ticketCode, isFr } = args;
  const heading =
    args.heading ?? (isFr ? "Ticket QR" : "QR ticket");
  const hint =
    args.hint ??
    (isFr
      ? "Présentez ce QR (ou le code) à l'entrée. Valable les 2 Jours."
      : "Show this QR (or the code) at the entrance. Valid for both days.");
  const logo = logoUrl();
  // Bake logo into QR (ecLevel H) so it survives every mail client, including Outlook.
  const qrImg =
    `https://quickchart.io/qr` +
    `?text=${encodeURIComponent(ticketUrl)}` +
    `&size=220` +
    `&margin=2` +
    `&dark=305f33` +
    `&light=ffffff` +
    `&ecLevel=H` +
    `&centerImageUrl=${encodeURIComponent(logo)}` +
    `&centerImageSizeRatio=0.24`;

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.white};border:1px solid ${EMAIL_BRAND.border};border-radius:16px;overflow:hidden;">
  <tr>
    <td style="padding:14px 18px 8px;background:${EMAIL_BRAND.mint};border-bottom:1px solid ${EMAIL_BRAND.border};text-align:center;">
      <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${EMAIL_BRAND.primary};">${heading}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:22px 18px 8px;text-align:center;background:${EMAIL_BRAND.white};">
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
        <tr>
          <td style="width:200px;background:${EMAIL_BRAND.mint};border-radius:18px;border:1px solid ${EMAIL_BRAND.border};padding:12px;text-align:center;">
            <img src="${qrImg}" width="176" height="176" alt="QR ${ticketCode}" style="display:block;margin:0 auto;border:0;border-radius:12px;background:${EMAIL_BRAND.white};" />
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:18px;font-weight:800;letter-spacing:0.08em;color:${EMAIL_BRAND.primary};">${ticketCode}</p>
      <p style="margin:8px 0 0;font-size:12px;line-height:1.45;color:${EMAIL_BRAND.muted};">${hint}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:0 18px 18px;background:${EMAIL_BRAND.white};font-size:0;line-height:0;">&nbsp;</td>
  </tr>
</table>`;
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
        value: isFr ? "Programme 2 Jours" : "2-day program",
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

  const extraHtml = renderHackathonTicketQrCardHtml({
    ticketUrl,
    ticketCode: reg.ticketCode,
    isFr,
  });

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
        value: isFr ? "Programme 2 Jours · 100 USD" : "2-day program · 100 USD",
      },
      { label: isFr ? "Code ticket" : "Ticket code", value: reg.ticketCode },
      { label: isFr ? "Réf. inscription" : "Registration ID", value: reg.id.slice(0, 8).toUpperCase() },
    ],
  });

  return sendEmail({ to: reg.email, subject, html, text });
}

/** Contributions / role card for confirmed partners. */
export function renderHackathonPartnerRoleCardHtml(args: {
  roleLabel: string;
  contributions: string[];
  isFr: boolean;
}): string {
  const { roleLabel, contributions, isFr } = args;
  const rows = contributions
    .map(
      (item, i) => `<tr>
      <td style="padding:10px 12px;${i < contributions.length - 1 ? `border-bottom:1px solid ${EMAIL_BRAND.border};` : ""}font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
        <span style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:8px;background:${EMAIL_BRAND.mint};color:${EMAIL_BRAND.primary};font-size:11px;font-weight:800;margin-right:8px;">${i + 1}</span>${item}
      </td>
    </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.white};border:1px solid ${EMAIL_BRAND.border};border-radius:16px;overflow:hidden;">
  <tr>
    <td style="padding:14px 18px 8px;background:${EMAIL_BRAND.mint};border-bottom:1px solid ${EMAIL_BRAND.border};text-align:center;">
      <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${EMAIL_BRAND.primary};">${isFr ? "Rôle partenaire" : "Partner role"}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:18px 18px 8px;text-align:center;background:${EMAIL_BRAND.white};">
      <p style="margin:0;display:inline-block;background:${EMAIL_BRAND.mint};border:1px solid ${EMAIL_BRAND.border};border-radius:999px;padding:8px 16px;font-size:14px;font-weight:800;color:${EMAIL_BRAND.primary};">${roleLabel}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 14px 6px;background:${EMAIL_BRAND.white};">
      <p style="margin:0 0 6px;padding:0 4px;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_BRAND.muted};">${isFr ? "Contributions confirmées" : "Confirmed contributions"}</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${EMAIL_BRAND.border};border-radius:12px;overflow:hidden;">
        ${rows}
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 18px 16px;background:${EMAIL_BRAND.white};font-size:0;line-height:0;">&nbsp;</td>
  </tr>
</table>`;
}

export type HackathonPartnerConfirmArgs = {
  to: string;
  orgName: string;
  contactName: string;
  roleLabel: string;
  contributions: string[];
  referentEmail?: string;
  /** Partner door badge code (MBP-…) */
  ticketCode?: string;
  locale?: "fr" | "en";
  /** Prefix subject for tests, e.g. [TEST] */
  subjectPrefix?: string;
};

/** Official partnership confirmation email (polished cards + QR badge). */
export function buildHackathonPartnerConfirmEmail(
  args: HackathonPartnerConfirmArgs,
): { subject: string; html: string; text: string } {
  const isFr = args.locale !== "en";
  const editionName = "McBuleli Hackathon";
  const subjectBase = isFr
    ? `Partenariat confirmé - ${args.orgName} × ${editionName}`
    : `Partnership confirmed - ${args.orgName} × ${editionName}`;
  const subject = `${args.subjectPrefix ?? ""}${subjectBase}`;

  const roleCard = renderHackathonPartnerRoleCardHtml({
    roleLabel: args.roleLabel,
    contributions: args.contributions,
    isFr,
  });

  const passUrl = args.ticketCode
    ? passPublicUrl(args.ticketCode)
    : "https://mcbuleli.org/hackathon";

  const qrCard = args.ticketCode
    ? `<div style="height:12px;font-size:0;line-height:0;">&nbsp;</div>${renderHackathonTicketQrCardHtml({
        ticketUrl: passUrl,
        ticketCode: args.ticketCode,
        isFr,
        heading: isFr ? "Badge QR partenaire" : "Partner QR badge",
        hint: isFr
          ? "Présentez ce QR à l'entrée. Valable les 2 Jours du hackathon."
          : "Show this QR at the entrance. Valid for both hackathon days.",
      })}`
    : "";

  const extraHtml = `${roleCard}${qrCard}`;

  const { html, text } = renderMcBuleliEmail({
    locale: isFr ? "fr" : "en",
    illustration: "verify",
    actionUrl: passUrl,
    extraHtml,
    copy: {
      subject,
      preheader: isFr
        ? `Bienvenue partenaire · ${args.roleLabel}${args.ticketCode ? ` · Badge ${args.ticketCode}` : ""}.`
        : `Welcome partner · ${args.roleLabel}${args.ticketCode ? ` · Badge ${args.ticketCode}` : ""}.`,
      title: isFr
        ? `Bienvenue ${args.contactName}`
        : `Welcome ${args.contactName}`,
      body: isFr
        ? `Nous confirmons officiellement le partenariat de ${args.orgName} pour le ${editionName}. Conservez votre badge QR pour l'accès à la porte (valable les 2 Jours).`
        : `We officially confirm ${args.orgName}'s partnership for the ${editionName}. Keep your QR badge for door access (valid both days).`,
      cta: args.ticketCode
        ? isFr
          ? "Ouvrir mon badge"
          : "Open my badge"
        : isFr
          ? "Voir le programme"
          : "View the program",
      footerHelp: isFr ? "Besoin d'aide ?" : "Need help?",
      footerContact: isFr ? "Contactez-nous" : "Contact us",
    },
    detailRows: [
      { label: isFr ? "Organisation" : "Organization", value: args.orgName },
      { label: isFr ? "Référent" : "Contact", value: args.contactName },
      ...(args.referentEmail
        ? [{ label: "Email", value: args.referentEmail }]
        : []),
      { label: isFr ? "Rôle" : "Role", value: args.roleLabel },
      ...(args.ticketCode
        ? [
            {
              label: isFr ? "Code badge" : "Badge code",
              value: args.ticketCode,
            },
          ]
        : []),
      { label: isFr ? "Édition" : "Edition", value: editionName },
      {
        label: isFr ? "Lieu" : "Venue",
        value: `${HACKATHON_VENUE_SILIKIN}, Kinshasa`,
      },
      { label: isFr ? "Date" : "Date", value: dateLabel(isFr) },
      {
        label: isFr ? "Statut" : "Status",
        value: isFr ? "Partenariat confirmé" : "Partnership confirmed",
      },
    ],
  });

  return { subject, html, text };
}

export async function sendHackathonPartnerConfirmEmail(
  args: HackathonPartnerConfirmArgs,
): Promise<boolean> {
  const { subject, html, text } = buildHackathonPartnerConfirmEmail(args);
  return sendEmail({ to: args.to, subject, html, text });
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

/**
 * Silikin Village - demande de reservation de salle pour McBuleli Hackathon.
 * Contact reception : reception_skv@texaf-rdc.com
 * Dates proposees : 12, 13 et 14 août 2026
 */
import { EMAIL_BRAND, logoUrl, partnershipPublicBaseUrl } from "@/lib/email/config";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

export const SILIKIN_RECEPTION_EMAIL = "reception_skv@texaf-rdc.com";
export const SILIKIN_SPACE_OFFICER_EMAIL = "j.mika@texaf-rdc.com";
export const SILIKIN_SITE_URL = "https://www.silikinvillage.com/";
/** OfficeRnD public calendar - Auditorium (~30 personnes). */
export const SILIKIN_BOOKING_URL =
  "https://silikinvillage.officernd.com/public/calendar/Auditorium?participants=1,41&start=2026-07-20T17:00:00.000Z&end=2026-07-20T18:00:00.000Z";

export type SilikinVenueEmailCopy = {
  subject: string;
  preheader: string;
  html: string;
  text: string;
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildSilikinVenueReservationEmail(): SilikinVenueEmailCopy {
  const hackathonUrl = `${partnershipPublicBaseUrl()}/hackathon`;
  const logo = logoUrl();
  const year = new Date().getFullYear();

  const subject =
    "Reservation salle - McBuleli Hackathon - 12, 13 et 14 août 2026";
  const preheader =
    "Demande de reservation Silikin Village : 3 demi-journees (08h00-13h30), ~30 personnes.";

  const text = [
    "Bonjour l'equipe Silikin Village,",
    "",
    "Nous organisons le McBuleli Hackathon (bootcamp Vibe Coding, competition, Demo Day) et souhaitons reserver une salle pour environ 30 personnes (Auditorium / salle de reunion).",
    "",
    "Dates proposees",
    "12 août 2026 - Jour 1 Bootcamp & lancement (08h00-13h30)",
    "13 août 2026 - Jour 2 Build Day & mentorat (08h00-13h30)",
    "14 août 2026 - Jour 3 Demo Day & ceremonie (08h00-13h30)",
    "",
    "Besoin",
    "~30 personnes · internet stable · projection/son si disponible · pauses cafe selon vos offres.",
    "",
    "Merci de confirmer la disponibilite, le devis et la procedure via votre calendrier OfficeRnD.",
    "",
    `Programme : ${hackathonUrl}`,
    "",
    "Cordialement,",
    "McBuleli Team",
    "Mme Patty B.",
    SUPPORT_EMAIL,
    SUPPORT_PHONES_DISPLAY,
    `WhatsApp : ${SUPPORT_WA_PATH}`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.mint};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.mint};padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:${EMAIL_BRAND.white};border-radius:16px;border:1px solid ${EMAIL_BRAND.border};overflow:hidden;">
          <tr>
            <td style="padding:22px 28px 8px;border-bottom:1px solid ${EMAIL_BRAND.border};">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <img src="${esc(logo)}" width="44" height="44" alt="McBuleli" style="display:block;border:0;border-radius:50%;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:17px;font-weight:800;color:${EMAIL_BRAND.primary};letter-spacing:-0.02em;">McBuleli</p>
                    <p style="margin:2px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">Hackathon IA - Reservation Silikin Village</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Bonjour l'equipe Silikin Village,</p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Nous organisons le <strong style="color:${EMAIL_BRAND.text};">McBuleli Hackathon</strong>
                (bootcamp Vibe Coding, competition, Demo Day) et souhaitons reserver une salle
                pour <strong style="color:${EMAIL_BRAND.text};">environ 30 personnes</strong>
                (Auditorium / salle de reunion).
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Dates proposees
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>12 août 2026</strong> - Jour 1 Bootcamp &amp; lancement (08h00-13h30)</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>13 août 2026</strong> - Jour 2 Build Day &amp; mentorat (08h00-13h30)</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>14 août 2026</strong> - Jour 3 Demo Day &amp; ceremonie (08h00-13h30)</td></tr>
              </table>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Besoin
              </p>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                ~30 personnes · internet stable · projection/son si disponible · pauses cafe selon vos offres.
              </p>

              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Merci de confirmer la <strong style="color:${EMAIL_BRAND.text};">disponibilite</strong>,
                le <strong style="color:${EMAIL_BRAND.text};">devis</strong>
                et la procedure via votre calendrier OfficeRnD.
              </p>

              <p style="margin:0 0 22px;text-align:center;">
                <a href="${esc(hackathonUrl)}" style="display:inline-block;background:${EMAIL_BRAND.primary};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 26px;border-radius:12px;">
                  Voir le programme du McBuleli Hackathon
                </a>
              </p>

              <p style="margin:0 0 6px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Cordialement,</p>
              <p style="margin:0;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">
                <strong>McBuleli Team</strong><br />
                Mme Patty B.<br />
                <a href="mailto:${SUPPORT_EMAIL}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${SUPPORT_EMAIL}</a><br />
                ${esc(SUPPORT_PHONES_DISPLAY)}<br />
                WhatsApp :
                <a href="${esc(SUPPORT_WA_PATH)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">ecrire sur WhatsApp</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 24px;border-top:1px solid ${EMAIL_BRAND.border};text-align:center;">
              <p style="margin:0;font-size:11px;color:${EMAIL_BRAND.muted};">
                © ${year} McBuleli · RCCM : CD/KNG/RCCM/26-A-00382<br />
                <a href="${esc(hackathonUrl)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">mcbuleli.org/hackathon</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, preheader, html, text };
}

/**
 * Isaac Picture - logos partenaires pour affiches Hackathon.
 * Exclut Silikin et Binance. Inclut TYTS/YTS + ISTA Réalités.
 */
import { EMAIL_BRAND, logoUrl } from "@/lib/email/config";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

export const ISAAC_PICTURE_EMAIL = "isaacitwiti@gmail.com";

export const ISAAC_PARTNER_LOGOS_SUBJECT =
  "McBuleli Hackathon - logos partenaires pour les affiches (Isaac Picture)";

const LOGO_LIST = [
  "01-kilelo.png - Kilelo",
  "02-pawapay.png - pawaPay",
  "03-sanja-service.png - SanJa Service",
  "04-rdpi-thinktank.png - RDPI Think Tank",
  "05-ilokwe-group.png - ILOKWE GROUP",
  "06-kimia-service.png - KIMIA Service",
  "07-ia-academie.jpg - IA Académie RDC",
  "08-tyts-yts.jpg - TYTS / The Young Technology Service",
  "09-ista-realites.jpg - ISTA Réalités",
] as const;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildIsaacPartnerLogosEmail(): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = ISAAC_PARTNER_LOGOS_SUBJECT;

  const text = [
    "Bonjour Isaac Picture,",
    "",
    "Voici les logos partenaires a placer sur les affiches du McBuleli AI Hackathon (Silikin Village, Kinshasa - 28-29 aout 2026).",
    "",
    "A utiliser maintenant (joints) :",
    ...LOGO_LIST.map((l) => `- ${l}`),
    "",
    "A NE PAS utiliser pour le moment :",
    "- Silikin Village",
    "- Binance",
    "",
    "Note : d'autres partenaires enverront encore leurs logos. On te les transmettra des que recus pour mise a jour des affiches.",
    "",
    "Page evenement : https://mcbuleli.org/hackathon",
    "",
    `Contact : ${SUPPORT_EMAIL} | ${SUPPORT_PHONES_DISPLAY}`,
    `WhatsApp : ${SUPPORT_WA_PATH}`,
    "",
    "Merci,",
    "McBuleli Team",
  ].join("\n");

  const rows = LOGO_LIST.map(
    (l) =>
      `<tr><td style="padding:8px 12px;background:#f5f5f4;border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">${esc(l)}</td></tr>`,
  ).join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.mint};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.mint};padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid ${EMAIL_BRAND.border};overflow:hidden;">
          <tr>
            <td style="padding:22px 28px 8px;border-bottom:1px solid ${EMAIL_BRAND.border};">
              <img src="${esc(logoUrl())}" alt="McBuleli" width="48" height="48" style="display:block;border-radius:12px;" />
              <p style="margin:14px 0 0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${EMAIL_BRAND.primary};">Isaac Picture · Affiches</p>
              <h1 style="margin:8px 0 0;font-size:20px;line-height:1.3;color:${EMAIL_BRAND.text};">Logos partenaires pour les affiches</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">
              <p style="margin:0 0 12px;">Bonjour Isaac Picture,</p>
              <p style="margin:0 0 12px;">Voici les logos partenaires à placer sur les affiches du <strong>McBuleli AI Hackathon</strong> (Silikin Village, Kinshasa — 28-29 août 2026).</p>
              <p style="margin:0 0 8px;font-weight:700;">À utiliser maintenant (joints) :</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 6px;">${rows}</table>
              <p style="margin:16px 0 8px;font-weight:700;">À ne pas utiliser pour le moment :</p>
              <ul style="margin:0 0 12px;padding-left:18px;">
                <li>Silikin Village</li>
                <li>Binance</li>
              </ul>
              <p style="margin:0 0 12px;padding:12px 14px;background:#fff8e8;border-radius:12px;border:1px solid #f0e0b8;">
                <strong>Note :</strong> d'autres partenaires enverront encore leurs logos. On te les transmettra dès réception pour mise à jour des affiches.
              </p>
              <p style="margin:0;">
                Page événement :
                <a href="https://mcbuleli.org/hackathon" style="color:${EMAIL_BRAND.primary};">mcbuleli.org/hackathon</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px;border-top:1px solid ${EMAIL_BRAND.border};font-size:13px;line-height:1.5;color:#57534e;">
              Contact : ${esc(SUPPORT_EMAIL)} · ${esc(SUPPORT_PHONES_DISPLAY)}<br />
              WhatsApp : ${esc(SUPPORT_WA_PATH)}<br /><br />
              Merci,<br />
              <strong style="color:${EMAIL_BRAND.text};">McBuleli Team</strong>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

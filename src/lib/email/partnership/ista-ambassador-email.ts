/**
 * ISTA Kinshasa campus ambassador welcome — code ISTA-KIN + kit de travail.
 */
import { EMAIL_BRAND, logoUrl, partnershipPublicBaseUrl } from "@/lib/email/config";
import {
  ISTA_AMB_NAME,
  ISTA_AMB_ORG,
  ISTA_AMB_PROMO_CODE,
  type IstaAmbassadorAssets,
} from "@/lib/hackathon/ista-ambassador";
import {
  HACKATHON_DATES_LABEL_FR,
  HACKATHON_HOURS_LABEL_FR,
  HACKATHON_VENUE_SHORT,
} from "@/lib/hackathon/event-content";
import {
  AMBASSADOR_CASHBACK_USD,
  AMBASSADOR_DISCOUNT_PERCENT,
  PARTNER_SEAT_1_AT,
  PARTNER_SEAT_2_AT,
  PROMO_CASHBACK_CLAIM_MIN_USD,
} from "@/lib/hackathon/promo-types";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

const FONT = "'Poppins',Arial,Helvetica,sans-serif";
const RCCM = "CD/KNG/RCCM/26-A-00382";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rowHtml(text: string, bg: string = EMAIL_BRAND.mint): string {
  return `<tr><td style="padding:8px 12px;background:${bg};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">${text}</td></tr><tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>`;
}

export const ISTA_AMB_SUBJECT =
  "McBuleli Hackathon × ISTA — ton code ambassadeur ISTA-KIN est prêt";

export function buildIstaAmbassadorEmail(
  assets: IstaAmbassadorAssets,
): { subject: string; html: string; text: string } {
  const base = partnershipPublicBaseUrl();
  const hackathonUrl = `${base}/hackathon`;
  const ambassadorUrl = `${base}/hackathon/ambassadeur`;
  const { shareUrl, dashboardUrl, promoCode, priceUsd } = assets;
  const discount = AMBASSADOR_DISCOUNT_PERCENT;
  const cashback = AMBASSADOR_CASHBACK_USD;

  const text = [
    `Bonjour ${ISTA_AMB_NAME},`,
    "",
    "Merci d'avoir confirmé votre rôle d'ambassadeur campus pour le McBuleli Hackathon.",
    "",
    `Événement : ${HACKATHON_DATES_LABEL_FR}, ${HACKATHON_HOURS_LABEL_FR} · ${HACKATHON_VENUE_SHORT}, Kinshasa`,
    "",
    "VOTRE CODE AMBASSADEUR",
    `Code : ${promoCode}`,
    `Lien à partager (promo appliquée automatiquement) : ${shareUrl}`,
    `Dashboard (stats + retrait cashback) : ${dashboardUrl}`,
    "",
    "ÉCONOMIE",
    `Tarif via votre code : ${priceUsd} USD (-${discount} %).`,
    `Cashback : ${cashback} USD par inscription payée et confirmée via ${promoCode}.`,
    `Retrait Mobile Money dès ${PROMO_CASHBACK_CLAIM_MIN_USD} USD cumulés.`,
    `Places offertes : 1 place à ${PARTNER_SEAT_1_AT} confirmés, 2e place à ${PARTNER_SEAT_2_AT}+.`,
    "Pas de cashback sur votre propre paiement.",
    "",
    "VOTRE MISSION CAMPUS",
    "- Diffuser le lien d'inscription sur vos canaux estudiantins (groupes WhatsApp, Facebook, affichage)",
    "- Être le point focal COM jusqu'à l'événement",
    "- Mobiliser des étudiants ISTA motivés vers l'inscription",
    "- Répondre aux questions simples (dates, lieu, tarif) et renvoyer vers hi@mcbuleli.org si besoin",
    "",
    "CONSEILS PRATIQUES",
    "- Partagez toujours le lien complet (pas seulement le code) : le -10 % s'applique automatiquement",
    "- Suivez vos inscrits et confirmations dans le dashboard",
    "- Relancez les personnes en attente de paiement (rappels automatiques toutes les 24 h)",
    "",
    `Page hackathon : ${hackathonUrl}`,
    `Page ambassadeur : ${ambassadorUrl}`,
    "",
    `Contact : ${SUPPORT_EMAIL} | ${SUPPORT_PHONES_DISPLAY}`,
    `WhatsApp : ${SUPPORT_WA_PATH}`,
    "",
    `© ${new Date().getFullYear()} McBuleli - RCCM : ${RCCM}`,
  ].join("\n");

  const missionRows = [
    "Diffuser le lien d'inscription sur vos canaux estudiantins (WhatsApp, Facebook, affichage)",
    "Être le point focal COM jusqu'à l'événement",
    "Mobiliser des étudiants ISTA motivés",
    "Répondre aux questions simples et renvoyer vers McBuleli si besoin",
  ]
    .map((m) => rowHtml(esc(m)))
    .join("");

  const tipsRows = [
    "Partagez le <strong>lien complet</strong> (pas seulement le code) — le -10 % s'applique automatiquement",
    "Suivez inscrits et confirmations dans votre <strong>dashboard</strong>",
    "Relancez les personnes en attente de paiement (rappels auto toutes les 24 h)",
  ]
    .map((t) => rowHtml(t, "#f5f5f4"))
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
  <title>${esc(ISTA_AMB_SUBJECT)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f1;font-family:${FONT};color:${EMAIL_BRAND.text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Code ISTA-KIN, lien à partager, dashboard et mission campus pour le McBuleli Hackathon.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f1;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${EMAIL_BRAND.border};">
          <tr>
            <td style="padding:22px 24px 8px;text-align:center;background:#eaf6ee;">
              <img src="${esc(logoUrl())}" alt="McBuleli" width="56" height="56" style="display:inline-block;border-radius:14px;" />
              <p style="margin:12px 0 0;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${EMAIL_BRAND.primary};">Ambassadeur campus ISTA</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 4px;">
              <h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:700;color:${EMAIL_BRAND.text};">Bienvenue, ambassadeur ISTA</h1>
              <p style="margin:14px 0 0;font-size:15px;line-height:1.6;color:${EMAIL_BRAND.text};">Bonjour <strong>${esc(ISTA_AMB_NAME)}</strong>,</p>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:${EMAIL_BRAND.muted};">
                Merci d'avoir confirmé votre rôle d'ambassadeur pour
                <strong style="color:${EMAIL_BRAND.text};">${esc(ISTA_AMB_ORG)}</strong>.
                La campagne d'inscription démarre le <strong style="color:${EMAIL_BRAND.text};">1er août 2026</strong> — voici tout ce qu'il faut pour bien travailler.
              </p>
              <p style="margin:12px 0 0;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                ${esc(HACKATHON_DATES_LABEL_FR)}, ${esc(HACKATHON_HOURS_LABEL_FR)} · ${esc(HACKATHON_VENUE_SHORT)}, Kinshasa
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 6px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BRAND.mint};border-radius:12px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:${EMAIL_BRAND.primary};">Votre code</p>
                    <p style="margin:6px 0 0;font-size:24px;font-weight:700;letter-spacing:0.04em;color:${EMAIL_BRAND.primary};font-family:ui-monospace,Menlo,monospace;">${esc(promoCode)}</p>
                    <p style="margin:10px 0 0;font-size:13px;line-height:1.5;color:${EMAIL_BRAND.muted};">
                      -${discount}% (${esc(priceUsd)} USD) · cashback ${cashback} USD / payé<br />
                      Places : 1 à ${PARTNER_SEAT_1_AT} confirmés, 2e à ${PARTNER_SEAT_2_AT}+ · retrait dès ${PROMO_CASHBACK_CLAIM_MIN_USD} USD
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 28px 4px;text-align:center;">
              <a href="${esc(shareUrl)}" style="display:inline-block;background:${EMAIL_BRAND.primary};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 22px;border-radius:12px;">
                Ouvrir mon lien à partager
              </a>
              <p style="margin:10px 0 0;font-size:12px;line-height:1.5;color:${EMAIL_BRAND.muted};word-break:break-all;">
                <a href="${esc(shareUrl)}" style="color:${EMAIL_BRAND.primary};text-decoration:underline;">${esc(shareUrl)}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 28px 8px;text-align:center;">
              <a href="${esc(dashboardUrl)}" style="display:inline-block;background:#ffffff;color:${EMAIL_BRAND.primary};text-decoration:none;font-size:15px;font-weight:700;padding:13px 22px;border-radius:12px;border:2px solid ${EMAIL_BRAND.primary};">
                Ouvrir mon dashboard
              </a>
              <p style="margin:12px 0 0;font-size:13px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Stats en temps réel : inscrits, confirmations, cashback Mobile Money.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 28px 4px;">
              <p style="margin:0 0 10px;font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_BRAND.text};">Votre mission campus</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${missionRows}</table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 4px;">
              <p style="margin:0 0 10px;font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_BRAND.text};">Conseils pratiques</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${tipsRows}</table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 18px;font-size:13px;line-height:1.55;color:${EMAIL_BRAND.muted};">
              Pas de cashback sur votre propre paiement.
              · <a href="${esc(hackathonUrl)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">Page hackathon</a>
              · <a href="${esc(ambassadorUrl)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">Page ambassadeur</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 18px;font-size:13px;line-height:1.55;color:${EMAIL_BRAND.muted};">
              Questions :
              <a href="mailto:${SUPPORT_EMAIL}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${SUPPORT_EMAIL}</a>
              - ${esc(SUPPORT_PHONES_DISPLAY)} -
              <a href="${esc(SUPPORT_WA_PATH)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">WhatsApp</a>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 24px;border-top:1px solid ${EMAIL_BRAND.border};text-align:center;">
              <p style="margin:0;font-size:11px;color:${EMAIL_BRAND.muted};">
                © ${new Date().getFullYear()} McBuleli - RCCM : ${RCCM}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject: ISTA_AMB_SUBJECT, html, text };
}

/**
 * Rawbank / illicocash - proposition partenariat paiement + sponsoring Hackathon.
 * Contacts publics : marketing@illicocash.com · contact@rawbank.cd
 * @see https://rawbank.com/banque-a-distance/illicocash/
 */
import { EMAIL_BRAND, logoUrl, partnershipPublicBaseUrl } from "@/lib/email/config";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

/** Press / partnerships illicocash (annonces Thunes, Mastercard). */
export const ILLICOCASH_MARKETING_EMAIL = "marketing@illicocash.com";
/** Contact général + demandes sponsoring (FAQ Rawbank). */
export const RAWBANK_CONTACT_EMAIL = "contact@rawbank.cd";

export type RawbankHackathonEmailCopy = {
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

/**
 * Triple win:
 * - Participants: payer le ticket via illicocash (CDF/USD) en plus du MoMo telco
 * - McBuleli: conversion + crédibilité bancaire + rail de paiement
 * - Rawbank: activations portefeuille, image innovation (We Act / Digital), data funnel builders
 */
export function buildRawbankIllicocashPartnershipEmail(): RawbankHackathonEmailCopy {
  const hackathonUrl = `${partnershipPublicBaseUrl()}/hackathon`;
  const illicoUrl = "https://rawbank.com/banque-a-distance/illicocash/";
  const logo = logoUrl();
  const year = new Date().getFullYear();

  const subject =
    "Partenariat McBuleli Hackathon x illicocash - paiement tickets & innovation IA Kinshasa";
  const preheader =
    "Rail de paiement illicocash pour le Hackathon Silikin Village - bénéfice participants, McBuleli et Rawbank.";

  const text = [
    "Bonjour Rawbank / illicocash,",
    "",
    "Nous sommes McBuleli (mcbuleli.org). Nous organisons le McBuleli Hackathon au Silikin Village (Kinshasa) : bootcamp IA pratique (Cursor, Claude, Codex), compétition, mentorat et incubation.",
    `Programme : ${hackathonUrl}`,
    "",
    "Aujourd'hui, le paiement des tickets passe uniquement par mobile money opérateurs (Orange Money, M-Pesa, Airtel Money). Nous souhaitons proposer illicocash comme mode de paiement partenaire, en complément, pour élargir l'accès aux builders bancarisés et renforcer l'inclusion financière digitale.",
    `Référence produit : ${illicoUrl}`,
    "",
    "APPROCHE GAGNANT-GAGNANT",
    "",
    "1) Pour les participants",
    "- Payer le pack (bootcamp 1 jour ou 2 jours + hackathon) depuis le portefeuille illicocash (CDF/USD), sans dépendre uniquement d'un opérateur telco",
    "- Parcours simple (app / USSD), confiance marque Rawbank",
    "- Option : promo ponctuelle (ex. frais réduits ou cashback illicocash sur le ticket)",
    "",
    "2) Pour McBuleli Hackathon",
    "- Meilleure conversion des pré-inscriptions en paiements confirmés",
    "- Crédibilité d'un rail bancaire aux côtés du MoMo",
    "- Moins d'abandons liés aux limites / indisponibilités d'un seul canal",
    "",
    "3) Pour Rawbank / illicocash",
    "- Visibilité sponsoring paiement sur la page /hackathon, e-mails ticket et Silikin Village",
    "- Activations / usage portefeuille auprès d'un public builders & entrepreneurs",
    "- Alignement avec l'innovation digitale et le volet Digital / We Act",
    "- Option défi FinTech « inclusion & paiements » co-brandé jury / atelier",
    "- Données d'acquisition événementielle (participants qui choisissent illicocash)",
    "",
    "MODALITES PROPOSEES (à discuter)",
    "A. Merchant / API / QR marchand pour encaisser les tickets USD/CDF",
    "B. Pack sponsor paiement (Silver/Gold/Platinum) : logo « Payé avec illicocash », stand, atelier",
    "C. Campagne conjointe : « Réservez votre place - payez en MoMo ou illicocash »",
    "D. Sur mesure : réduction de frais sur le volume tickets hackathon",
    "",
    "Nous serions ravis d'un court appel de 20-30 minutes avec vos équipes Marketing / illicocash / partenariats pour caler le rail technique et le niveau de visibilité.",
    "",
    "Cordialement,",
    "McBuleli Team",
    "Mme Patty B.",
    SUPPORT_EMAIL,
    SUPPORT_PHONES_DISPLAY,
    `WhatsApp : ${SUPPORT_WA_PATH}`,
    hackathonUrl,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
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
                    <p style="margin:2px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">Hackathon IA · Partenariat illicocash</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Bonjour Rawbank / illicocash,</p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Nous organisons le <strong style="color:${EMAIL_BRAND.text};">McBuleli Hackathon</strong> au Silikin Village (Kinshasa) :
                bootcamp IA, compétition, mentorat et incubation.
                Aujourd'hui les tickets se paient uniquement en mobile money opérateurs
                (Orange, M-Pesa, Airtel). Nous souhaitons ajouter
                <strong style="color:${EMAIL_BRAND.text};">illicocash</strong> comme rail partenaire.
              </p>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.5;color:${EMAIL_BRAND.muted};">
                Produit :
                <a href="${esc(illicoUrl)}" style="color:${EMAIL_BRAND.primary};">rawbank.com - illicocash</a>
                · Programme :
                <a href="${esc(hackathonUrl)}" style="color:${EMAIL_BRAND.primary};">mcbuleli.org/hackathon</a>
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Triple bénéfice
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                <tr><td style="padding:10px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>Participants</strong> - Payer en CDF/USD via le portefeuille illicocash (app/USSD), confiance Rawbank, option promo frais/cashback sur le ticket.
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:10px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>McBuleli Hackathon</strong> - Meilleure conversion pré-inscription → paiement, crédibilité bancaire, moins de dépendance à un seul canal MoMo.
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:10px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>Rawbank / illicocash</strong> - Visibilité « Payé avec illicocash », activations portefeuille builders, alignement innovation digitale / We Act, option défi FinTech inclusion.
                </td></tr>
              </table>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Modalités à discuter
              </p>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                A. Encaissement tickets (merchant / API / QR)<br />
                B. Pack sponsor paiement (logo, stand, atelier)<br />
                C. Campagne conjointe MoMo + illicocash<br />
                D. Conditions préférentielles sur le volume tickets hackathon
              </p>

              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                <strong style="color:${EMAIL_BRAND.text};">Prochaine étape :</strong>
                appel de 20-30 minutes avec Marketing / illicocash / partenariats.
              </p>
              <p style="margin:0 0 22px;text-align:center;">
                <a href="${esc(hackathonUrl)}" style="display:inline-block;background:${EMAIL_BRAND.primary};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 26px;border-radius:12px;">
                  Voir le Hackathon
                </a>
              </p>
              <p style="margin:0 0 6px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Cordialement,</p>
              <p style="margin:0;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">
                <strong>McBuleli Team</strong><br />
                Mme Patty B.<br />
                <a href="mailto:${SUPPORT_EMAIL}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${SUPPORT_EMAIL}</a><br />
                ${esc(SUPPORT_PHONES_DISPLAY)}<br />
                WhatsApp :
                <a href="${esc(SUPPORT_WA_PATH)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">écrire sur WhatsApp</a>
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

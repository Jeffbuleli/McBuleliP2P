/**
 * IA Académie / CHK - reponse affiliation + logo actif (ASCII dash only).
 */
import { EMAIL_BRAND, logoUrl, partnershipPublicBaseUrl } from "@/lib/email/config";
import {
  IA_ACADEMIE_PARTNER,
  HACKATHON_DATES_LABEL_FR,
  HACKATHON_HOURS_LABEL_FR,
  HACKATHON_VENUE_SHORT,
} from "@/lib/hackathon/event-content";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

export const IA_ACADEMIE_AFFILIATION_REPLY_SUBJECT =
  "McBuleli Hackathon x IA Académie - affiliation activée & logo en ligne";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildIaAcademieAffiliationReplyEmail(): {
  subject: string;
  html: string;
  text: string;
} {
  const chat = `${partnershipPublicBaseUrl()}/hackathon/chat`;
  const hackathon = `${partnershipPublicBaseUrl()}/hackathon`;
  const subject = IA_ACADEMIE_AFFILIATION_REPLY_SUBJECT;

  const text = [
    "Bonjour,",
    "",
    "Merci pour votre retour - l'affiliation est corrigée.",
    "",
    "Emails actifs sur la plateforme :",
    "- contact@ia-academie.cd (contact principal + badge place 1)",
    "- contact@ch-kin.com (CHK - badge place 2)",
    "",
    "Pour accéder à l'espace partenaires :",
    "1. Créer ou utiliser un compte McBuleli avec l'un de ces emails",
    "2. Se connecter",
    `3. Ouvrir ${chat}`,
    "",
    "Votre logo et votre fiche partenaire sont en ligne sur la page hackathon, les tickets et les badges.",
    IA_ACADEMIE_PARTNER.blurbFr,
    "",
    `Événement : ${HACKATHON_DATES_LABEL_FR}, ${HACKATHON_HOURS_LABEL_FR} - ${HACKATHON_VENUE_SHORT}, Kinshasa`,
    "",
    `Page hackathon : ${hackathon}`,
    "",
    `Contact : ${SUPPORT_EMAIL} | ${SUPPORT_PHONES_DISPLAY}`,
    `WhatsApp : ${SUPPORT_WA_PATH}`,
    "",
    "Cordialement,",
    "McBuleli Team",
  ].join("\n");

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
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <img src="${esc(logoUrl())}" width="44" height="44" alt="McBuleli" style="display:block;border:0;border-radius:50%;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:17px;font-weight:800;color:${EMAIL_BRAND.primary};">McBuleli Hackathon</p>
                    <p style="margin:2px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">Affiliation &amp; logo</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Bonjour,</p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Merci pour votre retour - <strong style="color:${EMAIL_BRAND.text};">l'affiliation est corrigée</strong>.
                Les deux emails institutionnels sont actifs :
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;">
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>contact@ia-academie.cd</strong> - contact principal + badge place 1</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>contact@ch-kin.com</strong> - CHK + badge place 2</td></tr>
              </table>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Connectez-vous avec l'un de ces emails sur McBuleli, puis ouvrez l'espace partenaires.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 16px;text-align:center;">
              <img src="${esc(`${partnershipPublicBaseUrl()}${IA_ACADEMIE_PARTNER.logoUrl}`)}" width="120" height="120" alt="${esc(IA_ACADEMIE_PARTNER.name)}" style="display:inline-block;max-width:120px;height:auto;" />
              <p style="margin:12px 0 0;font-size:15px;font-weight:700;color:${EMAIL_BRAND.text};">${esc(IA_ACADEMIE_PARTNER.name)}</p>
              <p style="margin:8px 0 0;font-size:13px;line-height:1.55;color:${EMAIL_BRAND.muted};">${esc(IA_ACADEMIE_PARTNER.blurbFr)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 18px;text-align:center;">
              <a href="${esc(chat)}" style="display:inline-block;padding:12px 22px;border-radius:10px;background:${EMAIL_BRAND.primary};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Ouvrir l'espace partenaires</a>
              <p style="margin:10px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">
                Logo visible sur <a href="${esc(hackathon)}" style="color:${EMAIL_BRAND.primary};">mcbuleli.org/hackathon</a>, tickets et badges.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 22px;font-size:13px;line-height:1.55;color:${EMAIL_BRAND.muted};">
              ${esc(HACKATHON_DATES_LABEL_FR)}, ${esc(HACKATHON_HOURS_LABEL_FR)} - ${esc(HACKATHON_VENUE_SHORT)}<br />
              Questions :
              <a href="mailto:${SUPPORT_EMAIL}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${SUPPORT_EMAIL}</a>
              - ${esc(SUPPORT_PHONES_DISPLAY)} -
              <a href="${esc(SUPPORT_WA_PATH)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">WhatsApp</a>
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

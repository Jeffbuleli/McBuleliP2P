/**
 * Hope Services Congo - partenariat Hackathon (formalisation PME / docs légaux).
 * Site : https://hopeservicescongo.com · FB : Hopeservices243
 * Emails : hopeservicesrdc0@gmail.com · contact@hopeservicescongo.com
 */
import { EMAIL_BRAND, logoUrl, partnershipPublicBaseUrl } from "@/lib/email/config";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

/** Adresse la plus fiable (Gmail). */
export const HOPE_SERVICES_GMAIL = "hopeservicesrdc0@gmail.com";
/** Adresse domaine (à tenter en CC / second envoi). */
export const HOPE_SERVICES_CONTACT = "contact@hopeservicescongo.com";

export type HopeServicesEmailCopy = {
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
 * Win-win: Hope Services = formalisation PME / docs légaux ;
 * McBuleli = hackathon builders → projets à structurer.
 */
export function buildHopeServicesPartnershipEmail(): HopeServicesEmailCopy {
  const hackathonUrl = `${partnershipPublicBaseUrl()}/hackathon`;
  const hopeUrl = "https://hopeservicescongo.com/";
  const logo = logoUrl();
  const year = new Date().getFullYear();

  const subject =
    "Partenariat Hope Services × McBuleli Hackathon - formalisation PME & docs légaux";
  const preheader =
    "Dates confirmées 28–29 Août 2026 · Silikin Village (08h00–17h00) - rôle partenaire formalisation pour les projets du hackathon.";

  const text = [
    "Bonjour l'équipe Hope Services,",
    "",
    "Suite à notre échange WhatsApp : merci pour votre intérêt. Voici le détail du McBuleli Hackathon et le rôle que nous vous proposons.",
    "",
    `Programme : ${hackathonUrl}`,
    `Votre site : ${hopeUrl}`,
    "",
    "DATES PRÉVUES",
    "- 28 Août 2026 - Vendredi Bootcamp & Build (08h00-17h00)",
    "- 29 Août 2026 - Samedi Build & Demo Day (08h00-17h00)",
    "Lieu : Silikin Village, Kinshasa",
    "Statut lieu : en attente d'approbation finale de Silikin Village",
    "",
    "COMMENT PARTICIPER",
    "1) Builders / équipes : inscription sur mcbuleli.org/hackathon",
    "2) Hope Services (entreprise) : partenariat formalisation PME - atelier ou mentorat + logo",
    "",
    "RÔLE QUE NOUS VOUS PROPOSONS",
    "Partenaire Formalisation & Accompagnement PME du McBuleli Hackathon.",
    "",
    "Concrètement :",
    "1) Atelier court ou session mentorat : formaliser son projet, documents légaux, crédibilité admin (RCCM, etc.)",
    "2) Accompagnement optionnel des projets prometteurs après le Demo Day",
    "3) Logo partenaire sur la page hackathon et les supports événement",
    "",
    "Ce n'est pas d'abord une demande de sponsoring cash.",
    "",
    "CE QUE HOPE SERVICES Y GAGNE",
    "- Visibilité auprès de builders et porteurs de projets à Silikin Village",
    "- Pipeline : équipes qui auront besoin de formaliser après le hackathon",
    "- Positionnement : référence formalisation PME dans l'écosystème innovation Kinshasa",
    "",
    "PROCHAINES ÉTAPES",
    "Merci de nous confirmer votre intérêt et de nous renvoyer :",
    "1) Contact référent (nom, email, téléphone / WhatsApp)",
    "2) Logo officiel (PNG ou SVG)",
    "3) Préférence : atelier Jour 1 / Jour 2 / flexible",
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
                    <p style="margin:2px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">Hackathon IA · Partenaire formalisation PME</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Bonjour l'équipe Hope Services,</p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Suite à notre échange WhatsApp : merci pour votre intérêt.
                Voici le détail du <strong style="color:${EMAIL_BRAND.text};">McBuleli Hackathon</strong>
                et le rôle que nous vous proposons
                (<a href="${esc(hopeUrl)}" style="color:${EMAIL_BRAND.primary};">hopeservicescongo.com</a>).
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Dates prévues
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 10px;">
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>28 Août 2026</strong> - Vendredi Bootcamp &amp; Build (08h00–17h00)</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>29 Août 2026</strong> - Samedi Build &amp; Demo Day (08h00–17h00)</td></tr>
              </table>
              <p style="margin:0 0 18px;font-size:13px;line-height:1.45;color:${EMAIL_BRAND.muted};">
                Lieu : Silikin Village, Kinshasa ·
                <strong style="color:${EMAIL_BRAND.text};">Statut :</strong>
                en attente d'approbation finale de Silikin Village.
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Comment participer
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>Builders / équipes</strong> - inscription sur mcbuleli.org/hackathon</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>Hope Services</strong> - partenariat formalisation PME (atelier / mentorat + logo)</td></tr>
              </table>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Rôle proposé
              </p>
              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                <strong style="color:${EMAIL_BRAND.text};">Partenaire Formalisation &amp; Accompagnement PME</strong>
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 14px;">
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>1.</strong> Atelier / mentorat : formaliser son projet, documents légaux, crédibilité admin</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>2.</strong> Accompagnement optionnel des projets prometteurs après le Demo Day</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>3.</strong> Logo partenaire sur la page hackathon et supports événement</td></tr>
              </table>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.5;color:${EMAIL_BRAND.muted};">
                Ce n'est <strong style="color:${EMAIL_BRAND.text};">pas</strong> d'abord une demande de sponsoring cash.
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Merci de nous renvoyer
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 22px;">
                <tr><td style="padding:10px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>1.</strong> Contact référent - nom, email, téléphone / WhatsApp</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:10px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>2.</strong> Logo officiel - PNG ou SVG</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:10px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>3.</strong> Préférence atelier - Jour 1, Jour 2, ou flexible</td></tr>
              </table>

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

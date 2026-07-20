/**
 * Enneade DigiTech / Enneade Academy - partenariat McBuleli Hackathon.
 * Sites : https://www.enneadedigitech.com · https://www.enneade-academy.com
 * Contact : contact@enneadedigitech.com · +243 977 101 530
 * Relance e-mail après WhatsApp (weekend).
 */
import { EMAIL_BRAND, logoUrl, partnershipPublicBaseUrl } from "@/lib/email/config";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

export const ENNEADE_CONTACT_EMAIL = "contact@enneadedigitech.com";

export type EnneadeEmailCopy = {
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
 * DigiTech = digital + incubation + formation ; Academy = formations pro.
 * Role: partenaire formation & incubation (vivier + atelier + passerelle post-hackathon).
 */
export function buildEnneadePartnershipEmail(): EnneadeEmailCopy {
  const hackathonUrl = `${partnershipPublicBaseUrl()}/hackathon`;
  const digitechUrl = "https://www.enneadedigitech.com/";
  const academyUrl = "https://www.enneade-academy.com/";
  const logo = logoUrl();
  const year = new Date().getFullYear();

  const subject =
    "Suite WhatsApp - partenariat Enneade DigiTech / Academy × McBuleli Hackathon";
  const preheader =
    "Partenaire formation & incubation Silikin : vivier apprenants, atelier digital, passerelle projets.";

  const text = [
    "Bonjour l'équipe Enneade DigiTech / Enneade Academy,",
    "",
    "Nous vous avons contactés via WhatsApp au sujet du McBuleli Hackathon. Comme c'est le weekend, nous enchaînons par e-mail pour vous laisser une proposition claire.",
    "",
    "McBuleli organise un hackathon IA au Silikin Village (Kinshasa) : bootcamp Vibe Coding (Cursor, Claude, Codex), compétition, mentorat et incubation.",
    `Programme : ${hackathonUrl}`,
    "",
    "Nous avons vu votre double offre :",
    `- Enneade DigiTech (${digitechUrl}) : digital (web, marketing, community), incubation (Zua Capital / Hub), accompagnement entrepreneurs`,
    `- Enneade Academy (${academyUrl}) : formations professionnelles présentes et en ligne`,
    "",
    "RÔLE PROPOSÉ",
    "Partenaire formation & incubation - un rôle ciblé, sans sponsoring cash obligatoire.",
    "",
    "1) Vivier : vos apprenants / alumni digital & entrepreneurs rejoignent le hackathon",
    "2) Atelier ou mentorat court (30-60 min) : web, marketing digital, e-commerce ou pitch business",
    "3) Passerelle post-événement : les projets les plus solides orientés vers votre incubateur / réseau entrepreneurs (si intérêt)",
    "4) Visibilité : logo partenaire sur mcbuleli.org/hackathon et supports Silikin",
    "",
    "Option légère : 1 siège jury sur les projets à forte dimension business / digital.",
    "",
    "CE QUE VOUS Y GAGNEZ",
    "- Terrain pratique pour vos apprenants (prototype + pitch)",
    "- Visibilité Enneade à Silikin Village",
    "- Deal flow : projets hackathon → vos programmes d'incubation / Business Club",
    "- Contenu (atelier, témoignages) pour Academy et DigiTech",
    "",
    "CE QUE GAGNENT LES PARTICIPANTS",
    "- Mentors digital / business locaux",
    "- Une suite possible après le hackathon (formation ou incubation)",
    "",
    "Prochaine étape : appel de 20 minutes en début de semaine pour caler le format.",
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
                    <p style="margin:2px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">Hackathon IA · Formation &amp; incubation</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Bonjour l'équipe Enneade DigiTech / Academy,</p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Nous vous avons contactés via WhatsApp au sujet du
                <strong style="color:${EMAIL_BRAND.text};">McBuleli Hackathon</strong> (Silikin Village).
                Comme c'est le weekend, nous enchaînons par e-mail avec une proposition claire.
              </p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Votre positionnement est idéal :
                <a href="${esc(digitechUrl)}" style="color:${EMAIL_BRAND.primary};">DigiTech</a>
                (web, marketing digital, incubation entrepreneurs) et
                <a href="${esc(academyUrl)}" style="color:${EMAIL_BRAND.primary};">Academy</a>
                (formations pro).
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Rôle proposé : partenaire formation &amp; incubation
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>1. Vivier</strong> - apprenants / alumni digital &amp; entrepreneurs au hackathon
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>2. Atelier</strong> - web, marketing digital, e-commerce ou pitch business (30-60 min)
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>3. Passerelle</strong> - projets solides orientés vers votre incubateur / Business Club
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>4. Visibilité</strong> - logo partenaire sur
                  <a href="${esc(hackathonUrl)}" style="color:${EMAIL_BRAND.primary};">mcbuleli.org/hackathon</a>
                </td></tr>
              </table>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.5;color:${EMAIL_BRAND.muted};">
                Option : 1 siège jury business / digital. Pas de sponsoring cash obligatoire.
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Gains pour Enneade
              </p>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Terrain pratique pour vos apprenants · visibilité Silikin ·
                deal flow projets → incubation · contenu Academy / DigiTech.
              </p>

              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                <strong style="color:${EMAIL_BRAND.text};">Prochaine étape :</strong>
                appel de 20 minutes en début de semaine.
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

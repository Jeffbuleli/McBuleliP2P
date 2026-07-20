/**
 * Afri-Carrières - partenariat Hackathon (média / diffusion opportunités).
 * Site : https://afri-carrieres.com · Contact : infos@afri-carrieres.com
 */
import { EMAIL_BRAND, logoUrl, partnershipPublicBaseUrl } from "@/lib/email/config";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

export const AFRI_CARRIERES_EMAIL = "infos@afri-carrieres.com";

export type AfriCarrieresEmailCopy = {
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
 * Win-win: Afri-Carrières = audience opportunités Afrique ;
 * McBuleli = hackathon IA / builders à Kinshasa.
 * Primary role: partenaire média / diffusion de l'appel.
 */
export function buildAfriCarrieresPartnershipEmail(): AfriCarrieresEmailCopy {
  const hackathonUrl = `${partnershipPublicBaseUrl()}/hackathon`;
  const afriUrl = "https://afri-carrieres.com/";
  const logo = logoUrl();
  const year = new Date().getFullYear();

  const subject =
    "Partenariat Afri-Carrières × McBuleli Hackathon - diffusion opportunités builders";
  const preheader =
    "Une opportunité concrète à publier : hackathon IA au Silikin Village - apport clair, bénéfices pour votre audience.";

  const text = [
    "Bonjour l'équipe Afri-Carrières,",
    "",
    "Nous sommes McBuleli (marketplace P2P en RDC). Nous organisons le McBuleli Hackathon au Silikin Village (Kinshasa) : bootcamp Vibe Coding (Cursor, Claude, Codex), compétition, mentorat et incubation autour de produits numériques utiles localement.",
    "",
    `Programme : ${hackathonUrl}`,
    `Votre plateforme : ${afriUrl}`,
    "",
    "Pourquoi vous contacter",
    "Afri-Carrières aide déjà des milliers d'Africains à ne rater aucune opportunité : bourses, emplois, compétitions, appels à candidatures, stages, incubations. Le McBuleli Hackathon est exactement ce type d'opportunité - concrète, locale, ouverte aux builders et jeunes talents.",
    "",
    "RÔLE PRINCIPAL QUE NOUS VOUS PROPOSONS",
    "Partenaire média / diffusion du McBuleli Hackathon.",
    "",
    "Concrètement (apport Afri-Carrières) :",
    "1) Publication d'une fiche / article opportunité (dates, lieu Silikin, pour qui, comment s'inscrire) avec lien vers mcbuleli.org/hackathon.",
    "2) Relais sur vos canaux habituels (site, newsletter, réseaux) pour maximiser les candidatures builders.",
    "3) Option : logo partenaire média sur la page hackathon.",
    "",
    "Ce n'est pas d'abord une demande de sponsoring cash. Nous voulons un partenariat de diffusion utile à votre audience et visible pour Afri-Carrières.",
    "",
    "CE QUE AFRI-CARRIÈRES Y GAGNE",
    "- Contenu frais et différenciant (IA, vibe coding, builders) pour votre audience",
    "- Association avec un événement innovation à Kinshasa / Silikin Village",
    "- Trafic qualifié vers afri-carrieres.com via un appel concret",
    "- Positionnement : référence opportunités tech & carrière pour la jeunesse africaine",
    "- Angle exclusif : marketplace locale + IA pratique en RDC (pas seulement une théorie)",
    "",
    "CE QUE GAGNENT LES PARTICIPANTS / VOTRE AUDIENCE",
    "- Une opportunité claire à Kinshasa (bootcamp + compétition + mentorat)",
    "- Accès à un programme concret pour apprendre à shipper avec l'IA",
    "",
    "CE QUE GAGNE McBULELI",
    "- Une diffusion crédible auprès de candidats motivés en Afrique francophone",
    "- Plus de builders de qualité inscrits au hackathon",
    "",
    "Prochaine étape : un échange court (email ou 15 min) pour valider le format de publication et vous envoyer le brief (texte + visuels + lien d'inscription).",
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
                    <p style="margin:2px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">Hackathon IA · Partenaire Média / Diffusion</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Bonjour l'équipe Afri-Carrières,</p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Nous sommes McBuleli. Nous organisons le
                <strong style="color:${EMAIL_BRAND.text};">McBuleli Hackathon</strong> au Silikin Village (Kinshasa) :
                bootcamp Vibe Coding, compétition, mentorat et incubation de produits utiles localement.
              </p>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Afri-Carrières aide déjà des milliers d'Africains à trouver
                <strong style="color:${EMAIL_BRAND.text};">bourses, emplois, compétitions et appels à candidatures</strong>
                (<a href="${esc(afriUrl)}" style="color:${EMAIL_BRAND.primary};">afri-carrieres.com</a>).
                Le hackathon est exactement ce type d'opportunité - concrète, ouverte aux builders.
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Rôle principal (apport Afri-Carrières)
              </p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                <strong style="color:${EMAIL_BRAND.text};">Partenaire média / diffusion</strong>
                - un engagement ciblé :
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>1. Publication</strong> - fiche / article opportunité (dates, Silikin, inscription)
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>2. Relais</strong> - site, newsletter, réseaux pour maximiser les candidatures
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>3. Option</strong> - logo partenaire média sur
                  <a href="${esc(hackathonUrl)}" style="color:${EMAIL_BRAND.primary};">mcbuleli.org/hackathon</a>
                </td></tr>
              </table>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Ce que Afri-Carrières y gagne
              </p>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Contenu frais IA / builders pour votre audience ·
                association Silikin / innovation Kinshasa ·
                trafic qualifié vers votre plateforme ·
                positionnement opportunités tech Afrique ·
                angle exclusif vibe coding + marketplace locale.
                Ce n'est <strong>pas</strong> d'abord une demande de sponsoring cash.
              </p>

              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                <strong style="color:${EMAIL_BRAND.text};">Prochaine étape :</strong>
                un échange court pour valider le format - nous envoyons brief + visuels + lien d'inscription.
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

/**
 * Kilelo App - partenariat Hackathon (marketplace services locaux).
 * Site : https://kileloapp.com · Contact : support@kileloapp.com
 */
import { EMAIL_BRAND, logoUrl, partnershipPublicBaseUrl } from "@/lib/email/config";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

export const KILELO_EMAIL = "support@kileloapp.com";

export type KileloEmailCopy = {
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
 * Win-win: Kilelo = marketplace travailleurs locaux ; McBuleli = P2P biens + hackathon.
 * Primary role: partenaire marketplace services locaux (matching / confiance / avis).
 */
export function buildKileloPartnershipEmail(): KileloEmailCopy {
  const hackathonUrl = `${partnershipPublicBaseUrl()}/hackathon`;
  const kileloUrl = "https://kileloapp.com/";
  const logo = logoUrl();
  const year = new Date().getFullYear();

  const subject =
    "Partenariat Kilelo × McBuleli Hackathon - marketplace services locaux";
  const preheader =
    "McBuleli (biens) × Kilelo (services) : un rôle clair, apport concret, bénéfices visibles pour votre marque.";

  const text = [
    "Bonjour l'équipe Kilelo,",
    "",
    "Nous sommes McBuleli (marketplace P2P de biens en RDC). Nous organisons le McBuleli Hackathon au Silikin Village (Kinshasa) : bootcamp Vibe Coding, compétition, mentorat et incubation autour de produits numériques utiles localement.",
    "",
    `Programme : ${hackathonUrl}`,
    `Votre produit : ${kileloUrl}`,
    "",
    "Pourquoi vous contacter",
    "Kilelo connecte déjà clients et travailleurs locaux à Kinshasa (profils, avis, contact direct). McBuleli construit le côté biens. Ensemble, vous représentez deux faces de la même économie réelle : acheter / vendre, et trouver le bon professionnel près de chez soi.",
    "",
    "RÔLE PRINCIPAL QUE NOUS VOUS PROPOSONS",
    "Partenaire Marketplace Services Locaux du McBuleli Hackathon.",
    "",
    "Concrètement (apport Kilelo) :",
    "1) Session courte (30-45 min) : « Matching, avis et confiance : le marketplace des services à Kinshasa » - cas Kilelo.",
    "2) Mentorat ciblé des équipes qui construisent marketplace, matching, gig economy, discovery ou confiance utilisateur (1-2 créneaux).",
    "3) Logo partenaire sur la page hackathon et les supports événement - présence / démo produit si vous le souhaitez.",
    "",
    "Ce n'est pas d'abord une demande de sponsoring cash. Nous voulons un partenariat métier utile aux participants et visible pour Kilelo.",
    "",
    "CE QUE KILELO Y GAGNE",
    "- Visibilité auprès de builders, étudiants et entrepreneurs à Silikin Village",
    "- Des équipes qui découvrent votre modèle (matching, avis, profils vérifiés) et peuvent imaginer des features utiles à votre roadmap",
    "- Positionnement : référence marketplace services locaux dans l'écosystème innovation Kinshasa",
    "- Contenu (talk + démo) réutilisable sur vos réseaux et auprès de vos travailleurs / clients",
    "- Synergie narrative claire : biens (McBuleli) + services (Kilelo)",
    "",
    "CE QUE GAGNENT LES PARTICIPANTS",
    "- Un cas d'usage local concret (économie réelle, pas seulement de la théorie)",
    "- Feedback métier sur matching, confiance, avis et contact client-prestataire",
    "- Des prototypes marketplace plus crédibles",
    "",
    "CE QUE GAGNE McBULELI",
    "- Un partenaire complémentaire sur l'économie locale Kinshasa",
    "- Une meilleure qualité des projets marketplace / matching",
    "",
    "Prochaine étape : un appel de 20 minutes pour valider ce rôle (talk + mentorat) et un créneau Silikin.",
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
                    <p style="margin:2px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">Hackathon IA · Partenaire Marketplace Services</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Bonjour l'équipe Kilelo,</p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Nous sommes McBuleli (marketplace P2P de biens). Nous organisons le
                <strong style="color:${EMAIL_BRAND.text};">McBuleli Hackathon</strong> au Silikin Village :
                bootcamp Vibe Coding, compétition et incubation de produits utiles localement.
              </p>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Kilelo connecte déjà clients et
                <strong style="color:${EMAIL_BRAND.text};">travailleurs locaux à Kinshasa</strong>
                (profils, avis, contact direct -
                <a href="${esc(kileloUrl)}" style="color:${EMAIL_BRAND.primary};">kileloapp.com</a>).
                McBuleli construit le côté biens. Deux faces de la même économie réelle.
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Rôle principal (apport Kilelo)
              </p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                <strong style="color:${EMAIL_BRAND.text};">Partenaire Marketplace Services Locaux</strong>
                - un engagement ciblé, pas une liste d'options :
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>1. Talk 30-45 min</strong> - matching, avis et confiance (cas Kilelo)
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>2. Mentorat ciblé</strong> - équipes marketplace / matching / gig / confiance
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>3. Visibilité</strong> - logo partenaire ± démo produit sur place
                </td></tr>
              </table>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Ce que Kilelo y gagne
              </p>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Visibilité builders &amp; entrepreneurs à Silikin ·
                équipes qui découvrent votre modèle matching / avis ·
                positionnement référence services locaux ·
                contenu talk/démo pour vos réseaux ·
                synergie claire <strong style="color:${EMAIL_BRAND.text};">biens (McBuleli) + services (Kilelo)</strong>.
                Ce n'est <strong>pas</strong> d'abord une demande de sponsoring cash.
              </p>

              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                <strong style="color:${EMAIL_BRAND.text};">Prochaine étape :</strong>
                un appel de 20 minutes pour valider ce rôle et un créneau.
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

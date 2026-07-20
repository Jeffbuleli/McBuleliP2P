/**
 * Envol Concept / Envol Studio - follow-up partenariat McBuleli Hackathon.
 * Suite à leur réponse (intérêt IA Business Starter + demande niveaux / appel).
 * Signature : Mme Patty B. · hi@mcbuleli.org
 */
import { EMAIL_BRAND, logoUrl, partnershipPublicBaseUrl } from "@/lib/email/config";
import { SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY } from "@/lib/support-contact";

export type EnvolHackathonEmailCopy = {
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

/** Niveaux de partenariat - texte prêt PDF (partagé Envol / autres). */
export function hackathonPartnershipLevelsFicheText(): string {
  return `McBULELI HACKATHON - NIVEAUX DE PARTENARIAT
Kinshasa · Silikin Village
═══════════════════════════════════════════════════════════════

LE PROGRAMME
Formation pratique IA + hackathon + mentorat + incubation.
Lieu : Silikin Village, 63 Ave Colonel Mondjiba, Kinshasa.
Outils : Cursor, Claude, Codex (Vibe Coding).
Format : Jour 1 bootcamp · Jour 2 compétition, pitch jury, prix.
Page : https://mcbuleli.org/hackathon

NIVEAUX SPONSOR
• Bronze    - Logo + mention réseaux sociaux / supports événement
• Silver    - Stand + kit presse + visibilité renforcée
• Gold      - Pitch stage + atelier animé avec les participants
• Platinum  - Naming + siège jury + accès recrutement talents
• Sur mesure - selon vos priorités (formation, com, RH, RSE)

AUTRES FORMES DE CONTRIBUTION
Mentorat · Jury · Communication · Bourses participants ·
Atelier thématique · Synergie avec un programme existant (ex. IA Business Starter)

CE QUE GAGNE LE PARTENAIRE
Visibilité marque · Accès talents · Impact formation IA en RDC ·
Ancrage Silikin Village · Contenu / storytelling commun

PROCHAINE ÉTAPE
Court appel 20-30 min pour caler le niveau et le calendrier.

CONTACT
Mme Patty B. - McBuleli Team
hi@mcbuleli.org
${SUPPORT_PHONE_DISPLAY}
https://mcbuleli.org/hackathon

McBuleli · RCCM : CD/KNG/RCCM/26-A-00382
═══════════════════════════════════════════════════════════════
`;
}

export function buildEnvolHackathonFollowupEmail(): EnvolHackathonEmailCopy {
  const hackathonUrl = `${partnershipPublicBaseUrl()}/hackathon`;
  const logo = logoUrl();
  const year = new Date().getFullYear();

  const subject =
    "Suite à votre message - partenariat McBuleli Hackathon · niveaux & appel";
  const preheader =
    "Niveaux Bronze à Platinum + synergie possible avec IA Business Starter - Silikin Village.";

  const text = [
    "Bonjour Envol Concept,",
    "",
    "Nous vous remercions pour votre retour chaleureux et pour l'intérêt porté au McBuleli Hackathon, notamment au regard de votre programme IA Business Starter - un bel alignement de mission autour de l'IA au service de la RDC.",
    "",
    "Comme demandé, voici les niveaux de partenariat (indicatif) :",
    "",
    "• Bronze - Logo + mention réseaux / supports événement",
    "• Silver - Stand + kit presse + visibilité renforcée",
    "• Gold - Pitch stage + atelier avec les participants",
    "• Platinum - Naming + siège jury + accès recrutement talents",
    "• Sur mesure - selon vos priorités (formation, com, RH, RSE)",
    "",
    "Autres contributions possibles : mentorat, jury, communication, bourses participants, ou atelier en synergie avec IA Business Starter au Silikin Village.",
    "",
    `Programme détaillé : ${hackathonUrl}`,
    "",
    "Nous vous proposons un court appel de 20-30 minutes avec Mme Patty B. pour en discuter de vive voix et caler le format de contribution Envol Concept / Envol Studio.",
    "",
    "Indiquez-nous simplement 2 ou 3 créneaux qui vous conviennent.",
    "",
    "Cordialement,",
    "McBuleli Team",
    "Mme Patty B.",
    SUPPORT_EMAIL,
    SUPPORT_PHONE_DISPLAY,
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
                    <p style="margin:2px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">Hackathon IA · Silikin Village · Kinshasa</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Bonjour Envol Concept,</p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Nous vous remercions pour votre retour chaleureux et pour l'intérêt porté au
                <strong style="color:${EMAIL_BRAND.text};">McBuleli Hackathon</strong>,
                notamment au regard de votre programme
                <strong style="color:${EMAIL_BRAND.text};">IA Business Starter</strong>
                - un bel alignement de mission autour de l'IA au service de la RDC.
              </p>
              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Niveaux de partenariat (comme demandé)
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>Bronze</strong> - Logo + mention réseaux / supports événement
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>Silver</strong> - Stand + kit presse + visibilité renforcée
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>Gold</strong> - Pitch stage + atelier avec les participants
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>Platinum</strong> - Naming + siège jury + accès recrutement talents
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>Sur mesure</strong> - formation, com, RH, RSE, ou synergie IA Business Starter
                </td></tr>
              </table>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Autres contributions possibles : mentorat, jury, communication, bourses participants,
                ou atelier co-animé au Silikin Village.
              </p>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                <strong style="color:${EMAIL_BRAND.text};">Prochaine étape :</strong>
                un court appel de 20-30 minutes avec Mme Patty B. pour en discuter de vive voix.
                Indiquez-nous 2 ou 3 créneaux qui vous conviennent.
              </p>
              <p style="margin:0 0 22px;text-align:center;">
                <a href="${esc(hackathonUrl)}" style="display:inline-block;background:${EMAIL_BRAND.primary};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 26px;border-radius:12px;">
                  Voir le programme Hackathon
                </a>
              </p>
              <p style="margin:0 0 6px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Cordialement,</p>
              <p style="margin:0;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">
                <strong>McBuleli Team</strong><br />
                Mme Patty B.<br />
                <a href="mailto:${SUPPORT_EMAIL}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${SUPPORT_EMAIL}</a>
                · ${esc(SUPPORT_PHONE_DISPLAY)}
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

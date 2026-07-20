/**
 * IA Académie RDC / Computer's House of Kinshasa (CHK) - partenariat Hackathon.
 * Sites : https://i-academie.com · https://ch-kin.com
 * Emails : contact@ch-kin.com · contact@ia-academie.cd
 */
import { EMAIL_BRAND, logoUrl, partnershipPublicBaseUrl } from "@/lib/email/config";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

export const CHK_CONTACT_EMAIL = "contact@ch-kin.com";
export const IA_ACADEMIE_EMAIL = "contact@ia-academie.cd";

export type IaAcademieEmailCopy = {
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
 * Win-win: CHK/IA Académie = formation IA & digital ; McBuleli = hackathon + ship réel.
 * Primary role: partenaire académique / vivier talents + mentorat vibe coding.
 */
export function buildIaAcademieChkPartnershipEmail(): IaAcademieEmailCopy {
  const hackathonUrl = `${partnershipPublicBaseUrl()}/hackathon`;
  const iaUrl = "https://i-academie.com/";
  const chkUrl = "https://ch-kin.com/";
  const logo = logoUrl();
  const year = new Date().getFullYear();

  const subject =
    "Partenariat IA Académie RDC / CHK × McBuleli Hackathon - formation IA & builders";
  const preheader =
    "Partenaire académique Silikin Village : vivier étudiants, mentorat IA, visibilité - sans sponsoring cash obligatoire.";

  const text = [
    "Bonjour l'équipe IA Académie RDC / Computer's House of Kinshasa,",
    "",
    "Nous sommes McBuleli. Nous organisons le McBuleli Hackathon au Silikin Village (Kinshasa) : bootcamp Vibe Coding (Cursor, Claude, Codex), compétition, mentorat et incubation.",
    `Programme : ${hackathonUrl}`,
    "",
    "Nous avons découvert votre double expertise :",
    `- IA Académie RDC (${iaUrl}) : formations IA générative, LLMs, agents, prompting, data, automatisation`,
    `- Computer's House of Kinshasa (${chkUrl}) : développement web/mobile, réseaux, formations pro certifiantes`,
    "",
    "RÔLE QUE NOUS VOUS PROPOSONS",
    "Partenaire académique / formation du Hackathon - un rôle clair, aligné sur vos cursus.",
    "",
    "1) Vivier participants : invitation ciblée de vos apprenants / alumni IA & web au hackathon",
    "2) Mentorat ou atelier court (30-60 min) : prompt engineering, agents, ou ship produit avec outils IA (synergie avec Vibe Coding)",
    "3) Visibilité co-marque : logo partenaire académique sur mcbuleli.org/hackathon et supports Silikin",
    "",
    "Option légère : 1 siège jury sur les projets IA / produit digital.",
    "Ce n'est pas d'abord une demande de sponsoring cash.",
    "",
    "CE QUE VOUS Y GAGNEZ",
    "- Mise en pratique terrain pour vos étudiants (projet réel + pitch jury)",
    "- Visibilité académie IA à Silikin Village auprès des builders et partenaires",
    "- Pipeline : hackathon → vos formations avancées / certifications",
    "- Contenu (atelier, photos, témoignages) pour vos réseaux",
    "",
    "CE QUE GAGNENT LES PARTICIPANTS",
    "- Accès à des mentors formation IA locaux crédibles",
    "- Continuité pédagogique après l'événement (vos cursus)",
    "",
    "Prochaine étape : appel de 20 minutes pour caler le format (vivier + atelier ± jury) et un créneau.",
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
                    <p style="margin:2px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">Hackathon IA · Partenaire académique</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Bonjour l'équipe IA Académie RDC / CHK,</p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Nous organisons le <strong style="color:${EMAIL_BRAND.text};">McBuleli Hackathon</strong> au Silikin Village :
                bootcamp Vibe Coding (Cursor, Claude, Codex), compétition, mentorat et incubation.
              </p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Votre écosystème est parfaitement aligné :
                <a href="${esc(iaUrl)}" style="color:${EMAIL_BRAND.primary};">IA Académie RDC</a>
                (IA générative, LLMs, agents, prompting) et
                <a href="${esc(chkUrl)}" style="color:${EMAIL_BRAND.primary};">Computer's House of Kinshasa</a>
                (web/mobile, réseaux, formations pro).
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Rôle proposé : partenaire académique / formation
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>1. Vivier</strong> - vos apprenants / alumni IA &amp; web rejoignent le hackathon
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>2. Atelier / mentorat</strong> - prompting, agents ou ship produit avec outils IA
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>3. Visibilité</strong> - logo partenaire académique sur la page hackathon &amp; Silikin
                </td></tr>
              </table>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.5;color:${EMAIL_BRAND.muted};">
                Option légère : 1 siège jury IA / produit. Ce n'est <strong>pas</strong> d'abord une demande de sponsoring cash.
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Gains pour IA Académie / CHK
              </p>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Mise en pratique terrain pour vos étudiants · visibilité Silikin ·
                pipeline hackathon → vos certifications · contenu pour vos réseaux.
              </p>

              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                <strong style="color:${EMAIL_BRAND.text};">Prochaine étape :</strong>
                appel de 20 minutes pour caler vivier + atelier (± jury).
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

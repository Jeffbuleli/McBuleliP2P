/**
 * IA Académie RDC / CHK - réponse + fiche partenariat académique (HTML).
 * Suite à confirmation d'intérêt (Rodrigue KASHARA DAVID).
 */
import { EMAIL_BRAND, logoUrl, partnershipPublicBaseUrl } from "@/lib/email/config";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

export const CHK_CONTACT_EMAIL = "contact@ch-kin.com";
export const IA_ACADEMIE_EMAIL = "contact@ia-academie.cd";

export type IaAcademieFicheEmailCopy = {
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

export function buildIaAcademieChkFicheEmail(): IaAcademieFicheEmailCopy {
  const hackathonUrl = `${partnershipPublicBaseUrl()}/hackathon`;
  const logo = logoUrl();
  const year = new Date().getFullYear();

  const subject =
    "Fiche partenaire académique - IA Académie RDC / CHK × McBuleli Hackathon";
  const preheader =
    "Dates prévues 12-14 août 2026 (sous réserve Silikin) - merci de nous renvoyer logo, contact référent et contributions.";

  const text = [
    "Bonjour Monsieur Kashara,",
    "",
    "Merci pour votre confirmation. Nous sommes ravis de compter IA Académie RDC et Computer's House of Kinshasa comme partenaires académiques du McBuleli Hackathon.",
    "",
    "Pour avancer efficacement, voici la fiche partenariat (ci-dessous). Un appel pourra venir plus tard si besoin ; pour l'instant nous finalisons les éléments par email.",
    "",
    "ÉVÉNEMENT",
    "McBuleli Hackathon - bootcamp Vibe Coding + compétition + Demo Day",
    "Lieu : Silikin Village, Kinshasa",
    "Dates prévues :",
    "- 12 août 2026 - Jour 1 Bootcamp & lancement (08h00-13h30)",
    "- 13 août 2026 - Jour 2 Build Day & mentorat (08h00-13h30)",
    "- 14 août 2026 - Jour 3 Demo Day & cérémonie (08h00-13h30)",
    "Statut lieu : en attente d'approbation finale de Silikin Village",
    `Page : ${hackathonUrl}`,
    "",
    "RÔLE",
    "Partenaire académique (pas de sponsoring cash obligatoire)",
    "",
    "CONTRIBUTIONS À CONFIRMER",
    "- Mobilisation apprenants / alumni vers le hackathon",
    "- Atelier ou session(s) de mentorat (thème + durée à préciser)",
    "- Siège jury (optionnel)",
    "",
    "ÉLÉMENTS DEMANDÉS",
    "1) Contact référent : Nom · Fonction · Email · Téléphone / WhatsApp",
    "2) Logo officiel (PNG ou SVG, idéalement fond transparent)",
    "3) Nom d'affichage souhaité : « IA Académie RDC » / « CHK » / les deux",
    "",
    "CE QUE McBULELI FOURNIT",
    "- Logo partenaire académique sur mcbuleli.org/hackathon",
    "- Mentions sur supports événement (selon format final)",
    "- Accès apprenants à un projet terrain + pitch jury",
    "- Coordination opérationnelle (inscriptions, brief atelier)",
    "",
    "Dès réception, nous publions le logo et préparons la suite.",
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
                    <p style="margin:2px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">Fiche partenaire académique</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Bonjour Monsieur Kashara,</p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Merci pour votre confirmation. Nous sommes ravis de compter
                <strong style="color:${EMAIL_BRAND.text};">IA Académie RDC</strong> et
                <strong style="color:${EMAIL_BRAND.text};">Computer's House of Kinshasa</strong>
                comme partenaires académiques du McBuleli Hackathon.
              </p>
              <p style="margin:0 0 22px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Pour avancer sans allonger le process, voici la
                <strong style="color:${EMAIL_BRAND.text};">fiche partenariat</strong>.
                Un appel pourra venir plus tard si besoin ; pour l'instant nous finalisons les éléments par email.
              </p>

              <!-- Fiche -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 22px;border:1px solid ${EMAIL_BRAND.border};border-radius:14px;overflow:hidden;">
                <tr>
                  <td style="padding:14px 16px;background:${EMAIL_BRAND.primary};">
                    <p style="margin:0;font-size:13px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;color:#ffffff;">
                      Fiche partenaire académique
                    </p>
                    <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.88);">
                      IA Académie RDC · CHK × McBuleli Hackathon
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:${EMAIL_BRAND.primary};">
                      Événement
                    </p>
                    <p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:${EMAIL_BRAND.text};">
                      Bootcamp Vibe Coding + compétition + Demo Day<br />
                      <span style="color:${EMAIL_BRAND.muted};">Silikin Village, Kinshasa</span>
                    </p>

                    <p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:${EMAIL_BRAND.primary};">
                      Dates prévues
                    </p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 10px;">
                      <tr><td style="padding:8px 10px;background:${EMAIL_BRAND.mint};border-radius:8px;font-size:13px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>12 août 2026</strong> · Jour 1 Bootcamp &amp; lancement · 08h00-13h30</td></tr>
                      <tr><td style="height:6px;font-size:0;line-height:0;">&nbsp;</td></tr>
                      <tr><td style="padding:8px 10px;background:${EMAIL_BRAND.mint};border-radius:8px;font-size:13px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>13 août 2026</strong> · Jour 2 Build Day &amp; mentorat · 08h00-13h30</td></tr>
                      <tr><td style="height:6px;font-size:0;line-height:0;">&nbsp;</td></tr>
                      <tr><td style="padding:8px 10px;background:${EMAIL_BRAND.mint};border-radius:8px;font-size:13px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>14 août 2026</strong> · Jour 3 Demo Day &amp; cérémonie · 08h00-13h30</td></tr>
                    </table>
                    <p style="margin:0 0 14px;font-size:12px;line-height:1.45;color:${EMAIL_BRAND.muted};">
                      <strong style="color:${EMAIL_BRAND.text};">Statut lieu :</strong>
                      en attente d'approbation finale de Silikin Village.
                    </p>

                    <p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:${EMAIL_BRAND.primary};">
                      Rôle
                    </p>
                    <p style="margin:0 0 14px;font-size:14px;line-height:1.5;color:${EMAIL_BRAND.text};">
                      Partenaire académique · pas de sponsoring cash obligatoire
                    </p>

                    <p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:${EMAIL_BRAND.primary};">
                      Contributions à confirmer
                    </p>
                    <p style="margin:0 0 4px;font-size:14px;line-height:1.5;color:${EMAIL_BRAND.text};">• Mobilisation apprenants / alumni</p>
                    <p style="margin:0 0 4px;font-size:14px;line-height:1.5;color:${EMAIL_BRAND.text};">• Atelier ou session(s) de mentorat (thème + durée)</p>
                    <p style="margin:0 0 14px;font-size:14px;line-height:1.5;color:${EMAIL_BRAND.text};">• Siège jury <span style="color:${EMAIL_BRAND.muted};">(optionnel)</span></p>

                    <p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:${EMAIL_BRAND.primary};">
                      Ce que McBuleli fournit
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                      Logo partenaire sur la page hackathon · mentions événement ·
                      projet terrain + pitch jury pour vos apprenants · coordination opérationnelle.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Merci de nous renvoyer
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 22px;">
                <tr><td style="padding:10px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>1.</strong> Contact référent - nom, fonction, email, téléphone / WhatsApp</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:10px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>2.</strong> Logo officiel - PNG ou SVG (fond transparent de préférence)</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:10px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>3.</strong> Nom d'affichage - « IA Académie RDC » / « CHK » / les deux</td></tr>
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

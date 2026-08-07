/**
 * HTML + text builders for RDPI survey launch email (M. Aristote MUGISHO).
 */
import { EMAIL_BRAND } from "@/lib/email/config";
import { SUPPORT_EMAIL } from "@/lib/support-contact";

export const RDPI_SURVEY_EMAIL_TO = "maristote@rdpithinktank.org";
export const RDPI_SURVEY_EMAIL_CC = ["info@rdpithinktank.org"];
export const RDPI_SURVEY_EMAIL_REPLY_TO = "ceo@mcbuleli.org";

export const RDPI_SURVEY_EMAIL_SUBJECT =
  "Enquête RDPI en ligne · mcbuleli.org/rdpi — formulaire & tableau de bord";

const SURVEY_URL = "https://mcbuleli.org/rdpi";
const DASHBOARD_URL = "https://mcbuleli.org/rdpi/dashboard";

export function buildRdpiSurveyLaunchEmail(args?: { testBanner?: boolean }) {
  const testBanner = args?.testBanner
    ? `<p style="margin:0 0 16px;padding:10px 12px;background:#fef3c7;border-radius:10px;font-size:13px;color:#92400e;">[TEST] Aperçu destiné à ${SUPPORT_EMAIL} — non envoyé à RDPI.</p>`
    : "";

  const text = [
    args?.testBanner
      ? `[TEST] Aperçu destiné à ${SUPPORT_EMAIL} — non envoyé à RDPI.\n`
      : "",
    "Bonjour M. Aristote MUGISHO,",
    "",
    "Comme convenu, nous avons mis en ligne le questionnaire d'enquête RDPI Think Tank sur l'impact de la fiscalité sur l'entrepreneuriat et le secteur numérique en RDC.",
    "",
    `Formulaire public (à diffuser) : ${SURVEY_URL}`,
    `Espace partenaire (réponses, graphiques, export CSV) : ${DASHBOARD_URL}`,
    "",
    "Accès dashboard : connectez-vous sur McBuleli avec maristote@rdpithinktank.org ou info@rdpithinktank.org (les comptes admin McBuleli y ont aussi accès).",
    "",
    "Démarche en bref :",
    "1) Diffusez le lien /rdpi auprès des acteurs du numérique.",
    "2) Suivez les réponses en temps réel sur /rdpi/dashboard (stats + graphiques).",
    "3) Téléchargez l'export CSV pour vos analyses.",
    "",
    "Les réponses restent confidentielles et destinées à votre étude.",
    "",
    "Bien cordialement,",
    "L'équipe McBuleli",
    SUPPORT_EMAIL,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${RDPI_SURVEY_EMAIL_SUBJECT}</title>
</head>
<body style="margin:0;padding:0;background:#e8f3ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#e8f3ee;padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #d6d3d1;overflow:hidden;">
          <tr>
            <td style="padding:22px 28px 8px;border-bottom:1px solid #d6d3d1;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <img src="https://mcbuleli.org/brand/logo-256.png" width="44" height="44" alt="McBuleli" style="display:block;border:0;border-radius:50%;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:17px;font-weight:800;color:${EMAIL_BRAND.primary};letter-spacing:-0.02em;">McBuleli</p>
                    <p style="margin:2px 0 0;font-size:12px;color:#57534e;">× RDPI Think Tank · Enquête en ligne</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              ${testBanner}
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#0c0a09;">Bonjour M. Aristote MUGISHO,</p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#57534e;">
                Comme convenu, nous avons mis en ligne le questionnaire d'enquête
                <strong style="color:#0c0a09;">RDPI Think Tank</strong>
                sur l'impact de la fiscalité sur l'entrepreneuriat, l'innovation et le secteur numérique en RDC.
              </p>
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0c0a09;text-transform:uppercase;letter-spacing:0.06em;">Liens</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                <tr>
                  <td style="padding:12px 14px;background:#e8f3ee;border-radius:12px;">
                    <p style="margin:0 0 6px;font-size:13px;color:#57534e;">Formulaire public (à diffuser)</p>
                    <a href="${SURVEY_URL}" style="color:${EMAIL_BRAND.primary};font-size:15px;font-weight:700;text-decoration:none;">${SURVEY_URL}</a>
                  </td>
                </tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr>
                  <td style="padding:12px 14px;background:#f5f5f4;border-radius:12px;">
                    <p style="margin:0 0 6px;font-size:13px;color:#57534e;">Espace partenaire — réponses, graphiques, export CSV</p>
                    <a href="${DASHBOARD_URL}" style="color:${EMAIL_BRAND.primary};font-size:15px;font-weight:700;text-decoration:none;">${DASHBOARD_URL}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#57534e;">
                <strong style="color:#0c0a09;">Accès dashboard :</strong>
                connectez-vous sur McBuleli avec
                <strong style="color:#0c0a09;">maristote@rdpithinktank.org</strong>
                ou
                <strong style="color:#0c0a09;">info@rdpithinktank.org</strong>
                (les comptes admin McBuleli y ont aussi accès).
              </p>
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0c0a09;text-transform:uppercase;letter-spacing:0.06em;">Démarche</p>
              <ol style="margin:0 0 18px;padding-left:18px;font-size:15px;line-height:1.55;color:#57534e;">
                <li style="margin-bottom:6px;">Diffusez le lien <code style="font-size:13px;">/rdpi</code> auprès des acteurs du numérique.</li>
                <li style="margin-bottom:6px;">Suivez les réponses en temps réel (stats + graphiques).</li>
                <li>Téléchargez l'export CSV pour vos analyses.</li>
              </ol>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:#57534e;">
                Les réponses restent confidentielles et destinées à votre étude.
              </p>
              <p style="margin:0 0 4px;font-size:15px;line-height:1.55;color:#0c0a09;">Bien cordialement,</p>
              <p style="margin:0;font-size:15px;line-height:1.55;color:#57534e;">L'équipe McBuleli<br/><a href="mailto:${SUPPORT_EMAIL}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${SUPPORT_EMAIL}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 22px;border-top:1px solid #d6d3d1;">
              <p style="margin:0;font-size:11px;line-height:1.45;color:#a8a29e;">
                McBuleli · plateforme d'enquête pour RDPI Think Tank ·
                <a href="https://rdpithinktank.org/" style="color:#a8a29e;">rdpithinktank.org</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject: RDPI_SURVEY_EMAIL_SUBJECT, html, text };
}

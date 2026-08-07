/**
 * Broadcast Resend — invitation enquête RDPI (expéditeur RDPI).
 * Footer : Powered by McBuleli uniquement.
 */
export const RDPI_SURVEY_BROADCAST_SUBJECT =
  "Enquête RDPI · Fiscalité & secteur numérique en RDC — votre participation";

export const RDPI_SURVEY_BROADCAST_FROM_HINT =
  "info@rdpithinktank.org (ou domaine Resend RDPI)";

export const RDPI_SURVEY_BROADCAST_CONTACT_EMAIL = "info@rdpithinktank.org";
export const RDPI_SURVEY_BROADCAST_WHATSAPP = "+243 994 558 660";
export const RDPI_SURVEY_BROADCAST_WHATSAPP_URL = "https://wa.me/243994558660";
export const RDPI_SURVEY_URL = "https://mcbuleli.org/rdpi";

const RDPI_BLUE = "#1E5EFF";
const RDPI_GOLD = "#E8B923";
const RDPI_LOGO = "https://mcbuleli.org/partners/rdpi-thinktank-logo.png";

export function buildRdpiSurveyBroadcastEmail() {
  const text = [
    "Bonjour,",
    "",
    "Dans le contexte de l'arrêté interministériel n°015/CAB/MIN/EN/AKIM/MLNS/ALM/2026 et CAB/MIN/FINACES/2026/096, le Research for Development and Prosperity Institute (RDPI Think Tank) mène une étude afin d'évaluer les effets de cette fiscalité sur l'entrepreneuriat, l'innovation et le développement du secteur numérique en République démocratique du Congo.",
    "",
    "Votre expérience de terrain est essentielle. En répondant au questionnaire (environ 8 à 10 minutes), vous contribuez à des recommandations fondées sur la réalité des acteurs du numérique.",
    "",
    "Les réponses sont destinées à la présente recherche et traitées de manière confidentielle.",
    "",
    `Participer à l'enquête : ${RDPI_SURVEY_URL}`,
    "",
    "Pourquoi participer ?",
    "• Faire entendre la voix des startups, fintechs, développeurs et entreprises numériques.",
    "• Éclairer les décideurs sur les effets concrets du barème sur l'investissement et l'innovation.",
    "• Soutenir une étude indépendante menée par RDPI Think Tank.",
    "",
    "Une question ?",
    `WhatsApp : ${RDPI_SURVEY_BROADCAST_WHATSAPP}`,
    RDPI_SURVEY_BROADCAST_WHATSAPP_URL,
    "",
    "Cordialement,",
    "L'équipe RDPI Think Tank",
    RDPI_SURVEY_BROADCAST_CONTACT_EMAIL,
    "https://rdpithinktank.org/",
    "",
    "Powered by McBuleli",
    "https://mcbuleli.org/",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${RDPI_SURVEY_BROADCAST_SUBJECT}</title>
</head>
<body style="margin:0;padding:0;background:#eef2ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
    Votre voix compte : participez à l'enquête RDPI Think Tank sur la fiscalité du numérique en RDC (8 à 10 minutes).
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2ff;padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #d6d3d1;overflow:hidden;">
          <tr>
            <td style="padding:22px 28px 16px;background:#0a0a0a;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;width:56px;padding-right:14px;">
                    <img src="${RDPI_LOGO}" width="48" height="48" alt="RDPI Think Tank" style="display:block;border:0;border-radius:10px;background:#ffffff;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${RDPI_GOLD};">RDPI Think Tank</p>
                    <p style="margin:4px 0 0;font-size:15px;font-weight:700;line-height:1.35;color:#ffffff;">Research for Development and Prosperity Institute</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 28px 8px;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${RDPI_BLUE};">Invitation à participer</p>
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:800;letter-spacing:-0.02em;color:#0c0a09;">Enquête sur l'impact de la fiscalité sur le secteur numérique en RDC</h1>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#44403c;">Bonjour,</p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#44403c;">
                Dans le contexte de l'arrêté interministériel
                <strong style="color:#0c0a09;">n°015/CAB/MIN/EN/AKIM/MLNS/ALM/2026 et CAB/MIN/FINACES/2026/096</strong>,
                le <strong style="color:#0c0a09;">Research for Development and Prosperity Institute (RDPI Think Tank)</strong>
                mène une étude afin d'évaluer les effets de cette fiscalité sur l'entrepreneuriat, l'innovation et le développement du secteur numérique en République démocratique du Congo.
              </p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#44403c;">
                Votre expérience de terrain est essentielle. En répondant au questionnaire (environ
                <strong style="color:#0c0a09;">8 à 10 minutes</strong>), vous contribuez à des recommandations fondées sur la réalité des acteurs du numérique.
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#44403c;">
                Les réponses sont destinées à la présente recherche et traitées de manière confidentielle.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 12px;">
                <tr>
                  <td style="border-radius:999px;background:${RDPI_BLUE};">
                    <a href="${RDPI_SURVEY_URL}" style="display:inline-block;padding:14px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Participer à l'enquête</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 22px;font-size:13px;line-height:1.5;color:#78716c;">
                Lien direct :
                <a href="${RDPI_SURVEY_URL}" style="color:${RDPI_BLUE};text-decoration:none;font-weight:600;">mcbuleli.org/rdpi</a>
              </p>
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#0c0a09;">Pourquoi participer ?</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 22px;">
                <tr>
                  <td style="padding:12px 14px;background:#f8fafc;border-radius:12px;border:1px solid #e7e5e4;">
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:#44403c;">• Faire entendre la voix des startups, fintechs, développeurs et entreprises numériques.</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:#44403c;">• Éclairer les décideurs sur les effets concrets du barème sur l'investissement et l'innovation.</p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#44403c;">• Soutenir une étude indépendante menée par RDPI Think Tank.</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#0c0a09;">Une question ?</p>
              <p style="margin:0 0 12px;font-size:14px;line-height:1.55;color:#57534e;">Notre équipe est disponible sur WhatsApp ou par email.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 22px;">
                <tr>
                  <td style="border-radius:999px;background:#25d366;">
                    <a href="${RDPI_SURVEY_BROADCAST_WHATSAPP_URL}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">WhatsApp · ${RDPI_SURVEY_BROADCAST_WHATSAPP}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 4px;font-size:15px;line-height:1.55;color:#0c0a09;">Cordialement,</p>
              <p style="margin:0 0 4px;font-size:15px;line-height:1.55;font-weight:700;color:#0c0a09;">L'équipe RDPI Think Tank</p>
              <p style="margin:0 0 2px;font-size:14px;line-height:1.5;color:#57534e;">
                <a href="mailto:${RDPI_SURVEY_BROADCAST_CONTACT_EMAIL}" style="color:${RDPI_BLUE};text-decoration:none;">${RDPI_SURVEY_BROADCAST_CONTACT_EMAIL}</a>
              </p>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#78716c;">
                <a href="https://rdpithinktank.org/" style="color:#78716c;text-decoration:none;">rdpithinktank.org</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 22px;border-top:1px solid #e7e5e4;background:#fafaf8;" align="center">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#a8a29e;">
                Powered by
                <a href="https://mcbuleli.org/" style="color:#57534e;font-weight:700;text-decoration:none;">McBuleli</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject: RDPI_SURVEY_BROADCAST_SUBJECT,
    html,
    text,
  };
}

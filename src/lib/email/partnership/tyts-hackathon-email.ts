/**
 * THE YOUNG TECHNOLOGY SERVICE - follow-up partenariat McBuleli Hackathon.
 * Contact WhatsApp → email : nsomoneaaron2@gmail.com
 */
import { EMAIL_BRAND, logoUrl, partnershipPublicBaseUrl } from "@/lib/email/config";
import { SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY } from "@/lib/support-contact";

export const TYTS_HACKATHON_TO = "nsomoneaaron2@gmail.com";

export type TytsHackathonEmailCopy = {
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

export function buildTytsHackathonFollowupEmail(): TytsHackathonEmailCopy {
  const hackathonUrl = `${partnershipPublicBaseUrl()}/hackathon`;
  const logo = logoUrl();
  const year = new Date().getFullYear();

  const subject =
    "Partenariat McBuleli Hackathon - collaboration THE YOUNG TECHNOLOGY SERVICE";
  const preheader =
    "Ce que vous pouvez apporter au Hackathon IA Silikin Village - et ce que vous y gagnez.";

  const text = [
    "Bonjour THE YOUNG TECHNOLOGY SERVICE,",
    "",
    "Merci pour votre message et pour l'ouverture à collaborer. Nous avons bien noté votre expertise (télécoms, réseaux, cybersécurité, formations professionnelles) et vos implantations (Brazzaville, Pointe-Noire, Kinshasa-Gombe).",
    "",
    "McBuleli organise le McBuleli Hackathon au Silikin Village (Kinshasa) : bootcamp IA pratique (Cursor, Claude, Codex), compétition, mentorat et incubation, pour répondre aux défis de la RDC.",
    `Plus d'infos : ${hackathonUrl}`,
    "",
    "CE QUE VOUS POUVEZ APPORTER",
    "• Mentorat / atelier : cybersécurité, réseaux, fibre, téléphonie IP, administration système",
    "• Jury technique sur les projets liés à l'infra, la sécurité ou les télécoms",
    "• Pipeline de participants : apprenants et alumni de vos formations",
    "• Appui technique événement (réseau, vidéo, multimédia) si disponible",
    "• Visibilité croisée Congo Brazza / Pointe-Noire / Kinshasa",
    "",
    "CE QUE VOUS Y GAGNEZ",
    "• Visibilité marque auprès des builders et partenaires à Silikin Village",
    "• Positionnement comme acteur formation tech & cybersécurité de référence",
    "• Accès à un vivier de talents IA + infra pour stages, recrutement ou suites de formation",
    "• Contenu et storytelling (réseaux, certificat, programme entrepreneurial)",
    "• Ouverture vers des packs Bronze à Platinum (logo, stand, atelier, jury)",
    "",
    "NIVEAUX (indicatif)",
    "• Bronze - Logo + mentions",
    "• Silver - Stand + kit presse",
    "• Gold - Atelier / pitch stage",
    "• Platinum - Naming + jury + recrutement",
    "• Sur mesure - selon vos spécialités (cyber, réseaux, solaire, etc.)",
    "",
    "Nous proposons un court appel de 20-30 minutes avec Mme Patty B. pour caler la forme de collaboration la plus utile pour vos deux organisations.",
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
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Bonjour THE YOUNG TECHNOLOGY SERVICE,</p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Merci pour votre message et pour l'ouverture à collaborer. Nous avons bien noté votre expertise
                (télécoms, réseaux, cybersécurité, formations professionnelles) et vos implantations
                (Brazzaville, Pointe-Noire, Kinshasa-Gombe).
              </p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                <strong style="color:${EMAIL_BRAND.text};">McBuleli</strong> organise le
                <strong style="color:${EMAIL_BRAND.text};">McBuleli Hackathon</strong> au Silikin Village :
                bootcamp IA (Cursor, Claude, Codex), compétition, mentorat et incubation pour des solutions
                concrètes en RDC.
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Ce que vous pouvez apporter
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  Mentorat / atelier : cybersécurité, réseaux, fibre, téléphonie IP, Windows Server
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  Jury technique sur les projets infra, sécurité ou télécoms
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  Pipeline de participants (apprenants &amp; alumni de vos formations)
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  Appui technique événement (réseau, vidéo, multimédia) si disponible
                </td></tr>
              </table>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Ce que vous y gagnez
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  Visibilité marque à Silikin Village auprès des builders et partenaires
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  Positionnement formation tech &amp; cybersécurité de référence
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  Vivier de talents IA + infra (stages, recrutement, suites de formation)
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  Packs Bronze à Platinum (logo, stand, atelier, jury) selon votre engagement
                </td></tr>
              </table>

              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                <strong style="color:${EMAIL_BRAND.text};">Prochaine étape :</strong>
                un court appel de 20-30 minutes avec Mme Patty B. pour caler la forme de collaboration
                la plus utile pour vos deux organisations.
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

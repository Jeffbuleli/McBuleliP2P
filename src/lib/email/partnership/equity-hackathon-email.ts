/**
 * EquityBCDC - follow-up partenariat McBuleli Hackathon (Silikin Village).
 * Signature outreach : Mme Patty B. · hi@mcbuleli.org
 */
import { EMAIL_BRAND, logoUrl, partnershipPublicBaseUrl } from "@/lib/email/config";
import { SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY } from "@/lib/support-contact";

export const EQUITY_HACKATHON_TO_PRODUCTION = "marketing@equitybcdc.cd";

export type EquityHackathonEmailCopy = {
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

/** One-page partnership sheet (plain text - paste into Word/Google Docs → PDF). */
export function equityHackathonPartnershipFicheText(): string {
  return `McBULELI HACKATHON - FICHE PARTENARIAT
Kinshasa · Silikin Village
═══════════════════════════════════════════════════════════════

QUI SOMMES-NOUS
McBuleli développe des solutions numériques pour l'Afrique :
portefeuille, P2P, communauté builders et formation. Site : mcbuleli.org

LE PROGRAMME
McBuleli Hackathon - formation pratique IA + compétition + mentorat + incubation.
Lieu : Silikin Village, 63 Ave Colonel Mondjiba, Kinshasa.
Outils : Cursor, Claude, Codex (Vibe Coding).
Format : Jour 1 bootcamp · Jour 2 hackathon, pitch jury, prix.
Public : builders, étudiants, jeunes talents tech & FinTech en RDC.
Page : https://mcbuleli.org/hackathon

POURQUOI EQUITYBCDC
• Image innovation & RSE auprès de la jeunesse kinshasaise
• Accès à un vivier de talents (recrutement / challenges métiers)
• Association à un événement IA concret au cœur de Kinshasa
• Option défi co-brandé « banking & inclusion financière »

PACKS SPONSOR (indicatif)
• Bronze   - Logo + mention réseaux
• Silver   - Stand + kit presse
• Gold     - Pitch stage + atelier
• Platinum - Naming + jury + recrutement
• Sur mesure - selon vos priorités marketing / RH / RSE

PARTENARIAT NON SPONSOR (également possible)
Jury, mentorat, communication, recrutement, bourses participants,
atelier thématique EquityBCDC.

PROCHAINE ÉTAPE
Réunion 20–30 min (visio ou agence siège EquityBCDC,
15 Boulevard du 30 Juin, Gombe / Kinshasa) pour caler calendrier,
visibilité et pack.

CONTACT
Mme Patty B. - McBuleli Team
hi@mcbuleli.org
${SUPPORT_PHONE_DISPLAY}
https://mcbuleli.org/hackathon

McBuleli · RCCM : CD/KNG/RCCM/26-A-00382
═══════════════════════════════════════════════════════════════
`;
}

export function buildEquityHackathonFollowupEmail(): EquityHackathonEmailCopy {
  const hackathonUrl = `${partnershipPublicBaseUrl()}/hackathon`;
  const logo = logoUrl();
  const year = new Date().getFullYear();

  const subject =
    "Suite à votre retour - partenariat McBuleli Hackathon · Silikin Village";
  const preheader =
    "Formation IA, hackathon et talents à Kinshasa - proposition de collaboration EquityBCDC.";

  const text = [
    "Bonjour EquityBCDC,",
    "",
    "Nous vous remercions pour votre réponse via WhatsApp et pour l'invitation à poursuivre l'échange par e-mail ou en agence siège.",
    "",
    "McBuleli développe des solutions numériques pour l'Afrique (portefeuille, P2P, communauté builders). Nous organisons le McBuleli Hackathon au Silikin Village (Kinshasa) : bootcamp pratique d'IA (Cursor, Claude, Codex), compétition, mentorat et incubation, autour de défis concrets pour la RDC (FinTech, inclusion, services).",
    "",
    "Nous souhaitons explorer une collaboration avec EquityBCDC en tant que partenaire / sponsor, notamment pour :",
    "1. Visibilité marque - logo, communication événementielle et réseaux",
    "2. Engagement talents - présence jury, atelier, ou stand recrutement",
    "3. Impact RSE / innovation - soutien à la formation IA des jeunes builders à Kinshasa",
    "4. Lien métier - défi « banking & inclusion » co-défini avec vos équipes (option)",
    "",
    `Page programme : ${hackathonUrl}`,
    "",
    "Prochaine étape proposée :",
    "- Un appel ou une réunion de 20-30 minutes (en ligne ou en agence siège, 15 Boulevard du 30 Juin, Gombe) pour présenter le format, le calendrier et les packs Bronze → Platinum.",
    "- Nous pouvons aussi vous transmettre une fiche partenariat (1 page) dès votre accord.",
    "",
    "Nous restons à votre disposition pour convenir d'un créneau avec Mme Patty B. et l'équipe McBuleli.",
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
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Bonjour EquityBCDC,</p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Nous vous remercions pour votre réponse via WhatsApp et pour l'invitation à poursuivre l'échange par e-mail ou en agence siège.
              </p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                <strong style="color:${EMAIL_BRAND.text};">McBuleli</strong> développe des solutions numériques pour l'Afrique
                (portefeuille, P2P, communauté builders). Nous organisons le
                <strong style="color:${EMAIL_BRAND.text};">McBuleli Hackathon</strong> au
                <strong style="color:${EMAIL_BRAND.text};">Silikin Village</strong> (Kinshasa) :
                bootcamp pratique d'IA (Cursor, Claude, Codex), compétition, mentorat et incubation,
                autour de défis concrets pour la RDC (FinTech, inclusion, services).
              </p>
              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Pistes de collaboration avec EquityBCDC
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>1. Visibilité marque</strong> - logo, communication événementielle et réseaux
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>2. Engagement talents</strong> - jury, atelier ou stand recrutement
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>3. Impact RSE / innovation</strong> - formation IA des jeunes builders à Kinshasa
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>4. Lien métier</strong> - défi « banking &amp; inclusion » co-défini avec vos équipes
                </td></tr>
              </table>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.5;color:${EMAIL_BRAND.muted};">
                Packs : Bronze (logo) · Silver (stand) · Gold (stage + atelier) · Platinum (naming + jury + recrutement).
              </p>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                <strong style="color:${EMAIL_BRAND.text};">Prochaine étape :</strong>
                réunion de 20-30 minutes (visio ou agence siège,
                15 Boulevard du 30 Juin, Gombe) pour présenter le format, le calendrier et les packs.
                Une fiche partenariat d'une page est disponible sur demande.
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

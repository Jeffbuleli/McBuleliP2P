/**
 * Bienv Photography 243 — confirmation couverture médias + badge + ambassadeur.
 */
import { EMAIL_BRAND } from "@/lib/email/config";
import {
  BIENV_PHOTO_EMAIL,
  BIENV_PHOTO_NAME,
  BIENV_PHOTO_ORG,
  BIENV_PHOTO_PROMO_CODE,
  type BienvPhotographyAssets,
} from "@/lib/hackathon/bienv-photography";
import {
  AMBASSADOR_CASHBACK_USD,
  AMBASSADOR_DISCOUNT_PERCENT,
  PARTNER_SEAT_1_AT,
  PARTNER_SEAT_2_AT,
  PROMO_CASHBACK_CLAIM_MIN_USD,
} from "@/lib/hackathon/promo-types";

export const BIENV_PHOTO_SUBJECT =
  "McBuleli Hackathon × Bienv Photography 243 — couverture médias, badge & programme ambassadeur";

export type BienvPhotographyEmailInput = BienvPhotographyAssets;

export function buildBienvPhotographyEmail(
  assets: BienvPhotographyEmailInput,
): { subject: string; html: string; text: string } {
  const {
    badgePassUrl,
    badgeCode,
    promoCode,
    shareUrl,
    dashboardUrl,
  } = assets;

  const text = [
    `Bonjour ${BIENV_PHOTO_NAME},`,
    "",
    `Merci de couvrir le McBuleli Hackathon 2026 pour ${BIENV_PHOTO_ORG}.`,
    "",
    "MISSION — 28 & 29 août 2026 · Silikin Village, Kinshasa",
    "- Photos des deux journées",
    "- Séquences vidéo (ambiance, ateliers, pitchs)",
    "- Interviews (participants, mentors, partenaires)",
    "- Moments forts (remise des prix, démos, coulisses)",
    "",
    "RÉMUNÉRATION — 150 USD (deux tranches)",
    "- 100 USD : versé dans les 24 h précédant le hackathon",
    "- 50 USD : après livraison d'une vidéo résumé de l'événement + une série de photos",
    "",
    "BADGE MÉDIAS (1 place)",
    `Lien : ${badgePassUrl}`,
    `Code badge : ${badgeCode}`,
    "Présentez ce badge à l'entrée — accès couverture sur les deux jours.",
    "",
    "PROGRAMME AMBASSADEUR",
    `Code promo : ${promoCode}`,
    `Lien de partage : ${shareUrl}`,
    `Tableau de bord : ${dashboardUrl}`,
    "",
    `Chaque inscrit qui utilise ${promoCode} bénéficie de -${AMBASSADOR_DISCOUNT_PERCENT} % sur le ticket.`,
    `Vous recevez ${AMBASSADOR_CASHBACK_USD} USD de cashback par inscription payée et confirmée.`,
    `Retrait Mobile Money dès ${PROMO_CASHBACK_CLAIM_MIN_USD} USD cumulés.`,
    `Places offertes : 1 place à ${PARTNER_SEAT_1_AT} inscrits confirmés, 2e place à ${PARTNER_SEAT_2_AT}+.`,
    "Page ambassadeur : https://mcbuleli.org/hackathon/ambassadeur",
    "",
    "Référent : Bienvenue Ngonda · bienvngonda862@gmail.com",
    "",
    "Cordialement,",
    "McBuleli Team",
    "hi@mcbuleli.org",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${BIENV_PHOTO_SUBJECT}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.mint};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Couverture photo/vidéo Hackathon — badge Médias, 150 USD, code BIENV_PHOTO_243.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.mint};padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid ${EMAIL_BRAND.border};overflow:hidden;">
          <tr>
            <td style="padding:22px 28px 8px;border-bottom:1px solid ${EMAIL_BRAND.border};">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <img src="https://mcbuleli.org/brand/logo-256.png" width="44" height="44" alt="McBuleli" style="display:block;border:0;border-radius:50%;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:17px;font-weight:800;color:${EMAIL_BRAND.primary};letter-spacing:-0.02em;">McBuleli</p>
                    <p style="margin:2px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">Hackathon · Médias</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Bonjour <strong>${BIENV_PHOTO_NAME}</strong>,</p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Merci de confirmer la couverture médias du McBuleli Hackathon 2026 avec
                <strong style="color:${EMAIL_BRAND.text};">${BIENV_PHOTO_ORG}</strong>.
                Vous serez notre référent photo &amp; vidéo sur les deux journées à Silikin Village.
              </p>

              <p style="margin:0 0 10px;font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_BRAND.text};">Mission — 28 &amp; 29 août 2026</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">Photos des deux journées (ateliers, équipes, public)</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">Séquences vidéo (ambiance, build, pitchs, démos)</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">Interviews (participants, mentors, partenaires)</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">Moments forts (remise des prix, coulisses, clôture)</td></tr>
              </table>

              <p style="margin:0 0 10px;font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_BRAND.text};">Rémunération — 150 USD</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                <tr><td style="padding:10px 14px;background:#fffbeb;border-radius:10px;font-size:14px;line-height:1.5;color:${EMAIL_BRAND.text};"><strong>100 USD</strong> — versé dans les <strong>24 h précédant</strong> le hackathon</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:10px 14px;background:#fffbeb;border-radius:10px;font-size:14px;line-height:1.5;color:${EMAIL_BRAND.text};"><strong>50 USD</strong> — après livraison d&apos;une <strong>vidéo résumé</strong> + <strong>série de photos</strong></td></tr>
              </table>

              <p style="margin:0 0 10px;font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_BRAND.text};">Badge Médias (1 place)</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 12px;">
                <tr>
                  <td style="padding:14px 16px;background:${EMAIL_BRAND.mint};border-radius:12px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${EMAIL_BRAND.primary};">Votre badge</p>
                    <p style="margin:0 0 8px;font-size:15px;line-height:1.5;">
                      <a href="${badgePassUrl}" style="color:${EMAIL_BRAND.primary};font-weight:700;text-decoration:underline;">${badgePassUrl}</a>
                    </p>
                    <p style="margin:0;font-size:13px;color:${EMAIL_BRAND.muted};">Code : <strong style="color:${EMAIL_BRAND.text};">${badgeCode}</strong> · Rôle : <strong style="color:${EMAIL_BRAND.text};">Médias</strong></p>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                <tr>
                  <td style="border-radius:12px;background:${EMAIL_BRAND.primary};">
                    <a href="${badgePassUrl}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Ouvrir mon badge Médias</a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 10px;font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_BRAND.text};">Programme ambassadeur</p>
              <p style="margin:0 0 10px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                En parallèle de la couverture, vous disposez d&apos;un code promo personnel pour inviter votre réseau :
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 12px;">
                <tr>
                  <td style="padding:14px 16px;background:#f5f5f4;border-radius:12px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${EMAIL_BRAND.muted};">Code promo</p>
                    <p style="margin:0;font-size:22px;font-weight:800;letter-spacing:0.06em;color:${EMAIL_BRAND.text};">${promoCode}</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 14px;">
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">−${AMBASSADOR_DISCOUNT_PERCENT} % pour chaque inscrit via votre code</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">+${AMBASSADOR_CASHBACK_USD} USD de cashback par inscription payée et confirmée</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">Retrait Mobile Money dès ${PROMO_CASHBACK_CLAIM_MIN_USD} USD cumulés</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">1 place offerte à ${PARTNER_SEAT_1_AT} confirmés · 2e place à ${PARTNER_SEAT_2_AT}+</td></tr>
              </table>
              <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Lien de partage : <a href="${shareUrl}" style="color:${EMAIL_BRAND.primary};font-weight:600;">${shareUrl}</a>
              </p>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Suivi des inscriptions : <a href="${dashboardUrl}" style="color:${EMAIL_BRAND.primary};font-weight:600;">tableau de bord ambassadeur</a>
                · <a href="https://mcbuleli.org/hackathon/ambassadeur" style="color:${EMAIL_BRAND.primary};font-weight:600;">mcbuleli.org/hackathon/ambassadeur</a>
              </p>

              <p style="margin:0;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Référent : <strong style="color:${EMAIL_BRAND.text};">${BIENV_PHOTO_NAME}</strong> ·
                <a href="mailto:${BIENV_PHOTO_EMAIL}" style="color:${EMAIL_BRAND.primary};">${BIENV_PHOTO_EMAIL}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;">
              <p style="margin:0;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.text};">
                Cordialement,<br />
                <strong>McBuleli Team</strong><br />
                Mme Patty B.<br />
                <a href="mailto:hi@mcbuleli.org" style="color:${EMAIL_BRAND.primary};">hi@mcbuleli.org</a><br />
                +243 997 366 736 · +243 860 218 521<br />
                <a href="https://wa.me/message/IF6DXNT6Q2VSI1" style="color:${EMAIL_BRAND.primary};">WhatsApp</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject: BIENV_PHOTO_SUBJECT, html, text };
}

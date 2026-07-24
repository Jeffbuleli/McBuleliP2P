/**
 * ILOKWE GROUP - fiche partenariat confirmé (réponse à leur acceptation).
 * Atelier rentabilité agricole · Prix ILOKWE · Sponsor Or · Jury · promo ILOKWE.
 */
import { EMAIL_BRAND, logoUrl, partnershipPublicBaseUrl } from "@/lib/email/config";
import { ILOKWE_PARTNER } from "@/lib/hackathon/event-content";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

export const ILOKWE_GROUP_EMAIL = ILOKWE_PARTNER.email;
export const ILOKWE_FACEBOOK = ILOKWE_PARTNER.facebook;
export const ILOKWE_LOGO_CID = "ilokwe-group-logo";
export const ILOKWE_LOGO_PUBLIC_PATH = "partners/ilokwe-group-logo.png";

export type IlokweGroupFicheEmailCopy = {
  subject: string;
  preheader: string;
  html: string;
  text: string;
};

export type IlokweGroupFicheArgs = {
  /** Partner share link for code ILOKWE */
  promoShareUrl: string;
  /** Optional dashboard URL */
  promoDashboardUrl?: string | null;
  /** Use cid: for Resend inline attachment (recommended). */
  useInlineLogo?: boolean;
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildIlokweGroupFicheEmail(
  args: IlokweGroupFicheArgs,
): IlokweGroupFicheEmailCopy {
  const hackathonUrl = `${partnershipPublicBaseUrl()}/hackathon`;
  const logo = logoUrl();
  const year = new Date().getFullYear();
  const partnerLogoSrc = args.useInlineLogo
    ? `cid:${ILOKWE_LOGO_CID}`
    : `${partnershipPublicBaseUrl()}/${ILOKWE_LOGO_PUBLIC_PATH}`;
  const promoCode = ILOKWE_PARTNER.promoCode;
  const promoUrl = args.promoShareUrl;

  const subject =
    "Partenariat confirmé - ILOKWE GROUP × McBuleli Hackathon (Sponsor Or · Prix ILOKWE)";
  const preheader =
    "Merci Mr Christian Ikwele - atelier, jury, Prix ILOKWE, Sponsor Or, code promo ILOKWE et 2 places partenaires.";

  const text = [
    `Bonjour Mr ${ILOKWE_PARTNER.contactName.replace(/^Mr\s+/i, "")},`,
    "",
    "Merci pour votre réponse, votre logo, et pour avoir retenu l'atelier sur la rentabilité agricole.",
    "Nous confirmons officiellement le partenariat ILOKWE GROUP × McBuleli Hackathon.",
    "",
    "RÉFÉRENT",
    `${ILOKWE_PARTNER.contactName}`,
    `Tél / WhatsApp : ${ILOKWE_PARTNER.phone}`,
    `Email : ${ILOKWE_GROUP_EMAIL}`,
    `Facebook : ${ILOKWE_FACEBOOK}`,
    "",
    "ÉVÉNEMENT",
    "McBuleli Hackathon - bootcamp Vibe Coding + compétition + Demo Day",
    "Lieu : Silikin Village, Kinshasa",
    "Dates prévues :",
    "- 13 Août 2026 - Jeudi Bootcamp & Build (08h00-17h00)",
    "- 14 Août 2026 - Vendredi Build & Demo Day (08h00-17h00)",
    "Statut lieu : en attente d'approbation finale de Silikin Village",
    `Page : ${hackathonUrl}`,
    "",
    "RÔLE CONFIRMÉ",
    "Partenaire Agriculture & AgriBusiness · Sponsor Or (Gold)",
    "Siège Jury · référence terrain du défi AgroTech",
    "",
    "CONTRIBUTIONS CONFIRMÉES",
    "1) Atelier : rentabilité agricole, exécution terrain & chaîne de valeur",
    "2) Mentorat des équipes AgroTech (production, marché, distribution)",
    "3) Référence terrain : moderniser la chaîne de production (modèle ILOKWE)",
    "4) Siège Jury sur les prototypes AgriTech",
    "5) Naming du premier prix : Prix ILOKWE",
    "6) Sponsor Or + visibilité marque (page hackathon, badges, tickets, supports)",
    "",
    "VISIBILITÉ",
    "Votre logo apparaît sur mcbuleli.org/hackathon, les badges QR et tickets participants,",
    "ainsi que dans la communication événement (partenaires / sponsors).",
    "Nous compterons aussi sur votre relais (Facebook et réseaux) pour amplifier l'appel à candidatures.",
    "",
    "CODE PROMO ILOKWE (2 places partenaires)",
    `Code : ${promoCode}`,
    `Lien d'inscription avec code : ${promoUrl}`,
    "- Vos invités bénéficient de -10% à l'inscription via ce lien",
    "- Cashback 10 USD / paiement confirmé (dashboard partenaire)",
    "- 2 places offertes partenaires : 1ère place à 3 paiements confirmés via le code, 2e place à 10",
    args.promoDashboardUrl
      ? `Dashboard promo : ${args.promoDashboardUrl}`
      : "",
    "",
    "RÉUNION PARTENAIRES",
    "Nous allons planifier une réunion des partenaires (brief atelier, jury, créneaux, visibilité).",
    "Merci de nous indiquer 2-3 créneaux qui vous conviennent (ou un WhatsApp pour caler rapidement).",
    "",
    "Cordialement,",
    "McBuleli Team",
    "Mme Patty B.",
    SUPPORT_EMAIL,
    SUPPORT_PHONES_DISPLAY,
    `WhatsApp : ${SUPPORT_WA_PATH}`,
    hackathonUrl,
  ]
    .filter(Boolean)
    .join("\n");

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
                    <p style="margin:2px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">Hackathon IA · Partenariat confirmé</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">
                Bonjour Mr <strong>Christian Ikwele</strong>,
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Merci pour votre réponse, votre logo, et pour avoir retenu l'atelier sur la
                <strong style="color:${EMAIL_BRAND.text};">rentabilité agricole</strong>.
                Nous confirmons officiellement le partenariat
                <strong style="color:${EMAIL_BRAND.text};">ILOKWE GROUP × McBuleli Hackathon</strong>.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;border-radius:14px;overflow:hidden;border:1px solid ${EMAIL_BRAND.border};">
                <tr>
                  <td style="padding:0;background:#0B3D2E;text-align:center;line-height:0;font-size:0;">
                    <img src="${esc(partnerLogoSrc)}" width="560" alt="ILOKWE GROUP" style="display:block;width:100%;max-width:560px;height:auto;border:0;outline:none;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;background:#0B3D2E;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#d1fae5;font-style:italic;">La valeur ajoutée du terroir</p>
                    <p style="margin:8px 0 0;">
                      <a href="${esc(ILOKWE_FACEBOOK)}" style="color:#a7f3d0;font-size:13px;font-weight:700;text-decoration:none;">Page Facebook ILOKWE GROUP →</a>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">Référent</p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                ${esc(ILOKWE_PARTNER.contactName)} ·
                <a href="tel:+243990044150" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${esc(ILOKWE_PARTNER.phone)}</a>
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Rôle confirmé
              </p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.text};">
                <strong>Partenaire Agriculture &amp; AgriBusiness</strong>
                · <strong style="color:#8a6a0a;">Sponsor Or</strong>
                · <strong>Jury</strong>
                · référence terrain <strong>AgroTech</strong>
              </p>

              <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Contributions confirmées
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;">
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">1. Atelier : rentabilité agricole, exécution terrain &amp; chaîne de valeur</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">2. Mentorat des équipes AgroTech</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">3. Référence terrain : moderniser la chaîne de production</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">4. <strong>Siège Jury</strong> AgriTech</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:#fbf3d8;border-radius:10px;font-size:14px;line-height:1.45;color:#8a6a0a;"><strong>5. Premier prix nommé « Prix ILOKWE » · Sponsor Or</strong></td></tr>
              </table>

              <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Visibilité
              </p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Logo sur <strong style="color:${EMAIL_BRAND.text};">mcbuleli.org/hackathon</strong>, badges QR, tickets participants et supports événement.
                Nous compterons aussi sur votre relais Facebook pour amplifier l'appel à candidatures.
              </p>

              <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Code promo ${esc(promoCode)} · 2 places partenaires
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 10px;background:${EMAIL_BRAND.mint};border-radius:12px;border:1px solid ${EMAIL_BRAND.border};">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0 0 6px;font-size:13px;color:${EMAIL_BRAND.muted};">Lien d'inscription avec code</p>
                    <p style="margin:0;font-size:14px;font-weight:700;word-break:break-all;">
                      <a href="${esc(promoUrl)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${esc(promoUrl)}</a>
                    </p>
                    <p style="margin:10px 0 0;font-size:13px;line-height:1.45;color:${EMAIL_BRAND.text};">
                      -10% pour les inscrits via ce lien · cashback 10&nbsp;USD / paiement confirmé<br />
                      2 places offertes : 1ère à 3 paiements confirmés, 2e à 10
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 18px;text-align:center;">
                <a href="${esc(promoUrl)}" style="display:inline-block;background:${EMAIL_BRAND.primary};color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 22px;border-radius:12px;">
                  Ouvrir le lien promo ${esc(promoCode)}
                </a>
              </p>

              <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Réunion des partenaires
              </p>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Nous allons fixer une <strong style="color:${EMAIL_BRAND.text};">réunion des partenaires</strong>
                (brief atelier, jury, créneaux, visibilité). Merci de nous proposer 2-3 créneaux,
                ou de nous écrire sur WhatsApp pour caler rapidement.
              </p>

              <p style="margin:0 0 22px;text-align:center;">
                <a href="${esc(hackathonUrl)}" style="display:inline-block;background:#ffffff;color:${EMAIL_BRAND.primary};text-decoration:none;font-size:15px;font-weight:700;padding:13px 26px;border-radius:12px;border:2px solid ${EMAIL_BRAND.primary};">
                  Voir la page McBuleli Hackathon
                </a>
              </p>

              <p style="margin:0 0 6px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Cordialement,</p>
              <p style="margin:0;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">
                <strong>McBuleli Team</strong><br />
                Mme Patty B.<br />
                <a href="mailto:${SUPPORT_EMAIL}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${SUPPORT_EMAIL}</a><br />
                ${SUPPORT_PHONES_DISPLAY}<br />
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

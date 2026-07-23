/**
 * Ambassador promo confirmation email - share link + dashboard.
 * Accents in copy; URLs ASCII. Tiret "-" only.
 */
import { EMAIL_BRAND, logoUrl, partnershipPublicBaseUrl } from "@/lib/email/config";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";
import {
  AMBASSADOR_CASHBACK_USD,
  AMBASSADOR_DISCOUNT_PERCENT,
  PROMO_CASHBACK_CLAIM_MIN_USD,
} from "@/lib/hackathon/promo-types";

const FONT = "'Poppins',Arial,Helvetica,sans-serif";
const RCCM = "CD/KNG/RCCM/26-A-00382";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type AmbassadorPromoConfirmArgs = {
  displayName: string;
  email: string;
  code: string;
  discountPercent?: number;
  cashbackUsd?: number;
  priceUsd: string;
  shareUrl: string;
  dashboardUrl: string;
};

export function buildAmbassadorPromoConfirmEmail(
  args: AmbassadorPromoConfirmArgs,
): { subject: string; html: string; text: string } {
  const year = new Date().getFullYear();
  const name = args.displayName.trim() || "Ambassadeur";
  const discount = args.discountPercent ?? AMBASSADOR_DISCOUNT_PERCENT;
  const cashback = args.cashbackUsd ?? AMBASSADOR_CASHBACK_USD;
  const greeting = `Bonjour ${name},`;
  const subject = `Ton code ambassadeur ${args.code} - McBuleli Hackathon`;
  const base = partnershipPublicBaseUrl();

  const text = [
    greeting,
    "",
    `Ton code ambassadeur ${args.code} est actif.`,
    "",
    `Lien a partager (promo appliquee automatiquement) :`,
    args.shareUrl,
    "",
    `Tarif via ton code : ${args.priceUsd} USD (-${discount}%).`,
    `Cashback : ${cashback} USD par inscription payee via ton code.`,
    `Retrait Mobile Money des ${PROMO_CASHBACK_CLAIM_MIN_USD} USD cumulés.`,
    "",
    `Dashboard :`,
    args.dashboardUrl,
    "",
    `Pas de cashback sur ton propre paiement.`,
    "",
    `Contact : ${SUPPORT_EMAIL} | ${SUPPORT_PHONE_DISPLAY}`,
    `WhatsApp : ${SUPPORT_WA_PATH}`,
    "",
    `© ${year} McBuleli - RCCM : ${RCCM}`,
    `${base}/hackathon/ambassadeur`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
  <title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f1;font-family:${FONT};color:${EMAIL_BRAND.text};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f1;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${EMAIL_BRAND.border};">
          <tr>
            <td style="padding:22px 24px 8px;text-align:center;background:#eaf6ee;">
              <img src="${esc(logoUrl())}" alt="McBuleli" width="56" height="56" style="display:inline-block;border-radius:14px;" />
              <p style="margin:12px 0 0;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${EMAIL_BRAND.primary};">Ambassadeur Hackathon</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 4px;">
              <h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:700;color:${EMAIL_BRAND.text};">Ton code promo est prêt</h1>
              <p style="margin:14px 0 0;font-size:15px;line-height:1.6;color:${EMAIL_BRAND.text};">${esc(greeting)}</p>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:${EMAIL_BRAND.muted};">
                Partage ton lien : le code <strong style="color:${EMAIL_BRAND.primary};">${esc(args.code)}</strong> s&apos;applique automatiquement.
                Suis les confirmations et retire ton cashback Mobile Money.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 6px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BRAND.mint};border-radius:12px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:${EMAIL_BRAND.primary};">Code</p>
                    <p style="margin:6px 0 0;font-size:24px;font-weight:700;letter-spacing:0.04em;color:${EMAIL_BRAND.primary};font-family:ui-monospace,Menlo,monospace;">${esc(args.code)}</p>
                    <p style="margin:10px 0 0;font-size:13px;line-height:1.5;color:${EMAIL_BRAND.muted};">
                      -${discount}% (${esc(args.priceUsd)} USD) - cashback ${cashback} USD / payé
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 28px 4px;">
              <p style="margin:0;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Retrait dès <strong style="color:${EMAIL_BRAND.text};">${PROMO_CASHBACK_CLAIM_MIN_USD} USD</strong> cumulés.
                Pas de cashback sur ton propre paiement.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 8px;text-align:center;">
              <a href="${esc(args.shareUrl)}" style="display:inline-block;background:${EMAIL_BRAND.primary};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 22px;border-radius:12px;">
                Ouvrir mon lien à partager
              </a>
              <p style="margin:10px 0 0;font-size:12px;line-height:1.5;color:${EMAIL_BRAND.muted};word-break:break-all;">
                <a href="${esc(args.shareUrl)}" style="color:${EMAIL_BRAND.primary};text-decoration:underline;">${esc(args.shareUrl)}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 28px 22px;text-align:center;">
              <a href="${esc(args.dashboardUrl)}" style="display:inline-block;background:#ffffff;color:${EMAIL_BRAND.primary};text-decoration:none;font-size:15px;font-weight:700;padding:13px 22px;border-radius:12px;border:2px solid ${EMAIL_BRAND.primary};">
                Ouvrir mon dashboard
              </a>
              <p style="margin:12px 0 0;font-size:13px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Stats en temps réel : inscrits, confirmations, cashback.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 18px;font-size:13px;line-height:1.55;color:${EMAIL_BRAND.muted};">
              Questions :
              <a href="mailto:${SUPPORT_EMAIL}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${SUPPORT_EMAIL}</a>
              - ${esc(SUPPORT_PHONE_DISPLAY)} -
              <a href="${esc(SUPPORT_WA_PATH)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">WhatsApp</a>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 24px;border-top:1px solid ${EMAIL_BRAND.border};text-align:center;">
              <p style="margin:0;font-size:11px;color:${EMAIL_BRAND.muted};">
                © ${year} McBuleli - RCCM : ${RCCM}<br />
                <a href="${esc(`${base}/hackathon/ambassadeur`)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">mcbuleli.org/hackathon/ambassadeur</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

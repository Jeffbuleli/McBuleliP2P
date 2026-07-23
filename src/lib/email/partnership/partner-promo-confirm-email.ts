/**
 * Partner promo confirmation email - share link + live dashboard.
 * French accents in copy; emails/URLs/HTML attrs stay ASCII.
 */
import { EMAIL_BRAND, logoUrl, partnershipPublicBaseUrl } from "@/lib/email/config";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

const FONT = "'Poppins',Arial,Helvetica,sans-serif";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type PartnerPromoConfirmArgs = {
  orgName: string;
  partnerName?: string | null;
  partnerEmail: string;
  code: string;
  discountPercent: number;
  cashbackUsd: number;
  priceUsd: string;
  shareUrl: string;
  dashboardUrl: string;
};

export function buildPartnerPromoConfirmEmail(args: PartnerPromoConfirmArgs): {
  subject: string;
  html: string;
  text: string;
} {
  const greeting = args.partnerName?.trim()
    ? `Bonjour ${args.partnerName.trim()},`
    : `Bonjour ${args.orgName},`;

  const subject = `Votre code promo ${args.code} - McBuleli Hackathon`;

  const text = [
    greeting,
    "",
    `Votre code partenaire ${args.code} est actif pour ${args.orgName}.`,
    "",
    `Lien a partager (promo appliquee automatiquement, non modifiable) :`,
    args.shareUrl,
    "",
    `Tarif via votre code : ${args.priceUsd} USD (-${args.discountPercent}%).`,
    `Cashback : ${args.cashbackUsd} USD par inscription payee via votre code.`,
    "",
    `Dashboard temps reel (inscrits, statut, WhatsApp, cashback) :`,
    args.dashboardUrl,
    "",
    `Contact : ${SUPPORT_EMAIL} | ${SUPPORT_PHONES_DISPLAY}`,
    `WhatsApp : ${SUPPORT_WA_PATH}`,
    "McBuleli",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
  <title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f5;font-family:${FONT};color:${EMAIL_BRAND.text};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f5;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${EMAIL_BRAND.border};">
          <tr>
            <td style="padding:22px 24px 8px;text-align:center;">
              <img src="${esc(logoUrl())}" alt="McBuleli" width="56" height="56" style="display:inline-block;border-radius:14px;" />
              <p style="margin:12px 0 0;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${EMAIL_BRAND.primary};">Partenaire Hackathon</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 4px;">
              <h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:700;color:${EMAIL_BRAND.text};">Votre code promo est prêt</h1>
              <p style="margin:14px 0 0;font-size:15px;line-height:1.6;color:${EMAIL_BRAND.text};">${esc(greeting)}</p>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:${EMAIL_BRAND.muted};">
                Voici votre espace partenaire pour <strong style="color:${EMAIL_BRAND.text};">${esc(args.orgName)}</strong>.
                Les participants qui cliquent votre lien ont le code <strong style="color:${EMAIL_BRAND.primary};">${esc(args.code)}</strong> appliqué automatiquement (non modifiable).
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
                      -${args.discountPercent}% (${esc(args.priceUsd)} USD) - cashback ${args.cashbackUsd} USD / payé
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 8px;text-align:center;">
              <a href="${esc(args.shareUrl)}" style="display:inline-block;background:${EMAIL_BRAND.primary};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 22px;border-radius:12px;">
                Copier le lien à partager
              </a>
              <p style="margin:10px 0 0;font-size:12px;line-height:1.5;color:${EMAIL_BRAND.muted};word-break:break-all;">
                <a href="${esc(args.shareUrl)}" style="color:${EMAIL_BRAND.primary};text-decoration:underline;">${esc(args.shareUrl)}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 28px 24px;text-align:center;">
              <a href="${esc(args.dashboardUrl)}" style="display:inline-block;background:#ffffff;color:${EMAIL_BRAND.primary};text-decoration:none;font-size:15px;font-weight:700;padding:13px 22px;border-radius:12px;border:2px solid ${EMAIL_BRAND.primary};">
                Ouvrir mon dashboard
              </a>
              <p style="margin:12px 0 0;font-size:13px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Stats en temps réel : inscrits, confirmation, N° ticket, WhatsApp (rappel paiement), cashback cumulé.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 22px;font-size:13px;line-height:1.55;color:${EMAIL_BRAND.muted};">
              Questions :
              <a href="mailto:${SUPPORT_EMAIL}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${SUPPORT_EMAIL}</a>
              · ${esc(SUPPORT_PHONES_DISPLAY)} -
              <a href="${esc(SUPPORT_WA_PATH)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">WhatsApp</a>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 28px 22px;border-top:1px solid ${EMAIL_BRAND.border};text-align:center;font-size:12px;color:${EMAIL_BRAND.muted};">
              Powered by McBuleli -
              <a href="${esc(partnershipPublicBaseUrl())}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">mcbuleli.org</a>
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

import {
  EMAIL_BRAND,
  EMAIL_FOOTER,
  illustrationUrl,
  logoUrl,
  type EmailIllustration,
} from "@/lib/email/config";
import type { EmailCopyBlock } from "@/lib/email/copy";

function escHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type McBuleliEmailLayoutArgs = {
  copy: EmailCopyBlock;
  actionUrl: string;
  illustration: EmailIllustration;
  locale: "en" | "fr";
  /** When true, href uses Resend {{{ACTION_URL}}} placeholder. */
  resendVariables?: boolean;
};

export function renderMcBuleliEmail(args: McBuleliEmailLayoutArgs): {
  html: string;
  text: string;
} {
  const { copy, actionUrl, illustration, locale, resendVariables } = args;
  const href = resendVariables ? "{{{ACTION_URL}}}" : escHtml(actionUrl);
  const bodyHtml = resendVariables
    ? copy.body.replace(/\{\{\{NEW_EMAIL\}\}\}/g, "{{{NEW_EMAIL}}}")
    : escHtml(copy.body);
  const year = new Date().getFullYear();
  const rights = locale === "fr" ? "Tous droits réservés." : "All rights reserved.";
  const waLabel = locale === "fr" ? "WhatsApp" : "WhatsApp";

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escHtml(copy.title)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.mint};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escHtml(copy.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.mint};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:${EMAIL_BRAND.white};border-radius:20px;overflow:hidden;border:1px solid ${EMAIL_BRAND.border};">
          <tr>
            <td style="padding:28px 28px 12px;text-align:center;">
              <img src="${logoUrl()}" width="120" height="auto" alt="McBuleli" style="display:block;margin:0 auto;border:0;max-width:120px;" />
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;text-align:center;">
              <img src="${illustrationUrl(illustration)}" width="200" height="200" alt="" style="display:block;margin:0 auto;border:0;max-width:200px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 8px;text-align:center;">
              <h1 style="margin:0;font-size:22px;line-height:1.25;font-weight:700;color:${EMAIL_BRAND.text};">${escHtml(copy.title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 20px;text-align:center;">
              <p style="margin:0;font-size:15px;line-height:1.5;color:${EMAIL_BRAND.muted};">${bodyHtml}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;text-align:center;">
              <a href="${href}" style="display:inline-block;background:${EMAIL_BRAND.primary};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:12px;">${escHtml(copy.cta)}</a>
            </td>
          </tr>
          ${
            copy.expiry
              ? `<tr><td style="padding:0 32px 24px;text-align:center;"><p style="margin:0;font-size:12px;line-height:1.4;color:${EMAIL_BRAND.muted};">${escHtml(copy.expiry)}</p></td></tr>`
              : ""
          }
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid ${EMAIL_BRAND.border};text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:${EMAIL_BRAND.muted};">${escHtml(copy.footerHelp)} <a href="mailto:${EMAIL_FOOTER.supportEmail}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${escHtml(copy.footerContact)}</a></p>
              <p style="margin:0 0 8px;font-size:12px;color:${EMAIL_BRAND.muted};">
                <a href="mailto:${EMAIL_FOOTER.supportEmail}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${EMAIL_FOOTER.supportEmail}</a>
                · <a href="${EMAIL_FOOTER.whatsApp}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${waLabel}</a>
              </p>
              <p style="margin:0;font-size:11px;color:${EMAIL_BRAND.muted};">© ${year} McBuleli · ${rights}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    copy.title,
    "",
    copy.body,
    "",
    `${copy.cta}: ${actionUrl}`,
    copy.expiry ?? "",
    "",
    `${copy.footerHelp} ${EMAIL_FOOTER.supportEmail}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { html, text };
}

import {
  EMAIL_BRAND,
  EMAIL_FOOTER,
  illustrationUrl,
  logoUrl,
  type EmailIllustration,
} from "@/lib/email/config";
import type { EmailCopyBlock } from "@/lib/email/copy";
import type { EmailDetailRow } from "@/lib/email/wallet-email-details";

function escHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Hosted PNG on mcbuleli.org — same approach as the working Resend templates. */
export type EmailImageMode = "https";

export type McBuleliEmailLayoutArgs = {
  copy: EmailCopyBlock;
  actionUrl: string;
  illustration: EmailIllustration;
  locale: "en" | "fr";
  imageMode?: EmailImageMode;
  /** When true, href uses Resend {{{ACTION_URL}}} placeholder. */
  resendVariables?: boolean;
  detailRows?: EmailDetailRow[];
};

function renderDetailsTable(rows: EmailDetailRow[], escapeValues: boolean): string {
  const val = (v: string) => (escapeValues ? escHtml(v) : v);
  const cells = rows
    .map(
      (row) => `<tr>
      <td style="padding:8px 0;font-size:13px;color:${EMAIL_BRAND.muted};vertical-align:top;width:38%;">${escHtml(row.label)}</td>
      <td style="padding:8px 0;font-size:13px;color:${EMAIL_BRAND.text};font-weight:600;word-break:break-all;">${val(row.value)}</td>
    </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 auto;max-width:360px;">${cells}</table>`;
}

export function renderMcBuleliEmail(args: McBuleliEmailLayoutArgs): {
  html: string;
  text: string;
} {
  const {
    copy,
    actionUrl,
    illustration,
    locale,
    resendVariables,
    detailRows,
  } = args;
  const href = resendVariables ? "{{{ACTION_URL}}}" : escHtml(actionUrl);
  const bodyHtml = resendVariables
    ? copy.body.replace(/\{\{\{NEW_EMAIL\}\}\}/g, "{{{NEW_EMAIL}}}")
    : escHtml(copy.body);
  const year = new Date().getFullYear();
  const rights =
    locale === "fr" ? "Tous droits réservés." : "All rights reserved.";
  const waLabel = locale === "fr" ? "WhatsApp" : "WhatsApp";

  const logoSrc = logoUrl();
  const illustrationSrc = illustrationUrl(illustration);

  const detailsHtml =
    detailRows && detailRows.length > 0
      ? `<tr>
            <td style="padding:0 40px 20px;text-align:center;">
              <div style="background:${EMAIL_BRAND.mint};border-radius:14px;padding:16px 18px;text-align:left;">
                ${renderDetailsTable(detailRows, !resendVariables)}
              </div>
            </td>
          </tr>`
      : "";

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
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:${EMAIL_BRAND.white};border-radius:20px;border:1px solid ${EMAIL_BRAND.border};">
          <tr>
            <td style="padding:32px 32px 12px;text-align:center;">
              <img src="${logoSrc}" width="120" height="auto" alt="McBuleli" style="display:block;margin:0 auto;border:0;max-width:120px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 0;text-align:center;">
              <img src="${illustrationSrc}" width="200" height="auto" alt="" style="display:block;margin:0 auto;border:0;max-width:200px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 8px;text-align:center;">
              <h1 style="margin:0;font-size:22px;line-height:1.25;font-weight:700;color:${EMAIL_BRAND.text};">${escHtml(copy.title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 24px;text-align:center;">
              <p style="margin:0;font-size:15px;line-height:1.5;color:${EMAIL_BRAND.muted};">${bodyHtml}</p>
            </td>
          </tr>
          ${detailsHtml}
          <tr>
            <td style="padding:0 40px 28px;text-align:center;">
              <a href="${href}" style="display:inline-block;background:${EMAIL_BRAND.primary};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:12px;">${escHtml(copy.cta)}</a>
            </td>
          </tr>
          ${
            copy.expiry
              ? `<tr><td style="padding:0 40px 28px;text-align:center;"><p style="margin:0;font-size:12px;line-height:1.4;color:${EMAIL_BRAND.muted};">${escHtml(copy.expiry)}</p></td></tr>`
              : ""
          }
          <tr>
            <td style="padding:24px 40px 32px;border-top:1px solid ${EMAIL_BRAND.border};text-align:center;">
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

  const detailText =
    detailRows && detailRows.length > 0
      ? [
          "",
          ...detailRows.map((r) => `${r.label}: ${r.value}`),
        ].join("\n")
      : "";

  const text = [
    "McBuleli",
    copy.title,
    "",
    copy.body,
    detailText,
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

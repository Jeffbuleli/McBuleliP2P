import {
  EMAIL_BRAND,
  EMAIL_FOOTER,
  appBaseUrl,
  illustrationUrl,
  logoUrl,
  type EmailIllustration,
} from "@/lib/email/config";
import {
  EMAIL_LOGO_CID,
  emailIllustrationCid,
} from "@/lib/email/email-inline-images";
import type { PartnershipTemplate } from "@/lib/email/partnership/avadapay-templates";

function escHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Minimal markdown: **bold** only. */
function inlineFormat(text: string): string {
  const escaped = escHtml(text);
  return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function renderParagraphs(paragraphs: string[]): string {
  return paragraphs
    .map((p) => {
      const trimmed = p.trim();
      const align =
        trimmed === "Bonjour," ||
        trimmed === "Hello," ||
        trimmed.startsWith("Cordialement") ||
        trimmed.startsWith("Best regards")
          ? "center"
          : "left";
      return `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};text-align:${align};">${inlineFormat(trimmed)}</p>`;
    })
    .join("");
}

function renderDetailsTable(
  rows: PartnershipTemplate["detailRows"],
  useInlineImages: boolean,
): string {
  const cells = rows
    .map(
      (row) => `<tr>
      <td style="padding:8px 0;font-size:13px;color:${EMAIL_BRAND.muted};vertical-align:top;width:38%;">${escHtml(row.label)}</td>
      <td style="padding:8px 0;font-size:13px;color:${EMAIL_BRAND.text};font-weight:600;word-break:break-all;">${escHtml(row.value)}</td>
    </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 auto;max-width:360px;">${cells}</table>`;
}

function renderHeaderLogo(useInlineImages: boolean): string {
  const src = useInlineImages ? `cid:${EMAIL_LOGO_CID}` : logoUrl();
  return `<td style="vertical-align:middle;padding-right:10px;"><img src="${src}" width="48" height="48" alt="McBuleli" style="display:block;border:0;border-radius:10px;" /></td>`;
}

function renderIllustration(
  illustration: EmailIllustration,
  useInlineImages: boolean,
): string {
  const src = useInlineImages
    ? `cid:${emailIllustrationCid(illustration)}`
    : illustrationUrl(illustration);
  return `<img src="${src}" width="160" height="160" alt="" style="display:block;margin:0 auto;border:0;max-width:160px;height:auto;opacity:0.95;" />`;
}

function renderFooterLogo(useInlineImages: boolean): string {
  const src = useInlineImages ? `cid:${EMAIL_LOGO_CID}` : logoUrl();
  return `<img src="${src}" width="32" height="32" alt="" style="display:block;margin:0 auto 10px;border:0;border-radius:6px;opacity:0.9;" />`;
}

export function renderPartnershipEmail(args: {
  template: PartnershipTemplate;
  actionUrl?: string;
  useInlineImages?: boolean;
  illustration?: EmailIllustration;
}): { html: string; text: string; subject: string } {
  const {
    template,
    actionUrl = appBaseUrl(),
    useInlineImages = true,
    illustration = "security",
  } = args;
  const locale = template.locale;
  const year = new Date().getFullYear();
  const rights =
    locale === "fr" ? "Tous droits réservés." : "All rights reserved.";
  const brandTagline =
    locale === "fr" ? "Portefeuille & P2P · Afrique" : "Wallet & P2P · Africa";
  const supportLine =
    locale === "fr" ? "Support McBuleli" : "McBuleli support";
  const footerHelp = locale === "fr" ? "Besoin d'aide ?" : "Need help?";
  const footerContact = EMAIL_FOOTER.supportEmail;

  const bodyHtml = renderParagraphs(template.paragraphs);
  const detailsHtml = `<tr>
            <td style="padding:4px 28px 20px;">
              <div style="background:${EMAIL_BRAND.mint};border-radius:14px;padding:16px 18px;">
                ${renderDetailsTable(template.detailRows, useInlineImages)}
              </div>
            </td>
          </tr>`;

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escHtml(template.title)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.mint};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escHtml(template.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.mint};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:${EMAIL_BRAND.white};border-radius:20px;overflow:hidden;border:1px solid ${EMAIL_BRAND.border};">
          <tr>
            <td style="padding:24px 28px 8px;text-align:center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                <tr>
                  ${renderHeaderLogo(useInlineImages)}
                  <td style="vertical-align:middle;text-align:left;">
                    <p style="margin:0;font-size:20px;font-weight:800;color:${EMAIL_BRAND.primary};letter-spacing:-0.02em;">McBuleli</p>
                    <p style="margin:2px 0 0;font-size:11px;color:${EMAIL_BRAND.muted};">${brandTagline}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:4px 28px 0;text-align:center;">
              ${renderIllustration(illustration, useInlineImages)}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 8px;text-align:center;">
              <h1 style="margin:0;font-size:22px;line-height:1.25;font-weight:700;color:${EMAIL_BRAND.text};">${escHtml(template.title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 8px;">
              ${bodyHtml}
            </td>
          </tr>
          ${detailsHtml}
          <tr>
            <td style="padding:8px 32px 24px;text-align:center;">
              <a href="${escHtml(actionUrl)}" style="display:inline-block;background:${EMAIL_BRAND.primary};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:12px;">${escHtml(template.cta)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid ${EMAIL_BRAND.border};text-align:center;">
              ${renderFooterLogo(useInlineImages)}
              <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:${EMAIL_BRAND.text};">McBuleli</p>
              <p style="margin:0 0 10px;font-size:12px;color:${EMAIL_BRAND.muted};">${footerHelp} <a href="mailto:${EMAIL_FOOTER.supportEmail}" style="color:${EMAIL_BRAND.primary};text-decoration:none;font-weight:600;">${footerContact}</a></p>
              <p style="margin:0 0 8px;font-size:12px;color:${EMAIL_BRAND.muted};">
                <span style="color:${EMAIL_BRAND.muted};">${supportLine}:</span>
                <a href="mailto:${EMAIL_FOOTER.supportEmail}" style="color:${EMAIL_BRAND.primary};text-decoration:none;font-weight:600;">${EMAIL_FOOTER.supportEmail}</a>
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
    "McBuleli",
    template.title,
    "",
    ...template.paragraphs,
    "",
    ...template.detailRows.map((r) => `${r.label}: ${r.value}`),
    "",
    `${template.cta}: ${actionUrl}`,
    "",
    `${footerHelp} ${EMAIL_FOOTER.supportEmail}`,
  ].join("\n");

  return { html, text, subject: template.subject };
}

import {
  EMAIL_BRAND,
  partnershipPublicBaseUrl,
} from "@/lib/email/config";
import type { PartnershipTemplate } from "@/lib/email/partnership/avadapay-templates";
import { PARTNERSHIP_PLACEHOLDERS } from "@/lib/email/partnership/avadapay-templates";
import type { PartnershipEmailLayout } from "@/lib/email/partnership/partnership-email-config";
import { PARTNERSHIP_EMAIL_LAYOUT } from "@/lib/email/partnership/partnership-email-config";

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

function stripBoldMarkers(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1");
}

function renderConversationParagraphs(paragraphs: string[]): string {
  return paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (
        trimmed === "Cordialement," ||
        trimmed === "Best regards,"
      ) {
        return "";
      }
      return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1c1917;">${inlineFormat(trimmed)}</p>`;
    })
    .filter(Boolean)
    .join("");
}

function renderConversationSignature(locale: "fr" | "en"): string {
  const p = PARTNERSHIP_PLACEHOLDERS;
  const regards = locale === "fr" ? "Cordialement," : "Best regards,";
  const siteLabel = locale === "fr" ? "Site" : "Website";
  const url = partnershipPublicBaseUrl();

  return `<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#1c1917;">
${regards}<br /><br />
<strong>${escHtml(p.contactName)}</strong><br />
${escHtml(p.contactRole)} — ${escHtml(p.companyLegalName)}<br />
<a href="mailto:${escHtml(p.contactEmail)}" style="color:#305f33;text-decoration:none;">${escHtml(p.contactEmail)}</a>
 · ${escHtml(p.contactPhone)}<br />
RCCM ${escHtml(p.registrationId)}<br />
${siteLabel} : <a href="${escHtml(url)}" style="color:#305f33;text-decoration:underline;">mcbuleli.org</a>
</p>`;
}

/** Plain business letter — best chance at Gmail Primary. */
function renderConversationHtml(args: {
  template: PartnershipTemplate;
  actionUrl: string;
}): string {
  const { template, actionUrl } = args;
  const locale = template.locale;
  const siteLine =
    locale === "fr"
      ? `Plus d’informations sur la plateforme : <a href="${escHtml(actionUrl)}" style="color:#305f33;text-decoration:underline;">mcbuleli.org</a>`
      : `More about the platform: <a href="${escHtml(actionUrl)}" style="color:#305f33;text-decoration:underline;">mcbuleli.org</a>`;

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escHtml(template.subject)}</title>
</head>
<body style="margin:0;padding:24px 20px;font-family:Georgia,'Times New Roman',serif;background:#ffffff;">
  ${renderConversationParagraphs(template.paragraphs)}
  <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1c1917;">${siteLine}</p>
  ${renderConversationSignature(locale)}
</body>
</html>`;
}

function renderConversationText(args: {
  template: PartnershipTemplate;
  actionUrl: string;
}): string {
  const { template, actionUrl } = args;
  const p = PARTNERSHIP_PLACEHOLDERS;
  const locale = template.locale;
  const regards = locale === "fr" ? "Cordialement," : "Best regards,";

  const body = template.paragraphs
    .filter((para) => para.trim() !== regards)
    .map(stripBoldMarkers)
    .join("\n\n");

  return [
    body,
    "",
    locale === "fr"
      ? `Plus d'informations : ${actionUrl}`
      : `More information: ${actionUrl}`,
    "",
    regards,
    "",
    p.contactName,
    `${p.contactRole} — ${p.companyLegalName}`,
    `${p.contactEmail} · ${p.contactPhone}`,
    `RCCM ${p.registrationId}`,
    p.website,
  ].join("\n");
}

/** Legacy card layout (more likely Promotions). */
function renderMarketingHtml(args: {
  template: PartnershipTemplate;
  actionUrl: string;
}): string {
  const { template, actionUrl } = args;
  const locale = template.locale;
  const bodyHtml = template.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">${inlineFormat(p)}</p>`,
    )
    .join("");

  const details = template.detailRows
    .map((r) => `<tr><td style="padding:6px 0;color:${EMAIL_BRAND.muted};">${escHtml(r.label)}</td><td style="padding:6px 0;font-weight:600;">${escHtml(r.value)}</td></tr>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="${locale}">
<body style="margin:0;padding:32px 16px;background:${EMAIL_BRAND.mint};font-family:sans-serif;">
  <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid ${EMAIL_BRAND.border};">
    <tr><td style="padding:28px;">
      <h1 style="margin:0 0 16px;font-size:20px;color:${EMAIL_BRAND.text};">${escHtml(template.title)}</h1>
      ${bodyHtml}
      <table role="presentation" width="100%" style="margin:16px 0;">${details}</table>
      <p style="text-align:center;"><a href="${escHtml(actionUrl)}" style="display:inline-block;background:${EMAIL_BRAND.primary};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">${escHtml(template.cta)}</a></p>
    </td></tr>
  </table>
</body>
</html>`;
}

export function renderPartnershipEmail(args: {
  template: PartnershipTemplate;
  actionUrl?: string;
  layout?: PartnershipEmailLayout;
}): { html: string; text: string; subject: string } {
  const {
    template,
    actionUrl = partnershipPublicBaseUrl(),
    layout = PARTNERSHIP_EMAIL_LAYOUT,
  } = args;

  if (layout === "conversation") {
    return {
      html: renderConversationHtml({ template, actionUrl }),
      text: renderConversationText({ template, actionUrl }),
      subject: template.subject,
    };
  }

  const html = renderMarketingHtml({ template, actionUrl });
  const text = [
    template.title,
    "",
    ...template.paragraphs.map(stripBoldMarkers),
    "",
    ...template.detailRows.map((r) => `${r.label}: ${r.value}`),
    "",
    `${template.cta}: ${actionUrl}`,
  ].join("\n");

  return { html, text, subject: template.subject };
}

import {
  EMAIL_BRAND,
  EMAIL_FOOTER,
  illustrationUrl,
  logoUrl,
  type EmailIllustration,
} from "@/lib/email/config";

export type MarketingFeatureRow = {
  icon: EmailIllustration;
  title: string;
  text: string;
};

export type MarketingBroadcastCopy = {
  preheader: string;
  headline: string;
  /** One or two short paragraphs (plain text, escaped). */
  paragraphs: string[];
  bullets?: string[];
  /** Optional hero illustration below headline */
  heroIllustration?: EmailIllustration;
  /** Icon + title + one line — educational blocks */
  features?: MarketingFeatureRow[];
  /** Trust line above CTA */
  reassurance?: string;
  ctaLabel: string;
  /** Absolute URL or Resend placeholder e.g. {{{CTA_URL}}} */
  ctaHref: string;
  /** Full-width poster above body (e.g. /launch/social-landscape.png) */
  bannerImageUrl?: string;
  /** Highlighted date/time line (launch emails) */
  dateHighlight?: string;
};

function escHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphsHtml(paragraphs: string[]): string {
  return paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">${escHtml(p)}</p>`,
    )
    .join("");
}

function bulletsHtml(items: string[]): string {
  const lis = items
    .map(
      (b) =>
        `<li style="margin:0 0 8px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">${escHtml(b)}</li>`,
    )
    .join("");
  return `<ul style="margin:0 0 20px;padding:0 0 0 20px;text-align:left;">${lis}</ul>`;
}

function bannerImageHtml(imageUrl: string, alt: string, linkHref: string): string {
  const src = escHtml(imageUrl);
  const href = linkHref.includes("{{{") ? linkHref : escHtml(linkHref);
  return `<tr>
            <td style="padding:0;line-height:0;">
              <a href="${href}" style="text-decoration:none;">
                <img src="${src}" width="520" alt="${escHtml(alt)}" style="display:block;width:100%;max-width:520px;height:auto;border:0;" />
              </a>
            </td>
          </tr>`;
}

function dateHighlightHtml(text: string): string {
  return `<p style="margin:0 0 16px;text-align:center;">
              <span style="display:inline-block;background:${EMAIL_BRAND.primary};color:#fff;font-size:13px;font-weight:800;padding:10px 18px;border-radius:999px;line-height:1.3;">${escHtml(text)}</span>
            </p>`;
}

function heroIllustrationHtml(kind: EmailIllustration): string {
  const src = illustrationUrl(kind);
  return `<tr>
            <td style="padding:0 28px 12px;text-align:center;">
              <img src="${src}" width="168" height="168" alt="" style="display:block;margin:0 auto;border:0;max-width:168px;height:auto;" />
            </td>
          </tr>`;
}

function featuresHtml(rows: MarketingFeatureRow[]): string {
  const cells = rows
    .map((row) => {
      const src = illustrationUrl(row.icon);
      return `<tr>
        <td style="padding:10px 12px;background:${EMAIL_BRAND.mint};border-radius:12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="width:72px;vertical-align:top;padding-right:10px;">
                <img src="${src}" width="64" height="64" alt="" style="display:block;border:0;border-radius:10px;" />
              </td>
              <td style="vertical-align:top;text-align:left;">
                <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:${EMAIL_BRAND.text};">${escHtml(row.title)}</p>
                <p style="margin:0;font-size:13px;line-height:1.45;color:${EMAIL_BRAND.muted};">${escHtml(row.text)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;">${cells}</table>`;
}

export type RenderMarketingEmailArgs = {
  copy: MarketingBroadcastCopy;
  locale: "en" | "fr";
  /** Resend audience placeholders in body/CTA */
  resendAudience?: boolean;
  year?: number;
};

/**
 * Minimal McBuleli marketing layout — optional hero + feature illustrations.
 * For Resend Broadcasts (unlimited marketing sends).
 */
export function renderMarketingBroadcastHtml(args: RenderMarketingEmailArgs): string {
  const { copy, locale, resendAudience = true, year = new Date().getFullYear() } = args;
  const logoSrc = logoUrl();
  const rights =
    locale === "fr" ? "Tous droits réservés." : "All rights reserved.";
  const tagline =
    locale === "fr"
      ? "Portefeuille crypto & P2P"
      : "Crypto wallet & P2P";
  const waLabel = "WhatsApp";

  const greeting = resendAudience
    ? locale === "fr"
      ? `Bonjour {{{contact.first_name|ami}}},`
      : `Hi {{{contact.first_name|there}}},`
    : locale === "fr"
      ? "Bonjour,"
      : "Hi,";

  const unsubscribe = resendAudience
    ? `<p style="margin:12px 0 0;font-size:11px;color:${EMAIL_BRAND.muted};"><a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:${EMAIL_BRAND.muted};text-decoration:underline;">${locale === "fr" ? "Se désabonner" : "Unsubscribe"}</a></p>`
    : "";

  const href = copy.ctaHref.includes("{{{") ? copy.ctaHref : escHtml(copy.ctaHref);

  const bannerBlock = copy.bannerImageUrl
    ? bannerImageHtml(copy.bannerImageUrl, copy.headline, copy.ctaHref)
    : "";

  const dateBlock = copy.dateHighlight ? dateHighlightHtml(copy.dateHighlight) : "";

  const heroBlock = copy.heroIllustration
    ? heroIllustrationHtml(copy.heroIllustration)
    : "";

  const featuresBlock =
    copy.features && copy.features.length > 0
      ? featuresHtml(copy.features)
      : copy.bullets?.length
        ? bulletsHtml(copy.bullets)
        : "";

  const reassuranceBlock = copy.reassurance
    ? `<p style="margin:0 0 18px;font-size:12px;line-height:1.5;color:${EMAIL_BRAND.muted};text-align:center;">${escHtml(copy.reassurance)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escHtml(copy.headline)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.mint};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escHtml(copy.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.mint};padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:${EMAIL_BRAND.white};border-radius:16px;border:1px solid ${EMAIL_BRAND.border};overflow:hidden;">
          ${bannerBlock}
          <tr>
            <td style="padding:24px 28px 8px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <img src="${logoSrc}" width="48" height="48" alt="McBuleli" style="display:block;border:0;border-radius:50%;background:#fff;padding:2px;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:18px;font-weight:800;color:${EMAIL_BRAND.primary};letter-spacing:-0.02em;">McBuleli</p>
                    <p style="margin:2px 0 0;font-size:11px;color:${EMAIL_BRAND.muted};">${tagline}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;">
              <p style="margin:0 0 12px;font-size:14px;color:${EMAIL_BRAND.muted};">${greeting}</p>
              <h1 style="margin:0 0 14px;font-size:22px;line-height:1.25;font-weight:700;color:${EMAIL_BRAND.text};">${escHtml(copy.headline)}</h1>
              ${paragraphsHtml(copy.paragraphs)}
              ${dateBlock}
            </td>
          </tr>
          ${heroBlock}
          <tr>
            <td style="padding:0 28px 0;">
              ${featuresBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 8px;text-align:center;">
              ${reassuranceBlock}
              <a href="${href}" style="display:inline-block;background:${EMAIL_BRAND.primary};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:12px;">${escHtml(copy.ctaLabel)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 24px;border-top:1px solid ${EMAIL_BRAND.border};text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:${EMAIL_BRAND.muted};">
                <a href="mailto:${EMAIL_FOOTER.supportEmail}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${EMAIL_FOOTER.supportEmail}</a>
                · <a href="${EMAIL_FOOTER.whatsApp}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${waLabel}</a>
              </p>
              <p style="margin:0;font-size:11px;color:${EMAIL_BRAND.muted};">© ${year} McBuleli · ${rights}</p>
              ${unsubscribe}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Plain-text version for Resend multipart / previews. */
export function renderMarketingBroadcastText(args: RenderMarketingEmailArgs): string {
  const { copy, locale, resendAudience = true } = args;
  const greeting = resendAudience
    ? locale === "fr"
      ? "Bonjour {{{contact.first_name|ami}}},"
      : "Hi {{{contact.first_name|there}}},"
    : locale === "fr"
      ? "Bonjour,"
      : "Hi,";

  const featureLines =
    copy.features?.flatMap((f) => [`${f.title} — ${f.text}`, ""]) ?? [];

  const lines = [
    "McBuleli",
    copy.preheader,
    "",
    greeting,
    "",
    copy.headline,
    "",
    ...copy.paragraphs,
    "",
    ...featureLines,
    ...(copy.bullets?.map((b) => `• ${b}`) ?? []),
    ...(copy.dateHighlight ? ["", copy.dateHighlight, ""] : []),
    "",
    copy.reassurance ?? "",
    "",
    `${copy.ctaLabel}: ${copy.ctaHref}`,
    "",
    EMAIL_FOOTER.supportEmail,
  ];
  if (resendAudience) {
    lines.push("", locale === "fr" ? "Se désabonner: {{{RESEND_UNSUBSCRIBE_URL}}}" : "Unsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}");
  }
  return lines.filter((l) => l !== undefined && l !== "").join("\n");
}

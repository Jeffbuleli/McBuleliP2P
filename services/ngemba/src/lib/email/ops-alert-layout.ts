import {
  NGEMBA_EMAIL_ASSETS,
  NGEMBA_EMAIL_BRAND as B,
} from "@/lib/email/brand";

export type OpsEmailDetailRow = { label: string; value: string };

export type OpsEmailTone = "critical" | "high" | "info" | "neutral";

const TONE_ACCENT: Record<OpsEmailTone, string> = {
  critical: B.urgent,
  high: "#c45c26",
  info: B.teal,
  neutral: B.primary,
};

const TONE_BADGE_BG: Record<OpsEmailTone, string> = {
  critical: "rgba(196, 30, 58, 0.12)",
  high: "rgba(196, 92, 38, 0.12)",
  info: "rgba(0, 64, 76, 0.10)",
  neutral: "rgba(6, 64, 43, 0.10)",
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderDetailsTable(rows: OpsEmailDetailRow[]): string {
  if (!rows.length) return "";
  const cells = rows
    .map((row, i) => {
      const border =
        i < rows.length - 1 ? `border-bottom:1px solid ${B.border};` : "";
      return `<tr>
      <td style="padding:10px 0;${border}font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:${B.muted};vertical-align:top;width:34%;">${esc(row.label)}</td>
      <td style="padding:10px 0;${border}font-size:14px;color:${B.text};font-weight:600;line-height:1.45;word-break:break-word;">${esc(row.value)}</td>
    </tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${cells}</table>`;
}

export type OpsAlertEmailArgs = {
  title: string;
  preheader: string;
  greeting?: string;
  body: string;
  /** Accent bar + badge color */
  tone?: OpsEmailTone;
  /** Short badge e.g. Critique / Escalade */
  badge?: string;
  messageExcerpt?: string;
  summary?: string;
  actionUrl?: string;
  cta?: string;
  detailRows?: OpsEmailDetailRow[];
  partnerLine?: string;
  /** Extra footer line (ops note) */
  footerNote?: string;
  /** Optional secondary CTA (plain link) */
  secondaryUrl?: string;
  secondaryLabel?: string;
};

/** Layout unique emails OPS (alerte, escalade, recover, proches). */
export function renderOpsAlertEmail(args: OpsAlertEmailArgs): {
  html: string;
  text: string;
} {
  const year = new Date().getFullYear();
  const tone: OpsEmailTone = args.tone ?? "neutral";
  const accent = TONE_ACCENT[tone];
  const badgeBg = TONE_BADGE_BG[tone];
  const details = args.detailRows ?? [];
  const greeting = args.greeting ?? "Bonjour,";

  const badgeBlock = args.badge
    ? `<span style="display:inline-block;margin:0 0 12px;padding:5px 10px;border-radius:999px;background:${badgeBg};color:${accent};font-size:11px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;">${esc(args.badge)}</span>`
    : "";

  const partnerBlock = args.partnerLine
    ? `<p style="margin:0 0 10px;font-size:12px;line-height:1.45;color:${B.muted};">${esc(args.partnerLine)}</p>`
    : "";

  const footerNoteBlock = args.footerNote
    ? `<p style="margin:0 0 10px;font-size:12px;line-height:1.45;color:${B.muted};">${esc(args.footerNote)}</p>`
    : "";

  const detailsBlock = details.length
    ? `<tr>
            <td style="padding:8px 26px 8px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${B.mint};border:1px solid ${B.border};border-radius:14px;overflow:hidden;">
                <tr>
                  <td style="padding:14px 18px 6px;">
                    <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${B.primary};">Fiche rapide</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 18px 12px;">
                    ${renderDetailsTable(details)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
    : "";

  const messageBlock = args.messageExcerpt
    ? `<tr>
            <td style="padding:8px 26px 8px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${B.muted};">Message citoyen</p>
              <p style="margin:0;font-size:14px;line-height:1.55;color:${B.text};background:${B.white};padding:14px 16px;border-radius:12px;border:1px solid ${B.border};">${esc(args.messageExcerpt).replace(/\n/g, "<br>")}</p>
              ${
                args.summary
                  ? `<p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:${B.muted};"><strong style="color:${B.primary};">Ngemba IA</strong> (aide au triage — décision humaine) : ${esc(args.summary)}</p>`
                  : ""
              }
            </td>
          </tr>`
    : args.summary
      ? `<tr>
            <td style="padding:8px 26px 8px;">
              <p style="margin:0;font-size:13px;line-height:1.5;color:${B.muted};"><strong style="color:${B.primary};">Ngemba IA</strong> : ${esc(args.summary)}</p>
            </td>
          </tr>`
      : "";

  const ctaBlock =
    args.actionUrl && args.cta
      ? `<tr>
            <td style="padding:16px 26px 8px;text-align:center;">
              <a href="${esc(args.actionUrl)}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 26px;border-radius:12px;">${esc(args.cta)}</a>
              ${
                args.secondaryUrl && args.secondaryLabel
                  ? `<p style="margin:12px 0 0;font-size:12px;"><a href="${esc(args.secondaryUrl)}" style="color:${B.primary};font-weight:600;text-decoration:none;">${esc(args.secondaryLabel)}</a></p>`
                  : ""
              }
            </td>
          </tr>`
      : "";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${esc(args.title)}</title>
</head>
<body style="margin:0;padding:0;background:${B.mint};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(args.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${B.mint};padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:${B.white};border-radius:16px;border:1px solid ${B.border};overflow:hidden;">
          <tr>
            <td style="height:4px;line-height:4px;font-size:0;background:${accent};">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:20px 26px 12px;border-bottom:1px solid ${B.border};">
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;width:52px;">
                    <img src="${NGEMBA_EMAIL_ASSETS.logo}" width="48" height="48" alt="NGEMBA" style="display:block;border:0;border-radius:12px;background:#fff;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:17px;font-weight:800;color:${B.primary};letter-spacing:-0.02em;">NGEMBA OPS</p>
                    <p style="margin:2px 0 0;font-size:12px;color:${B.muted};">Alerte citoyenne · orientation humaine</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 26px 8px;">
              ${badgeBlock}
              <p style="margin:0 0 10px;font-size:15px;line-height:1.5;color:${B.text};font-weight:600;">${esc(greeting)}</p>
              <h1 style="margin:0 0 10px;font-size:22px;line-height:1.25;font-weight:800;color:${B.text};">${esc(args.title)}</h1>
              <p style="margin:0;font-size:15px;line-height:1.55;color:${B.muted};">${esc(args.body)}</p>
            </td>
          </tr>
          ${detailsBlock}
          ${messageBlock}
          ${ctaBlock}
          <tr>
            <td style="padding:18px 26px 22px;border-top:1px solid ${B.border};background:${B.mint};text-align:center;">
              ${partnerBlock}
              ${footerNoteBlock}
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 10px;">
                <tr>
                  <td style="vertical-align:middle;padding-right:8px;">
                    <img src="${NGEMBA_EMAIL_ASSETS.logo}" width="26" height="26" alt="" style="display:block;border:0;border-radius:8px;" />
                  </td>
                  <td style="vertical-align:middle;text-align:left;">
                    <p style="margin:0;font-size:13px;font-weight:800;color:${B.primary};">Ngemba</p>
                    <p style="margin:1px 0 0;font-size:11px;color:${B.muted};">Paix · Sécurité citoyenne</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:${B.muted};">
                Support <a href="mailto:${NGEMBA_EMAIL_ASSETS.supportEmail}" style="color:${B.primary};text-decoration:none;font-weight:600;">${NGEMBA_EMAIL_ASSETS.supportEmail}</a>
                · +243 997 366 736 · +243 860 218 521 ·
                <a href="https://wa.me/message/IF6DXNT6Q2VSI1" style="color:${B.primary};text-decoration:none;font-weight:600;">WhatsApp</a>
              </p>
              <p style="margin:0 0 4px;font-size:11px;line-height:1.45;color:${B.muted};">
                <a href="${NGEMBA_EMAIL_ASSETS.site}" style="color:${B.muted};text-decoration:none;">${NGEMBA_EMAIL_ASSETS.site}</a>
              </p>
              <p style="margin:0;font-size:11px;line-height:1.45;color:${B.muted};">
                © ${year} McBuleli · RCCM CD/KNG/RCCM/26-A-00382 · NIF G2660507E
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    "NGEMBA OPS",
    args.badge ? `[${args.badge}]` : "",
    args.title,
    "",
    greeting,
    args.body,
    "",
    ...details.map((r) => `${r.label}: ${r.value}`),
    "",
    args.messageExcerpt ? `Message citoyen:\n${args.messageExcerpt}` : "",
    args.summary ? `Ngemba IA: ${args.summary}` : "",
    "",
    args.actionUrl && args.cta ? `${args.cta}: ${args.actionUrl}` : "",
    args.secondaryUrl && args.secondaryLabel
      ? `${args.secondaryLabel}: ${args.secondaryUrl}`
      : "",
    args.partnerLine ?? "",
    args.footerNote ?? "",
    "",
    `Support: ${NGEMBA_EMAIL_ASSETS.supportEmail}`,
    NGEMBA_EMAIL_ASSETS.site,
    "Ngemba · Paix · Sécurité citoyenne",
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { html, text };
}

export function toneFromUrgency(urgency: string): OpsEmailTone {
  const u = urgency.toLowerCase();
  if (u === "critical") return "critical";
  if (u === "high") return "high";
  if (u === "info" || u === "low") return "info";
  return "neutral";
}

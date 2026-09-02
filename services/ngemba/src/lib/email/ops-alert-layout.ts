import {
  NGEMBA_EMAIL_ASSETS,
  NGEMBA_EMAIL_BRAND as B,
} from "@/lib/email/brand";

export type OpsEmailDetailRow = { label: string; value: string };

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderDetailsTable(rows: OpsEmailDetailRow[]): string {
  const cells = rows
    .map((row, i) => {
      const border =
        i < rows.length - 1 ? `border-bottom:1px solid ${B.border};` : "";
      return `<tr>
      <td style="padding:11px 0;${border}font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${B.muted};vertical-align:top;width:38%;">${esc(row.label)}</td>
      <td style="padding:11px 0;${border}font-size:14px;color:${B.text};font-weight:700;line-height:1.35;word-break:break-word;">${esc(row.value)}</td>
    </tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 auto;max-width:380px;">${cells}</table>`;
}

export type OpsAlertEmailArgs = {
  title: string;
  preheader: string;
  greeting: string;
  body: string;
  messageExcerpt: string;
  summary: string;
  actionUrl: string;
  cta: string;
  detailRows: OpsEmailDetailRow[];
  partnerLine?: string;
};

export function renderOpsAlertEmail(args: OpsAlertEmailArgs): {
  html: string;
  text: string;
} {
  const year = new Date().getFullYear();
  const partnerBlock = args.partnerLine
    ? `<p style="margin:0 0 8px;font-size:12px;color:${B.muted};">${esc(args.partnerLine)}</p>`
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
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${B.mint};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:${B.white};border-radius:20px;overflow:hidden;border:1px solid ${B.border};">
          <tr>
            <td style="padding:24px 28px 8px;text-align:center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <img src="${NGEMBA_EMAIL_ASSETS.logo}" width="56" height="56" alt="NGEMBA" style="display:block;border:0;border-radius:12px;" />
                  </td>
                  <td style="vertical-align:middle;text-align:left;">
                    <p style="margin:0;font-size:20px;font-weight:800;color:${B.primary};letter-spacing:-0.02em;">NGEMBA</p>
                    <p style="margin:2px 0 0;font-size:11px;color:${B.muted};">Sécurité · Paix citoyenne</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;text-align:center;">
              <img src="${NGEMBA_EMAIL_ASSETS.illustration}" width="200" height="200" alt="" style="display:block;margin:0 auto;border:0;max-width:200px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 8px;text-align:center;">
              <h1 style="margin:0;font-size:22px;line-height:1.25;font-weight:700;color:${B.text};">${esc(args.title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 8px;text-align:center;">
              <p style="margin:0 0 8px;font-size:15px;line-height:1.5;color:${B.text};font-weight:600;">${esc(args.greeting)}</p>
              <p style="margin:0;font-size:15px;line-height:1.5;color:${B.muted};">${esc(args.body)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 12px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${B.white};border:1px solid ${B.border};border-radius:16px;overflow:hidden;">
                <tr>
                  <td style="padding:14px 18px 6px;background:${B.mint};border-bottom:1px solid ${B.border};">
                    <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${B.primary};">Détails de l'alerte</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 18px 8px;background:${B.white};">
                    ${renderDetailsTable(args.detailRows)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:4px 32px 8px;text-align:left;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${B.muted};">Message citoyen</p>
              <p style="margin:0;font-size:14px;line-height:1.55;color:${B.text};background:${B.mint};padding:14px 16px;border-radius:12px;border:1px solid ${B.border};">${esc(args.messageExcerpt).replace(/\n/g, "<br>")}</p>
              <p style="margin:12px 0 0;font-size:13px;line-height:1.45;color:${B.muted};">${esc(args.summary)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;text-align:center;">
              <a href="${esc(args.actionUrl)}" style="display:inline-block;background:${B.primary};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:12px;">${esc(args.cta)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid ${B.border};text-align:center;">
              ${partnerBlock}
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 14px;">
                <tr>
                  <td style="vertical-align:middle;padding-right:8px;font-size:12px;color:${B.muted};">Powered by</td>
                  <td style="vertical-align:middle;padding-right:6px;">
                    <img src="${NGEMBA_EMAIL_ASSETS.logo}" width="22" height="22" alt="" style="display:block;border:0;border-radius:50%;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:13px;font-weight:800;color:${B.primary};">McBuleli IA</span>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:${B.text};">NGEMBA · Cyber Alert RDC</p>
              <p style="margin:0 0 8px;font-size:12px;color:${B.muted};">
                Support : <a href="mailto:${NGEMBA_EMAIL_ASSETS.supportEmail}" style="color:${B.primary};text-decoration:none;font-weight:600;">${NGEMBA_EMAIL_ASSETS.supportEmail}</a>
              </p>
              <p style="margin:0;font-size:11px;color:${B.muted};">© ${year} McBuleli · Tous droits réservés.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    "NGEMBA",
    args.title,
    "",
    args.greeting,
    args.body,
    "",
    ...args.detailRows.map((r) => `${r.label}: ${r.value}`),
    "",
    "Message citoyen:",
    args.messageExcerpt,
    "",
    args.summary,
    "",
    `${args.cta}: ${args.actionUrl}`,
    args.partnerLine ?? "",
    "",
    `Support: ${NGEMBA_EMAIL_ASSETS.supportEmail}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { html, text };
}

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
        i < rows.length - 1 ? `border-bottom:1px solid #d6d3d1;` : "";
      return `<tr>
      <td style="padding:10px 0;${border}font-size:11px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:${B.muted};vertical-align:top;width:34%;">${esc(row.label)}</td>
      <td style="padding:10px 0;${border}font-size:14px;color:${B.text};font-weight:700;line-height:1.4;word-break:break-word;">${esc(row.value)}</td>
    </tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${cells}</table>`;
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

/** Layout alerte OPS — branding Ngemba IA. */
export function renderOpsAlertEmail(args: OpsAlertEmailArgs): {
  html: string;
  text: string;
} {
  const year = new Date().getFullYear();
  const partnerBlock = args.partnerLine
    ? `<p style="margin:0 0 10px;font-size:12px;line-height:1.45;color:${B.muted};">${esc(args.partnerLine)}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${esc(args.title)}</title>
</head>
<body style="margin:0;padding:0;background:#e6f2ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(args.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#e6f2ec;padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #d6d3d1;overflow:hidden;">
          <tr>
            <td style="padding:20px 26px 12px;border-bottom:1px solid #d6d3d1;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;width:52px;">
                    <img src="${NGEMBA_EMAIL_ASSETS.logo}" width="48" height="48" alt="NGEMBA" style="display:block;border:0;border-radius:12px;background:#fff;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:17px;font-weight:800;color:${B.primary};letter-spacing:-0.02em;">NGEMBA OPS</p>
                    <p style="margin:2px 0 0;font-size:12px;color:#57534e;">Alerte citoyenne · Ngemba IA</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 26px 8px;">
              <p style="margin:0 0 10px;font-size:15px;line-height:1.5;color:${B.text};font-weight:600;">${esc(args.greeting)}</p>
              <h1 style="margin:0 0 10px;font-size:22px;line-height:1.25;font-weight:800;color:${B.text};">${esc(args.title)}</h1>
              <p style="margin:0;font-size:15px;line-height:1.55;color:#57534e;">${esc(args.body)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 26px 8px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#e6f2ec;border:1px solid #d6d3d1;border-radius:14px;overflow:hidden;">
                <tr>
                  <td style="padding:14px 18px 6px;">
                    <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${B.primary};">Détails de l'alerte</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 18px 12px;">
                    ${renderDetailsTable(args.detailRows)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 26px 8px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${B.muted};">Message citoyen</p>
              <p style="margin:0;font-size:14px;line-height:1.55;color:${B.text};background:#ffffff;padding:14px 16px;border-radius:12px;border:1px solid #d6d3d1;">${esc(args.messageExcerpt).replace(/\n/g, "<br>")}</p>
              ${
                args.summary
                  ? `<p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:#57534e;"><strong style="color:${B.primary};">Ngemba IA :</strong> ${esc(args.summary)}</p>`
                  : ""
              }
            </td>
          </tr>
          <tr>
            <td style="padding:16px 26px 22px;text-align:center;">
              <a href="${esc(args.actionUrl)}" style="display:inline-block;background:${B.primary};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 26px;border-radius:12px;">${esc(args.cta)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 26px 22px;border-top:1px solid #d6d3d1;background:#e6f2ec;text-align:center;">
              ${partnerBlock}
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 10px;">
                <tr>
                  <td style="vertical-align:middle;padding-right:8px;">
                    <img src="${NGEMBA_EMAIL_ASSETS.logo}" width="26" height="26" alt="" style="display:block;border:0;border-radius:8px;" />
                  </td>
                  <td style="vertical-align:middle;text-align:left;">
                    <p style="margin:0;font-size:13px;font-weight:800;color:${B.primary};">Ngemba IA</p>
                    <p style="margin:1px 0 0;font-size:11px;color:#57534e;">Sécurité - Paix</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:#57534e;">
                Support <a href="mailto:${NGEMBA_EMAIL_ASSETS.supportEmail}" style="color:#305f33;text-decoration:none;font-weight:600;">${NGEMBA_EMAIL_ASSETS.supportEmail}</a>
              </p>
              <p style="margin:0;font-size:11px;line-height:1.45;color:#57534e;">
                © ${year} McBuleli · RCCM : CD/KNG/RCCM/26-A-00382 · ID Nat. / NIF : G2660507E
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
    args.summary ? `Ngemba IA: ${args.summary}` : "",
    "",
    `${args.cta}: ${args.actionUrl}`,
    args.partnerLine ?? "",
    "",
    `Support: ${NGEMBA_EMAIL_ASSETS.supportEmail}`,
    "Ngemba IA · Sécurité - Paix",
  ]
    .filter(Boolean)
    .join("\n");

  return { html, text };
}

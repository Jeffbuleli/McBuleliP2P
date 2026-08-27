/**
 * Welcome + door badge + clear day programme for a confirmed partner.
 * Signature: Mme Patty B. (same polish as guest welcome ticket).
 */
import { EMAIL_BRAND } from "@/lib/email/config";
import { renderHackathonTicketQrCardHtml } from "@/lib/email/messages/hackathon";
import { HACKATHON_VENUE_SILIKIN } from "@/lib/hackathon/constants";
import {
  HACKATHON_DATES_LABEL_FR,
  HACKATHON_HOURS_LABEL_FR,
  HACKATHON_VENUE_SHORT,
} from "@/lib/hackathon/event-content";
import { HACKATHON_PRACTICAL_SECTIONS } from "@/lib/hackathon/practical-info";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

const RCCM = "CD/KNG/RCCM/26-A-00382";
const LOGIN_URL = "https://mcbuleli.org/login";
const FORGOT_URL = "https://mcbuleli.org/forgot-password";
const CHAT_URL = "https://mcbuleli.org/hackathon/chat";

export type PartnerWelcomeBadgeArgs = {
  firstName: string;
  lastName: string;
  email: string;
  orgName: string;
  roleLabel: string;
  ticketCode: string;
  ticketUrl: string;
  /** Optional courtesy title, e.g. "Mr" */
  title?: string;
  /** e.g. "10h10 - 10h20 · Agro · Sponsor Or" */
  talkSlotFr?: string;
  entitlements?: string[];
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function listCard(title: string, items: string[]): string {
  const rows = items
    .map(
      (item, i) => `<tr>
      <td style="padding:9px 12px;${i < items.length - 1 ? `border-bottom:1px solid ${EMAIL_BRAND.border};` : ""}font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
        <span style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:8px;background:${EMAIL_BRAND.mint};color:${EMAIL_BRAND.primary};font-size:11px;font-weight:800;margin-right:8px;">${i + 1}</span>${esc(item)}
      </td>
    </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 14px;background:${EMAIL_BRAND.white};border:1px solid ${EMAIL_BRAND.border};border-radius:14px;overflow:hidden;">
  <tr>
    <td style="padding:12px 16px 6px;background:${EMAIL_BRAND.mint};border-bottom:1px solid ${EMAIL_BRAND.border};">
      <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${EMAIL_BRAND.primary};">${esc(title)}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:6px 8px 10px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table>
    </td>
  </tr>
</table>`;
}

export function buildPartnerWelcomeBadgeEmail(args: PartnerWelcomeBadgeArgs): {
  subject: string;
  html: string;
  text: string;
} {
  const title = args.title?.trim() || "Mr";
  const fullName = `${args.firstName} ${args.lastName}`.trim();
  const greeting = `Bonjour ${title} ${args.firstName},`;
  const subject = `Bienvenue · badge partenaire & programme · McBuleli Hackathon`;
  const venueFull = `${HACKATHON_VENUE_SILIKIN}, Gombe, Kinshasa, République Démocratique du Congo`;
  const whenWhere = HACKATHON_PRACTICAL_SECTIONS.find((s) => s.id === "when-where");
  const dayFlow = HACKATHON_PRACTICAL_SECTIONS.find((s) => s.id === "day-flow");
  const bring = HACKATHON_PRACTICAL_SECTIONS.find((s) => s.id === "bring");
  const year = new Date().getFullYear();
  const entitlements = args.entitlements?.length
    ? args.entitlements
    : [args.roleLabel];

  const qrCard = renderHackathonTicketQrCardHtml({
    ticketUrl: args.ticketUrl,
    ticketCode: args.ticketCode,
    isFr: true,
    heading: "Votre badge partenaire QR",
    hint: "Présentez ce QR (ou le code) à l'entrée du Silikin Village. Valable toute la journée du 28 août.",
  });

  const accessSteps = [
    `Connectez-vous avec ${args.email} : ${LOGIN_URL}`,
    `Si vous n'avez pas encore de mot de passe : ${FORGOT_URL} (même email) → créez-en un`,
    `Ouvrez votre badge : ${args.ticketUrl}`,
    `Espace partenaires (chat & préparation) : ${CHAT_URL}`,
  ];

  const text = `${greeting}

Bienvenue au McBuleli Hackathon — partenariat confirmé.

Organisation : ${args.orgName}
Contact : ${fullName}
Email : ${args.email}
Rôle : ${args.roleLabel}
${args.talkSlotFr ? `Créneau scène : ${args.talkSlotFr}` : ""}

Code badge : ${args.ticketCode}
Lien badge : ${args.ticketUrl}

DATE & LIEU
${HACKATHON_DATES_LABEL_FR} · ${HACKATHON_HOURS_LABEL_FR}
${venueFull}
${HACKATHON_VENUE_SHORT} — hub d'innovation

PROGRAMME
${(dayFlow?.itemsFr ?? []).map((x, i) => `${i + 1}. ${x}`).join("\n")}

CE QUI VOUS REVIENT
${entitlements.map((x) => `• ${x}`).join("\n")}

CONNEXION (compte McBuleli)
${accessSteps.map((x, i) => `${i + 1}. ${x}`).join("\n")}

À APPORTER
${(bring?.itemsFr ?? []).map((x) => `• ${x}`).join("\n")}

Sécurité : seul un compte McBuleli connecté avec ${args.email} peut ouvrir ce badge.

Au plaisir de vous accueillir.
Cordialement,

Mme Patty B.
McBuleli Team
${SUPPORT_EMAIL}
${SUPPORT_PHONES_DISPLAY}
WhatsApp : ${SUPPORT_WA_PATH}

© ${year} McBuleli
`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.mint};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Bienvenue ${esc(args.orgName)} · badge ${esc(args.ticketCode)} · programme 28 août · Silikin Village.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.mint};padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:${EMAIL_BRAND.white};border-radius:16px;border:1px solid ${EMAIL_BRAND.border};overflow:hidden;">
          <tr>
            <td style="padding:0;line-height:0;">
              <img src="https://mcbuleli.org/hackathon/kinshasa-skyline.jpg" width="560" alt="McBuleli Hackathon Kinshasa" style="display:block;width:100%;max-width:560px;height:auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:20px 26px 8px;border-bottom:1px solid ${EMAIL_BRAND.border};">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <img src="https://mcbuleli.org/brand/logo-256.png" width="44" height="44" alt="McBuleli" style="display:block;border:0;border-radius:50%;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:17px;font-weight:800;color:${EMAIL_BRAND.primary};letter-spacing:-0.02em;">McBuleli</p>
                    <p style="margin:2px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">Hackathon · Partenaire &amp; programme</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 26px 8px;">
              <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">${esc(greeting)}</p>
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;font-weight:800;color:${EMAIL_BRAND.text};">Bienvenue — partenariat confirmé</h1>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Voici votre <strong style="color:${EMAIL_BRAND.text};">badge partenaire</strong>,
                le <strong style="color:${EMAIL_BRAND.text};">programme en clair</strong> de la journée,
                et les étapes pour vous connecter sur McBuleli.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;background:${EMAIL_BRAND.mint};border-radius:12px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${EMAIL_BRAND.primary};">${esc(args.orgName)}</p>
                    <p style="margin:0;font-size:15px;font-weight:700;color:${EMAIL_BRAND.text};">${esc(fullName)}</p>
                    <p style="margin:6px 0 0;font-size:13px;color:${EMAIL_BRAND.muted};">${esc(args.email)}</p>
                    <p style="margin:8px 0 0;font-size:13px;line-height:1.45;color:${EMAIL_BRAND.text};">${esc(args.roleLabel)}</p>
                    ${
                      args.talkSlotFr
                        ? `<p style="margin:8px 0 0;font-size:13px;font-weight:700;color:${EMAIL_BRAND.primary};">Créneau scène : ${esc(args.talkSlotFr)}</p>`
                        : ""
                    }
                  </td>
                </tr>
              </table>
              ${qrCard}
              <div style="height:14px;font-size:0;line-height:0;">&nbsp;</div>
              ${listCard("Connexion McBuleli (important)", accessSteps)}
              ${listCard("Adresse complète du lieu", [
                venueFull,
                `${HACKATHON_DATES_LABEL_FR} · ${HACKATHON_HOURS_LABEL_FR}`,
                "Arrivée recommandée : 08h15 (badges & networking)",
                ...(whenWhere?.itemsFr.slice(2, 3) ?? []),
              ])}
              ${listCard("Programme Hackathon", dayFlow?.itemsFr ?? [])}
              ${listCard("Ce qui vous revient", entitlements)}
              ${listCard("À apporter", bring?.itemsFr ?? [])}
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:4px 0 10px;">
                <tr>
                  <td style="border-radius:12px;background:${EMAIL_BRAND.primary};">
                    <a href="${esc(args.ticketUrl)}" style="display:inline-block;padding:13px 24px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Ouvrir mon badge</a>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                <tr>
                  <td style="border-radius:12px;border:1px solid ${EMAIL_BRAND.border};background:${EMAIL_BRAND.white};">
                    <a href="${esc(FORGOT_URL)}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:700;color:${EMAIL_BRAND.primary};text-decoration:none;">Créer / réinitialiser mon mot de passe</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 16px;font-size:12px;line-height:1.5;color:${EMAIL_BRAND.muted};">
                Sécurité : seul un compte McBuleli connecté avec
                <strong style="color:${EMAIL_BRAND.text};">${esc(args.email)}</strong>
                peut ouvrir ce badge.
              </p>
              <p style="margin:0 0 6px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Au plaisir de vous accueillir.</p>
              <p style="margin:0 0 4px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Cordialement,</p>
              <p style="margin:0;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.text};">
                <strong>Mme Patty B.</strong><br />
                McBuleli Team<br />
                <a href="mailto:${esc(SUPPORT_EMAIL)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${esc(SUPPORT_EMAIL)}</a><br />
                ${esc(SUPPORT_PHONES_DISPLAY)}<br />
                <a href="${esc(SUPPORT_WA_PATH)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">WhatsApp</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 26px 22px;border-top:1px solid ${EMAIL_BRAND.border};text-align:center;">
              <p style="margin:0;font-size:11px;color:${EMAIL_BRAND.muted};">© ${year} McBuleli · RCCM : ${RCCM}</p>
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

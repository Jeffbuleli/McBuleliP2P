/**
 * Confirmation salle Silikin + logistique prête - invite à consulter /hackathon/chat.
 */
import { EMAIL_BRAND } from "@/lib/email/config";
import {
  HACKATHON_HOURS_COMPACT_FR,
  HACKATHON_VENUE_SHORT,
} from "@/lib/hackathon/event-content";
import { partnerDayBriefForSlug } from "@/lib/hackathon/partner-day-brief";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";
import {
  PARTNER_BUDGET_PITCH_RECIPIENTS,
  type PartnerBudgetPitchRecipient,
} from "@/lib/email/partnership/partner-budget-pitch-email";

export const PARTNER_CHAT_URL = "https://mcbuleli.org/hackathon/chat";

const DATE_FR = "28 août 2026";
const RCCM = "CD/KNG/RCCM/26-A-00382";

/** Actifs sur le Jour 1 (hors César / e-COM sans retour). */
const ACTIVE_SLUGS = new Set([
  "ilokwe",
  "rdpi",
  "kimia",
  "montana-pay",
  "bienv-photography",
  "kilelo",
  "tyts",
  "ia-academie-chk",
]);

export type PartnerVenueReadyRecipient = PartnerBudgetPitchRecipient;

export const PARTNER_VENUE_READY_RECIPIENTS: PartnerVenueReadyRecipient[] =
  PARTNER_BUDGET_PITCH_RECIPIENTS.filter((p) => ACTIVE_SLUGS.has(p.orgSlug));

export function findPartnerVenueReadyRecipient(
  idOrShort: string,
): PartnerVenueReadyRecipient | undefined {
  const key = idOrShort.trim().toLowerCase();
  return PARTNER_VENUE_READY_RECIPIENTS.find(
    (p) =>
      p.id === key ||
      p.shortName.toLowerCase() === key ||
      p.orgName.toLowerCase() === key ||
      p.orgSlug === key,
  );
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slotLine(orgSlug: string): string {
  const brief = partnerDayBriefForSlug(orgSlug);
  const talk = brief.talk;
  if (talk?.status === "media_only" && talk.start) {
    return `Mise en place ${talk.start} - ${talk.end} - couverture photo/vidéo`;
  }
  if (talk?.start && talk.status === "confirmed") {
    return `Créneau scène ${talk.start} - ${talk.end} - ${talk.domainFr}`;
  }
  return "Détails dans votre espace chat";
}

export function buildPartnerVenueReadyEmail(
  partner: PartnerVenueReadyRecipient,
): { subject: string; html: string; text: string } {
  const slot = slotLine(partner.orgSlug);
  const subject = `McBuleli Hackathon × ${partner.shortName} - salle confirmée - ${DATE_FR}`;
  const whenWhere = `${DATE_FR} - ${HACKATHON_VENUE_SHORT} - ${HACKATHON_HOURS_COMPACT_FR}`;
  const year = new Date().getFullYear();

  const text = `${partner.greeting}

Bonne nouvelle : la location de salle au ${HACKATHON_VENUE_SHORT} est confirmée pour le ${DATE_FR}. La logistique Jour 1 est en place.

${whenWhere}
${slot}

Merci de vous préparer pour cette journée, et de consulter votre tableau de chat pour votre créneau et la checklist :
${PARTNER_CHAT_URL}

La confirmation Silikin est en pièce jointe.

Cordialement,
Mme Patty B.
McBuleli Team
${SUPPORT_EMAIL}
${SUPPORT_PHONES_DISPLAY}
WhatsApp : ${SUPPORT_WA_PATH}

© ${year} McBuleli - RCCM : ${RCCM}
${PARTNER_CHAT_URL}
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
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Salle Silikin confirmée - ${esc(partner.shortName)}.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.mint};padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:${EMAIL_BRAND.white};border-radius:16px;border:1px solid ${EMAIL_BRAND.border};overflow:hidden;">
          <tr>
            <td style="padding:20px 26px 10px;border-bottom:1px solid ${EMAIL_BRAND.border};">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <img src="https://mcbuleli.org/brand/logo-256.png" width="40" height="40" alt="McBuleli" style="display:block;border:0;border-radius:50%;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:16px;font-weight:800;color:${EMAIL_BRAND.primary};letter-spacing:-0.02em;">McBuleli</p>
                    <p style="margin:2px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">Hackathon - Salle &amp; logistique</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 26px 8px;">
              <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:${EMAIL_BRAND.text};">${esc(partner.greeting)}</p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Bonne nouvelle : la location de salle au
                <strong style="color:${EMAIL_BRAND.text};">${esc(HACKATHON_VENUE_SHORT)}</strong>
                est confirmée pour le
                <strong style="color:${EMAIL_BRAND.text};">${esc(DATE_FR)}</strong>.
                La logistique du Jour 1 est en place.
              </p>
              <p style="margin:0 0 6px;font-size:13px;color:${EMAIL_BRAND.muted};">${esc(whenWhere)}</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.55;font-weight:600;color:${EMAIL_BRAND.text};">${esc(slot)}</p>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Merci de vous préparer pour cette journée, et de consulter votre
                <strong style="color:${EMAIL_BRAND.text};">tableau de chat</strong>
                pour le détail de votre intervention et la checklist.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 16px;">
                <tr>
                  <td style="border-radius:10px;background:${EMAIL_BRAND.primary};">
                    <a href="${esc(PARTNER_CHAT_URL)}" style="display:inline-block;padding:12px 20px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
                      Ouvrir mon espace chat
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 18px;font-size:13px;line-height:1.5;color:${EMAIL_BRAND.muted};">
                Confirmation Silikin en pièce jointe.
              </p>
              <p style="margin:0 0 6px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Cordialement,</p>
              <p style="margin:0;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.text};">
                <strong>Mme Patty B.</strong><br />
                McBuleli Team<br />
                <a href="mailto:${esc(SUPPORT_EMAIL)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${esc(SUPPORT_EMAIL)}</a><br />
                ${esc(SUPPORT_PHONES_DISPLAY)}<br />
                WhatsApp :
                <a href="${esc(SUPPORT_WA_PATH)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">écrire sur WhatsApp</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 26px 24px;border-top:1px solid ${EMAIL_BRAND.border};text-align:center;">
              <p style="margin:0;font-size:11px;color:${EMAIL_BRAND.muted};">
                © ${year} McBuleli - RCCM : ${esc(RCCM)}<br />
                <a href="${esc(PARTNER_CHAT_URL)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">mcbuleli.org/hackathon/chat</a>
              </p>
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

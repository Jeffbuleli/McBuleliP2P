/**
 * Email court - budget transparent & pitch partenaires.
 * Le detail est sur /hackathon/budget ; l'email ne fait qu'ouvrir la porte.
 */
import { EMAIL_BRAND } from "@/lib/email/config";
import {
  HACKATHON_HOURS_COMPACT_FR,
  HACKATHON_VENUE_SHORT,
} from "@/lib/hackathon/event-content";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

export const PARTNER_BUDGET_URL = "https://mcbuleli.org/hackathon/budget";

/** Dates ASCII (pas de tiret long) pour emails. */
const DATES_FR = "28-29 août 2026";
const RCCM = "CD/KNG/RCCM/26-A-00382";

export type PartnerBudgetPitchRecipient = {
  id: string;
  orgSlug: string;
  orgName: string;
  shortName: string;
  to: string;
  cc?: string[];
  greeting: string;
  /** Une ligne sur mesure - pourquoi on leur parle. */
  hook: string;
};

/** Orgs budget (2 badges) - hors SanJa, Binance, Silikin, pawaPay. */
export const PARTNER_BUDGET_PITCH_RECIPIENTS: PartnerBudgetPitchRecipient[] = [
  {
    id: "ilokwe",
    orgSlug: "ilokwe",
    orgName: "ILOKWE GROUP",
    shortName: "ILOKWE",
    to: "ilokwegroup@gmail.com",
    greeting: "Bonjour l'équipe ILOKWE,",
    hook: "En tant que Sponsor Or (jury, talk agro & mentorat), votre présence compte pour la vitrine Demo Day.",
  },
  {
    id: "rdpi",
    orgSlug: "rdpi",
    orgName: "RDPI Think Tank",
    shortName: "RDPI",
    to: "info@rdpithinktank.org",
    cc: ["maristote@rdpithinktank.org"],
    greeting: "Bonjour Mr Aristote,",
    hook: "Votre talk policy & impact + regard jury donnent du sens socio-économique aux prototypes.",
  },
  {
    id: "kimia",
    orgSlug: "kimia",
    orgName: "KIMIA Service",
    shortName: "KIMIA",
    to: "kimiaservice896@gmail.com",
    greeting: "Bonjour Mr Mike,",
    hook: "Votre mentorat talents & employabilité relie les builders aux opportunités réelles.",
  },
  {
    id: "montana-pay",
    orgSlug: "montana-pay",
    orgName: "MontanaPay",
    shortName: "MontanaPay",
    to: "montanadelly7@gmail.com",
    greeting: "Bonjour la Direction de MontanaPay,",
    hook: "Votre talk FinTech / escrow montre comment sécuriser les paiements face aux équipes.",
  },
  {
    id: "bienv",
    orgSlug: "bienv-photography",
    orgName: "Bienv Photography",
    shortName: "Bienv",
    to: "bienvngonda862@gmail.com",
    greeting: "Bonjour Bienv,",
    hook: "Votre couverture photo & vidéo documente l'événement pour tout l'écosystème.",
  },
  {
    id: "kilelo",
    orgSlug: "kilelo",
    orgName: "Kilelo",
    shortName: "Kilelo",
    to: "support@kileloapp.com",
    greeting: "Bonjour Jeancy,",
    hook: "Votre talk marketplace (matching, confiance, avis) parle directement aux builders services.",
  },
  {
    id: "tyts",
    orgSlug: "tyts",
    orgName: "TYTS",
    shortName: "TYTS",
    to: "nsomoneaaron2@gmail.com",
    greeting: "Bonjour l'équipe TYTS,",
    hook: "Votre mentorat cyber / réseaux renforce la solidité technique des prototypes.",
  },
  {
    id: "ia-academie",
    orgSlug: "ia-academie-chk",
    orgName: "IA Académie / CHK",
    shortName: "IA Académie",
    to: "contact@ia-academie.cd",
    cc: ["contact@ch-kin.com"],
    greeting: "Bonjour l'équipe IA Académie / CHK,",
    hook: "Votre talk académique et le vivier apprenants nourrissent le pipeline builders.",
  },
  {
    id: "cesar-group",
    orgSlug: "cesar-group",
    orgName: "César Group",
    shortName: "César Group",
    to: "cesargrouprdc@gmail.com",
    cc: ["contact@cesargroup-rdc.com"],
    greeting: "Bonjour l'équipe César Group,",
    hook: "Votre talk formation & employabilité aide les équipes à pitcher et à se présenter.",
  },
  {
    id: "e-com-sas",
    orgSlug: "e-com-sas",
    orgName: "e-COM SAS",
    shortName: "e-COM SAS",
    to: "contact@e-comsas.com",
    cc: ["jean.andre@e-comsas.com"],
    greeting: "Bonjour l'équipe e-COM SAS,",
    hook: "Votre talk e-paiement / FinTech ancre les prototypes dans l'infrastructure réelle.",
  },
];

export function findPartnerBudgetPitchRecipient(
  idOrShort: string,
): PartnerBudgetPitchRecipient | undefined {
  const key = idOrShort.trim().toLowerCase();
  return PARTNER_BUDGET_PITCH_RECIPIENTS.find(
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

export function buildPartnerBudgetPitchEmail(
  partner: PartnerBudgetPitchRecipient,
): { subject: string; html: string; text: string } {
  const subject = `McBuleli Hackathon × ${partner.shortName} - budget transparent`;
  const whenWhere = `${DATES_FR} · ${HACKATHON_VENUE_SHORT} · ${HACKATHON_HOURS_COMPACT_FR}`;
  const year = new Date().getFullYear();

  const text = `${partner.greeting}

${partner.hook}

Nous avons publié le budget transparent du Hackathon (${whenWhere}) : salle, repas, pauses, media, marketing - et ce que vous avez déjà en tant que partenaires (badges, Talk, Vibe Coding, piste Partner → Builder).

Tout est ici (court à lire, chiffres clairs) :
${PARTNER_BUDGET_URL}

Si vous pouvez soutenir une ligne du budget (même partielle), répondez à cet email - on calibre avec vous.

Merci,
L'équipe McBuleli
${SUPPORT_EMAIL}
${SUPPORT_PHONES_DISPLAY}
WhatsApp : ${SUPPORT_WA_PATH}

© ${year} McBuleli · RCCM : ${RCCM}
${PARTNER_BUDGET_URL}
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
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Budget transparent Hackathon - ${esc(partner.shortName)}.</div>
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
                    <p style="margin:2px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">Hackathon · Budget</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 26px 8px;">
              <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:${EMAIL_BRAND.text};">${esc(partner.greeting)}</p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">${esc(partner.hook)}</p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Nous avons publié le <strong style="color:${EMAIL_BRAND.text};">budget transparent</strong>
                (${esc(whenWhere)}) : salle, repas, pauses, media, marketing - et ce que vous avez déjà
                (badges, Talk, Vibe Coding, piste Partner → Builder).
              </p>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Tout est sur la page (court à lire, chiffres clairs).
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                <tr>
                  <td style="border-radius:10px;background:${EMAIL_BRAND.primary};">
                    <a href="${esc(PARTNER_BUDGET_URL)}" style="display:inline-block;padding:12px 20px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
                      Voir le budget
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 4px;font-size:13px;line-height:1.5;color:#78716c;">
                <a href="${esc(PARTNER_BUDGET_URL)}" style="color:${EMAIL_BRAND.primary};font-weight:600;">mcbuleli.org/hackathon/budget</a>
              </p>
              <p style="margin:14px 0 0;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Si vous pouvez soutenir une ligne (même partielle), répondez à cet email - on calibre avec vous.
              </p>
              <p style="margin:18px 0 6px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Merci,</p>
              <p style="margin:0;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.text};">
                <strong>L'équipe McBuleli</strong><br />
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
                © ${year} McBuleli · RCCM : ${esc(RCCM)}<br />
                <a href="${esc(PARTNER_BUDGET_URL)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">mcbuleli.org/hackathon/budget</a>
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

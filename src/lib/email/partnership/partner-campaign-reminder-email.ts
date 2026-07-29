/**
 * Rappel pré-campagne (1er août) — partenaires avec logo/info manquants
 * ou partenariat non encore confirmé.
 */
import { EMAIL_BRAND, partnershipPublicBaseUrl } from "@/lib/email/config";
import {
  HACKATHON_DATES_LABEL_FR,
  HACKATHON_HOURS_LABEL_FR,
  HACKATHON_VENUE_SHORT,
} from "@/lib/hackathon/event-content";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

export type PartnerCampaignReminder = {
  id: string;
  orgName: string;
  shortName: string;
  to: string;
  cc?: string[];
  greeting?: string;
  status: "confirmed" | "in_progress";
  needsLogo: boolean;
  needsConfirmation: boolean;
  /** Détails manquants spécifiques à l'org */
  missingInfo?: string[];
};

const CHAT = "https://mcbuleli.org/hackathon/chat";
const HACKATHON = "https://mcbuleli.org/hackathon";
const CAMPAIGN_START = "1er août 2026";

/** Partenaires à relancer avant le lancement de campagne. */
export const PARTNER_CAMPAIGN_REMINDERS: PartnerCampaignReminder[] = [
  {
    id: "silikin",
    orgName: "Silikin Village",
    shortName: "Silikin",
    to: "reception_skv@texaf-rdc.com",
    status: "in_progress",
    needsLogo: false,
    needsConfirmation: true,
    missingInfo: [
      "Confirmer l'accueil de l'événement les 28-29 août 2026",
      "Valider la coordination logistique sur site",
    ],
  },
  {
    id: "e-com-sas",
    orgName: "e-COM SAS",
    shortName: "e-COM SAS",
    to: "contact@e-comsas.com",
    cc: ["jean.andre@e-comsas.com"],
    status: "in_progress",
    needsLogo: true,
    needsConfirmation: true,
    missingInfo: [
      "Finaliser le niveau d'accréditation (atelier / mentorat / jury)",
      "Confirmer les contributions retenues dans l'espace partenaires",
    ],
  },
  {
    id: "cesar-group",
    orgName: "César Group",
    shortName: "César Group",
    to: "cesargrouprdc@gmail.com",
    cc: ["contact@cesargroup-rdc.com"],
    status: "in_progress",
    needsLogo: true,
    needsConfirmation: true,
    missingInfo: [
      "Finaliser le rôle (atelier / mentorat pitch / mobilité)",
      "Confirmer l'accréditation dans l'espace partenaires",
    ],
  },
  {
    id: "montana-pay",
    orgName: "MontanaPay",
    shortName: "MontanaPay",
    to: "montanadelly7@gmail.com",
    greeting: "Bonjour la Direction de MontanaPay,",
    status: "confirmed",
    needsLogo: true,
    needsConfirmation: false,
    missingInfo: [
      "Finaliser titre et créneau de la session escrow / FinTech",
      "Confirmer le mentorat marketplace / wallet",
    ],
  },
  {
    id: "tyts",
    orgName: "TYTS",
    shortName: "TYTS",
    to: "nsomoneaaron2@gmail.com",
    status: "confirmed",
    needsLogo: true,
    needsConfirmation: false,
    missingInfo: [
      "Valider les modalités mentorat cyber / réseaux",
      "Confirmer créneaux et regard jury technique si retenu",
    ],
  },
  {
    id: "ia-academie",
    orgName: "IA Académie / CHK",
    shortName: "IA Académie",
    to: "contact@ia-academie.cd",
    cc: ["contact@ch-kin.com"],
    status: "confirmed",
    needsLogo: false,
    needsConfirmation: false,
    missingInfo: [
      "Finaliser thème atelier / session(s) de mentorat",
      "Confirmer option participation jury",
    ],
  },
  {
    id: "bienv-photography",
    orgName: "Bienv Photography 243",
    shortName: "Bienv Photo",
    to: "bienvngonda862@gmail.com",
    status: "confirmed",
    needsLogo: true,
    needsConfirmation: false,
    missingInfo: ["Logo officiel pour la page hackathon (PNG/SVG fond transparent)"],
  },
];

export function findPartnerCampaignReminder(
  idOrShort: string,
): PartnerCampaignReminder | undefined {
  const key = idOrShort.trim().toLowerCase();
  return PARTNER_CAMPAIGN_REMINDERS.find(
    (p) =>
      p.id === key ||
      p.shortName.toLowerCase() === key ||
      p.orgName.toLowerCase() === key,
  );
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rowHtml(text: string, bg = EMAIL_BRAND.mint): string {
  return `<tr><td style="padding:8px 12px;background:${bg};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">${text}</td></tr><tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>`;
}

function buildActionItems(partner: PartnerCampaignReminder): string[] {
  const items: string[] = [];
  if (partner.needsLogo) {
    items.push(
      "Envoyer votre logo officiel (PNG ou SVG, fond transparent de préférence) — réponse à cet email ou via l'espace partenaires",
    );
  }
  if (partner.needsConfirmation) {
    items.push(
      "Confirmer officiellement votre partenariat et le rôle retenu (réponse email ou message dans l'espace partenaires)",
    );
  }
  for (const info of partner.missingInfo ?? []) {
    items.push(info);
  }
  items.push(
    "Compléter l'onglet Préparation dans l'espace partenaires (badges, to-do, 2e place collègue si applicable)",
  );
  return items;
}

export function buildPartnerCampaignReminderEmail(
  partner: PartnerCampaignReminder,
): { subject: string; html: string; text: string } {
  const greeting =
    partner.greeting?.trim() || `Bonjour ${partner.shortName},`;
  const actions = buildActionItems(partner);
  const subject =
    partner.needsConfirmation && partner.needsLogo
      ? `McBuleli Hackathon × ${partner.shortName} — logo, confirmation & campagne du ${CAMPAIGN_START}`
      : partner.needsConfirmation
        ? `McBuleli Hackathon × ${partner.shortName} — confirmation partenariat avant le ${CAMPAIGN_START}`
        : `McBuleli Hackathon × ${partner.shortName} — logo & infos avant campagne du ${CAMPAIGN_START}`;

  const intro =
    partner.needsConfirmation && partner.needsLogo
      ? `Nous lançons la campagne d'inscription le ${CAMPAIGN_START}. Avant cette date, nous avons besoin de votre logo et de la confirmation de votre partenariat pour vous afficher correctement sur nos supports.`
      : partner.needsConfirmation
        ? `Nous lançons la campagne d'inscription le ${CAMPAIGN_START}. Merci de confirmer votre partenariat d'ici là pour finaliser votre visibilité et votre accès opérationnel.`
        : `Nous lançons la campagne d'inscription le ${CAMPAIGN_START}. Il nous manque encore quelques éléments de votre côté pour vous afficher correctement sur la page hackathon et préparer l'événement.`;

  const actionLines = actions.map((a) => `- ${a}`).join("\n");
  const text = [
    greeting,
    "",
    intro,
    "",
    `Événement : ${HACKATHON_DATES_LABEL_FR}, ${HACKATHON_HOURS_LABEL_FR} · ${HACKATHON_VENUE_SHORT}, Kinshasa`,
    "",
    "ACTIONS ATTENDUES AVANT LE 1ER AOÛT",
    actionLines,
    "",
    `Espace partenaires : ${CHAT}`,
    `Page hackathon : ${HACKATHON}`,
    "",
    "Connectez-vous avec l'email principal de votre organisation pour accéder à votre espace.",
    "",
    `Contact : ${SUPPORT_EMAIL} | ${SUPPORT_PHONES_DISPLAY}`,
    `WhatsApp : ${SUPPORT_WA_PATH}`,
    "",
    "Cordialement,",
    "McBuleli Team",
  ].join("\n");

  const actionRows = actions.map((a) => rowHtml(esc(a))).join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.mint};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Campagne ${CAMPAIGN_START} — logo, confirmation et espace partenaires.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.mint};padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid ${EMAIL_BRAND.border};overflow:hidden;">
          <tr>
            <td style="padding:22px 28px 8px;border-bottom:1px solid ${EMAIL_BRAND.border};">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <img src="https://mcbuleli.org/brand/logo-256.png" width="44" height="44" alt="McBuleli" style="display:block;border:0;border-radius:50%;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:17px;font-weight:800;color:${EMAIL_BRAND.primary};letter-spacing:-0.02em;">McBuleli Hackathon</p>
                    <p style="margin:2px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">Rappel pré-campagne</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">${esc(greeting)}</p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">${esc(intro)}</p>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                <strong style="color:${EMAIL_BRAND.text};">${esc(HACKATHON_DATES_LABEL_FR)}</strong>,
                ${esc(HACKATHON_HOURS_LABEL_FR)} · ${esc(HACKATHON_VENUE_SHORT)}, Kinshasa
              </p>
              ${
                partner.status === "in_progress"
                  ? `<p style="margin:0 0 14px;padding:10px 14px;background:#fef3c7;border-radius:10px;font-size:13px;line-height:1.5;color:#92400e;">Statut actuel : <strong>partenariat en discussion</strong> — merci de confirmer pour figurer dans la campagne.</p>`
                  : ""
              }
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 4px;">
              <p style="margin:0 0 10px;font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_BRAND.text};">Actions avant le ${esc(CAMPAIGN_START)}</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${actionRows}</table>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 28px 8px;text-align:center;">
              <a href="${esc(CHAT)}" style="display:inline-block;padding:12px 22px;border-radius:10px;background:${EMAIL_BRAND.primary};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Ouvrir l'espace partenaires</a>
              <p style="margin:10px 0 0;font-size:12px;line-height:1.5;color:${EMAIL_BRAND.muted};">
                <a href="${esc(HACKATHON)}" style="color:${EMAIL_BRAND.primary};text-decoration:underline;">mcbuleli.org/hackathon</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 22px;font-size:13px;line-height:1.55;color:${EMAIL_BRAND.muted};">
              Connectez-vous avec l'email principal de votre organisation.
              Questions :
              <a href="mailto:${SUPPORT_EMAIL}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${SUPPORT_EMAIL}</a>
              - ${esc(SUPPORT_PHONES_DISPLAY)} -
              <a href="${esc(SUPPORT_WA_PATH)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">WhatsApp</a>
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

/**
 * Formation nov26 · campagne leads hackathon (1:1).
 * Français · tirets "-" · signature Mme Patty B. · CTA mcbuleli.com/nov26
 */

import {
  NOV26_DATES_LABEL_FR,
  NOV26_OUTCOMES,
  NOV26_OUTCOMES_INTRO_FR,
  NOV26_OUTCOMES_TITLE_FR,
  NOV26_PRICE_USD,
  NOV26_TIME_LABEL_FR,
  NOV26_TITLE_FR,
} from "@/lib/nov26/content";
import { EMAIL_BRAND, logoUrl } from "@/lib/email/config";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";
import { isCompanyStyleLead } from "./lead-outreach-exclude";
import {
  MCBULELI_RCCM,
  renderPartnershipText,
  type LeadPersonalizeInput,
  type PersonalizedEmail,
} from "./lead-personalize";
import type { HackathonLeadSegment } from "./types";

const POSTER_URL = "https://mcbuleli.com/events/nov26/affiche.png";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderNov26FormationHtml(args: {
  greeting: string;
  headline: string;
  preheader: string;
  paragraphs: string[];
  outcomesTitle: string;
  outcomesIntro: string;
  outcomes: string[];
  formatBullets: string[];
  ctaLabel: string;
  ctaHref: string;
  waHref: string;
  close: string;
  unsubscribeHref: string;
}): string {
  const year = new Date().getFullYear();
  const logoSrc = logoUrl();
  const paras = args.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${EMAIL_BRAND.muted};">${esc(p)}</p>`,
    )
    .join("");

  const bulletRows = args.formatBullets
    .map(
      (b) => `<tr>
        <td style="width:28px;vertical-align:top;padding:0 0 10px 0;">
          <span style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:50%;background:${EMAIL_BRAND.mint};color:${EMAIL_BRAND.primary};font-size:12px;font-weight:800;">✓</span>
        </td>
        <td style="vertical-align:top;padding:0 0 10px 0;font-size:14px;line-height:1.5;color:${EMAIL_BRAND.text};">${esc(b)}</td>
      </tr>`,
    )
    .join("");

  const outcomeRows = args.outcomes
    .map(
      (b) => `<tr>
        <td style="width:28px;vertical-align:top;padding:0 0 8px 0;">
          <span style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:50%;background:${EMAIL_BRAND.primary};color:#fff;font-size:11px;font-weight:800;">✓</span>
        </td>
        <td style="vertical-align:top;padding:0 0 8px 0;font-size:13px;line-height:1.45;color:${EMAIL_BRAND.text};">${esc(b)}</td>
      </tr>`,
    )
    .join("");

  const greetingLine = args.greeting
    ? `Bonjour ${esc(args.greeting)},`
    : "Bonjour,";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${esc(args.headline)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.mint};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(args.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.mint};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:${EMAIL_BRAND.white};border-radius:18px;border:1px solid ${EMAIL_BRAND.border};overflow:hidden;box-shadow:0 12px 40px -20px rgba(48,95,51,0.25);">
          <tr>
            <td style="padding:0;background:linear-gradient(135deg,#5c1830 0%,#7a2840 42%,#1F6B43 100%);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:20px 24px 8px;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:10px;">
                          <img src="${logoSrc}" width="44" height="44" alt="" style="display:block;border:0;border-radius:50%;background:#fff;padding:2px;" />
                        </td>
                        <td style="vertical-align:middle;">
                          <p style="margin:0;font-size:17px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">McBuleli</p>
                          <p style="margin:2px 0 0;font-size:11px;color:rgba(255,255,255,0.85);">Formation IA · En ligne · nov. 2026</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 24px 20px;">
                    <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.75);">Trois soirées · Google Meet</p>
                    <h1 style="margin:0;font-size:22px;line-height:1.25;font-weight:800;color:#ffffff;">${esc(args.headline)}</h1>
                    <p style="margin:10px 0 0;font-size:13px;line-height:1.45;color:rgba(255,255,255,0.9);">${esc(NOV26_TITLE_FR)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 20px;background:${EMAIL_BRAND.white};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:-14px;">
                <tr>
                  <td style="width:33%;padding:4px;">
                    <div style="text-align:center;background:${EMAIL_BRAND.mint};border:1px solid ${EMAIL_BRAND.border};border-radius:12px;padding:10px 6px;">
                      <p style="margin:0;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:${EMAIL_BRAND.muted};">Dates</p>
                      <p style="margin:4px 0 0;font-size:12px;font-weight:800;color:${EMAIL_BRAND.primary};">27-29 nov.</p>
                    </div>
                  </td>
                  <td style="width:33%;padding:4px;">
                    <div style="text-align:center;background:${EMAIL_BRAND.mint};border:1px solid ${EMAIL_BRAND.border};border-radius:12px;padding:10px 6px;">
                      <p style="margin:0;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:${EMAIL_BRAND.muted};">Horaire</p>
                      <p style="margin:4px 0 0;font-size:12px;font-weight:800;color:${EMAIL_BRAND.primary};">19h30</p>
                    </div>
                  </td>
                  <td style="width:33%;padding:4px;">
                    <div style="text-align:center;background:${EMAIL_BRAND.mint};border:1px solid ${EMAIL_BRAND.border};border-radius:12px;padding:10px 6px;">
                      <p style="margin:0;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:${EMAIL_BRAND.muted};">Tarif</p>
                      <p style="margin:4px 0 0;font-size:12px;font-weight:800;color:${EMAIL_BRAND.primary};">${esc(NOV26_PRICE_USD)} USD</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 0;text-align:center;">
              <span style="display:inline-block;margin:2px 4px;padding:5px 10px;border-radius:999px;background:${EMAIL_BRAND.mint};border:1px solid ${EMAIL_BRAND.border};font-size:11px;font-weight:700;color:${EMAIL_BRAND.primary};">Cursor</span>
              <span style="display:inline-block;margin:2px 4px;padding:5px 10px;border-radius:999px;background:${EMAIL_BRAND.mint};border:1px solid ${EMAIL_BRAND.border};font-size:11px;font-weight:700;color:${EMAIL_BRAND.primary};">Claude</span>
              <span style="display:inline-block;margin:2px 4px;padding:5px 10px;border-radius:999px;background:${EMAIL_BRAND.mint};border:1px solid ${EMAIL_BRAND.border};font-size:11px;font-weight:700;color:${EMAIL_BRAND.primary};">Codex</span>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px 8px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">${greetingLine}</p>
              ${paras}
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;border:1px solid ${EMAIL_BRAND.border};border-left:4px solid ${EMAIL_BRAND.primary};border-radius:14px;background:linear-gradient(135deg,${EMAIL_BRAND.mint} 0%,#f6fbf8 100%);">
                <tr>
                  <td style="padding:16px 16px 12px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:${EMAIL_BRAND.primary};">${esc(args.outcomesTitle)}</p>
                    <p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:${EMAIL_BRAND.muted};">${esc(args.outcomesIntro)}</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${outcomeRows}</table>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 10px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:${EMAIL_BRAND.primary};">Format &amp; inscription</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;">${bulletRows}</table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;background:linear-gradient(135deg,${EMAIL_BRAND.mint} 0%,#f6fbf8 100%);border:1px solid ${EMAIL_BRAND.border};border-radius:14px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0 0 8px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:${EMAIL_BRAND.primary};">Avantages apprenants</p>
                    <p style="margin:0;font-size:13px;line-height:1.5;color:${EMAIL_BRAND.muted};">Orientation compte <strong style="color:${EMAIL_BRAND.text};">X</strong> (vérifié) · assistants <strong style="color:${EMAIL_BRAND.text};">xAI / Grok</strong> · workflow <strong style="color:${EMAIL_BRAND.text};">Cursor</strong> premium - selon éligibilité.</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">${esc(args.close)}</p>
              <p style="margin:0 0 14px;text-align:center;">
                <a href="${esc(args.ctaHref)}" style="display:inline-block;background:${EMAIL_BRAND.primary};color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:15px 28px;border-radius:14px;box-shadow:0 10px 24px -12px rgba(48,95,51,0.55);">${esc(args.ctaLabel)}</a>
              </p>
              <p style="margin:0 0 20px;text-align:center;">
                <a href="${esc(args.waHref)}" style="display:inline-block;color:${EMAIL_BRAND.primary};text-decoration:none;font-size:14px;font-weight:700;border:1px solid ${EMAIL_BRAND.border};background:${EMAIL_BRAND.white};padding:11px 20px;border-radius:12px;">WhatsApp · questions rapides</a>
              </p>
              <p style="margin:0 0 16px;text-align:center;">
                <a href="${esc(POSTER_URL)}" style="font-size:12px;color:${EMAIL_BRAND.muted};text-decoration:underline;">Voir l'affiche (PJ jointe)</a>
              </p>
              <p style="margin:0 0 6px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Cordialement,</p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">
                <strong>McBuleli Team</strong><br />
                Mme Patty B.<br />
                <a href="mailto:${SUPPORT_EMAIL}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${SUPPORT_EMAIL}</a><br />
                ${esc(SUPPORT_PHONES_DISPLAY)}<br />
                WhatsApp :
                <a href="${esc(args.waHref)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">écrire sur WhatsApp</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 22px;border-top:1px solid ${EMAIL_BRAND.border};text-align:center;background:#fafaf9;">
              <p style="margin:0;font-size:11px;line-height:1.5;color:${EMAIL_BRAND.muted};">
                © ${year} McBuleli - RCCM : ${MCBULELI_RCCM}<br />
                <a href="${esc(args.ctaHref)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;font-weight:600;">mcbuleli.com/nov26</a>
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:${EMAIL_BRAND.muted};">
                <a href="${esc(args.unsubscribeHref)}" style="color:${EMAIL_BRAND.muted};text-decoration:underline;">Ne plus recevoir ces communications</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const NOV26_FORMATION_TEMPLATE_KEY = "nov26_formation_invite";
export const NOV26_FORMATION_CAMPAIGN_SLUG = "nov26-formation-2026";

export const NOV26_FORMATION_FACTS = {
  headline: "Formation IA · Créez une app",
  dates: NOV26_DATES_LABEL_FR,
  schedule: NOV26_TIME_LABEL_FR,
  price: `${NOV26_PRICE_USD} USD / personne`,
  venue: "En ligne · Google Meet",
} as const;

function clean(s: string | null | undefined, max = 120): string {
  return (s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function hashPick(seed: string, n: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return n <= 0 ? 0 : h % n;
}

function sectorKey(input: LeadPersonalizeInput): string {
  const t = [
    input.company,
    input.jobTitle,
    input.notes,
    ...(input.skills ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (/banque|bank|finance|assurance|fintech|paiement/.test(t)) return "finance";
  if (/telecom|airtel|vodacom|orange|reseau|ntic/.test(t)) return "telecom";
  if (/voyage|travel|tourisme|hotel|visa/.test(t)) return "travel";
  if (/software|informatique|digital|developer|web|saas/.test(t)) return "tech";
  if (/education|academie|formation|universit/.test(t)) return "education";
  if (/commerce|logistique|transport|distribution/.test(t)) return "commerce";
  return "general";
}

const FORMAT_BULLETS = [
  "Trois soirées en direct · Google Meet · 19h30 GMT+1",
  "Pré-inscription gratuite (place gardée + rappels) ou paiement MoMo / USDT",
  "Développeurs, entrepreneurs et équipes - pas besoin d'être expert code",
];

const OUTCOME_BULLETS = NOV26_OUTCOMES.map((o) => o.fr);

type Angle = {
  subject: string;
  hook: string;
  body: string[];
  ctaLabel: string;
  close: string;
};

function companyAngles(company: string, sector: string, seed: string): Angle {
  const variant = hashPick(seed, 3);
  const base: Record<string, Angle[]> = {
    tech: [
      {
        subject: `${company} - formation IA en ligne · 27-29 nov.`,
        hook: `${company} construit déjà du digital - cette édition accélère vos profils sur l'IA appliquée, depuis Kinshasa ou ailleurs.`,
        body: [
          "McBuleli lance une formation en ligne sur trois soirées : prototyper une app ou un outil métier avec Cursor, Claude et Codex.",
          "Plusieurs collègues peuvent s'inscrire - même équipe, même rythme, démo individuelle le dernier soir.",
        ],
        ctaLabel: "Voir le programme et s'inscrire",
        close:
          "Un retour court suffit - Mme Patty B. peut préciser places équipe ou questions pratiques.",
      },
    ],
    travel: [
      {
        subject: `${company} - IA appliquée · formation en ligne McBuleli`,
        hook: `Dans le voyage et le service client, ${company} gagne quand les équipes maîtrisent l'IA au quotidien - sans attendre un gros projet SI.`,
        body: [
          "Trois soirées (Google Meet) pour apprendre Vibe Coding et repartir avec une démo montrable.",
          "Idéal commerciaux, marketing et profils ops curieux de l'IA - pas seulement les développeurs.",
        ],
        ctaLabel: "Découvrir la formation nov26",
        close: "Répondez avec le nombre de places envisagées - nous adaptons la suite.",
      },
    ],
    finance: [
      {
        subject: `${company} - montée en compétence IA · 27-29 nov. en ligne`,
        hook: `Les équipes de ${company} peuvent tester l'IA appliquée sans bloquer la production - trois soirées, 19h30.`,
        body: [
          "Objectif : cadrer un petit projet, itérer avec l'IA en relisant chaque étape, et présenter une démo.",
          "Formation distincte du hackathon présentiel - calendrier pensé pour les professionnels.",
        ],
        ctaLabel: "S'inscrire sur mcbuleli.com/nov26",
        close: "Mme Patty B. reste disponible pour un échange de 15 minutes si utile.",
      },
    ],
    general: [
      {
        subject: `${company} - invitation formation IA McBuleli · nov. 2026`,
        hook: `Nous pensons que ${company} a des profils qui tireraient profit d'une formation IA pratique - en ligne, trois soirées.`,
        body: [
          `${NOV26_TITLE_FR} : McBuleli vous invite à inscrire des membres de votre équipe (${NOV26_FORMATION_FACTS.price}).`,
          "Vous gardez les outils et la méthode après la formation - Cursor, Claude, Codex au quotidien.",
        ],
        ctaLabel: "Rejoindre la formation",
        close:
          "Intérêt, question ou créneau d'appel - Mme Patty B. vous répond sous 24 h ouvrées.",
      },
      {
        subject: `Formation IA en ligne - ${company} × McBuleli`,
        hook: "L'innovation en RDC avance aussi par des équipes formées - pas seulement par de nouveaux outils achetés.",
        body: [
          "27-29 novembre 2026 · 19h30 GMT+1 · Google Meet - animé par Ir Jeff Buleli.",
          "Programme : fondations Vibe Coding, construction, démo et avantages apprenants (X, xAI, Cursor).",
        ],
        ctaLabel: "Voir mcbuleli.com/nov26",
        close: `Indiquez-nous l'interlocuteur chez ${company} - nous personnalisons la suite.`,
      },
      {
        subject: `${company} - 3 soirées pour créer avec l'IA`,
        hook: `${company} peut envoyer plusieurs personnes - développeurs, entrepreneurs ou équipes métier.`,
        body: [
          "Pré-inscription gratuite possible : place gardée, rappels e-mail, paiement MoMo ou USDT quand vous êtes prêts.",
          "Affiche et détails sur la page d'inscription - lien ci-dessous.",
        ],
        ctaLabel: "S'inscrire maintenant",
        close: "Merci de nous dire si vous passez seul ou en équipe.",
      },
    ],
  };

  const list = base[sector] ?? base.general!;
  const angle = list[Math.min(variant, list.length - 1)]!;
  return {
    ...angle,
    subject: angle.subject.replace(/\$\{company\}/g, company),
    hook: angle.hook.replace(/\$\{company\}/g, company),
    body: angle.body.map((p) => p.replace(/\$\{company\}/g, company)),
    close: angle.close.replace(/\$\{company\}/g, company),
  };
}

function individualAngle(input: LeadPersonalizeInput): Angle {
  const first = clean(input.firstName, 40) || "Bonjour";
  const company = clean(input.company, 60);
  const variant = hashPick(`${input.email ?? ""}|${first}`, 3);
  const subjects = [
    `${first}, créez une app avec l'IA - 27-29 nov. en ligne`,
    `${first} - formation McBuleli · Cursor, Claude, Codex`,
    `${first}, trois soirées pour votre démo IA`,
  ];
  return {
    subject: subjects[variant] ?? subjects[0]!,
    hook: company
      ? `Votre parcours chez ${company} colle bien à une formation pratique - idée, prototype, démo.`
      : "Vous cherchez à passer de l'idée à une première app ou un outil IA - sans y passer des mois seul.",
    body: [
      `McBuleli organise ${NOV26_FORMATION_FACTS.headline} : ${NOV26_FORMATION_FACTS.dates}, ${NOV26_FORMATION_FACTS.schedule}.`,
      `${NOV26_FORMATION_FACTS.price} · ${NOV26_FORMATION_FACTS.venue} · pré-inscription gratuite ou paiement direct.`,
      "Bonus édition : accompagnement apprenants (X vérifié, xAI, Cursor premium) selon éligibilité.",
    ],
    ctaLabel: "Je m'inscris sur mcbuleli.com/nov26",
    close: "Hâte de vous voir en ligne - Mme Patty B., équipe McBuleli.",
  };
}

function greetingName(input: LeadPersonalizeInput, companyMode: boolean): string {
  const company = clean(input.company, 80);
  if (companyMode) {
    if (company) return `l'équipe ${company}`;
    return "l'équipe";
  }
  return clean(input.firstName, 80) || "Bonjour";
}

export function buildNov26FormationCtaUrl(args: {
  segment: string;
  clickToken?: string;
}): string {
  const params = new URLSearchParams({
    source: "email",
    campaign: NOV26_FORMATION_CAMPAIGN_SLUG,
    segment: args.segment || "general",
  });
  if (args.clickToken) params.set("r", args.clickToken);
  return `https://mcbuleli.com/nov26?${params.toString()}`;
}

export function personalizeNov26FormationEmail(args: {
  lead: LeadPersonalizeInput & { segment: HackathonLeadSegment | string };
  unsubscribeUrl: string;
  ctaUrl: string;
}): PersonalizedEmail {
  const companyMode =
    isCompanyStyleLead({
      email: args.lead.email ?? "",
      firstName: args.lead.firstName,
    }) ||
    (Boolean(clean(args.lead.company, 80)) &&
      Boolean(args.lead.email) &&
      !/@(gmail|yahoo|hotmail|outlook|icloud|live)\./i.test(
        args.lead.email ?? "",
      ));

  const company = clean(args.lead.company, 80) || "votre organisation";
  const angle = companyMode
    ? companyAngles(
        company,
        sectorKey(args.lead),
        `${args.lead.email ?? ""}|${company}`,
      )
    : individualAngle(args.lead);

  const display = greetingName(args.lead, companyMode);
  const dateHighlight = `${NOV26_FORMATION_FACTS.dates} · ${NOV26_FORMATION_FACTS.schedule} · ${NOV26_FORMATION_FACTS.price}`;

  const paragraphs = [angle.hook, ...angle.body];
  const greeting =
    companyMode || (display && display !== "Bonjour") ? display : "";

  const preheader = companyMode
    ? `${company} · formation IA en ligne · 27-29 nov.`
    : `${NOV26_FORMATION_FACTS.dates} · Google Meet · McBuleli`;

  const html = renderNov26FormationHtml({
    greeting,
    headline: NOV26_FORMATION_FACTS.headline,
    preheader,
    paragraphs,
    outcomesTitle: NOV26_OUTCOMES_TITLE_FR,
    outcomesIntro: NOV26_OUTCOMES_INTRO_FR,
    outcomes: OUTCOME_BULLETS,
    formatBullets: FORMAT_BULLETS,
    ctaLabel: angle.ctaLabel,
    ctaHref: args.ctaUrl,
    waHref: SUPPORT_WA_PATH,
    close: angle.close,
    unsubscribeHref: args.unsubscribeUrl,
  });

  const textBullets = [
    "",
    NOV26_OUTCOMES_TITLE_FR,
    NOV26_OUTCOMES_INTRO_FR,
    "",
    ...OUTCOME_BULLETS.map((b) => `- ${b}`),
    "",
    "Format & inscription",
    ...FORMAT_BULLETS.map((b) => `- ${b}`),
  ].join("\n");

  const text = renderPartnershipText({
    greeting,
    headline: NOV26_FORMATION_FACTS.headline,
    paragraphs: [...paragraphs, textBullets],
    bullets: [],
    dateHighlight,
    ctaLabel: angle.ctaLabel,
    ctaHref: args.ctaUrl,
    waHref: SUPPORT_WA_PATH,
    close: angle.close,
    unsubscribeHref: args.unsubscribeUrl,
  });

  const facts: Record<string, string> = {
    template: NOV26_FORMATION_TEMPLATE_KEY,
    firstName: display,
    audience: companyMode ? "company" : "individual",
    segment: String(args.lead.segment),
    sector: sectorKey(args.lead),
  };
  if (company) facts.company = company;

  const possible = ["company", "firstName", "segment", "sector"];
  const used = possible.filter((k) => Boolean(facts[k]));
  const personalizationRate = Math.round((used.length / possible.length) * 100);

  return {
    subject: angle.subject,
    html,
    text,
    facts,
    personalizationRate,
  };
}

export { MCBULELI_RCCM };

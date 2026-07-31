/**
 * Personalized hackathon partnership outreach (1:1).
 * French copy with "-" dashes; Kinshasa SI desks (tech or not).
 * Signature: Mme Patty B. · phones · WhatsApp · RCCM.
 */

import { EMAIL_BRAND, logoUrl, partnershipPublicBaseUrl } from "@/lib/email/config";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";
import { isCompanyStyleLead } from "./lead-outreach-exclude";
import type { HackathonLeadSegment } from "./types";

export const HACKATHON_CAMPAIGN_SLUG = "ai-hackathon-2026";
export const MCBULELI_RCCM = "CD/KNG/RCCM/26-A-00382";

export const HACKATHON_EVENT_FACTS = {
  title: "HACKATHON AI KINSHASA",
  dates: "28-29 août 2026",
  hours: "08h00-17h00",
  venue: "Silikin Village - Kinshasa",
} as const;

export type LeadPersonalizeInput = {
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  jobTitle?: string | null;
  company?: string | null;
  location?: string | null;
  skills?: string[] | null;
  segment: HackathonLeadSegment | string;
  recommendedProfile?: string | null;
  notes?: string | null;
};

export type PersonalizedEmail = {
  subject: string;
  html: string;
  text: string;
  facts: Record<string, string>;
  personalizationRate: number;
};

function clean(s: string | null | undefined, max = 120): string {
  return (s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hashPick(seed: string, n: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return n <= 0 ? 0 : h % n;
}

type Angle = {
  subject: string;
  hook: string;
  body: string[];
  bullets: string[];
  ctaLabel: string;
  close: string;
};

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
  if (/mine|mining|industrie|energie|petrole|hydrocarb/.test(t)) return "industrie";
  if (/commerce|logistique|transport|distribution/.test(t)) return "commerce";
  if (/software|informatique|digital|developer|web|saas/.test(t)) return "tech";
  if (/education|academie|formation|universit/.test(t)) return "education";
  return "general";
}

function buildCompanyAngle(input: LeadPersonalizeInput): Angle {
  const company = clean(input.company, 80) || "votre organisation";
  const sector = sectorKey(input);
  const variant = hashPick(
    `${input.email ?? ""}|${company}|${input.segment}`,
    3,
  );

  const sharedBullets = [
    "Former votre équipe SI / IT à la programmation assistée par IA (Cursor, Claude, Codex)",
    "Intégrer l'IA dans vos systèmes existants - assistants, automatisation, support métier",
    "Participer en partenariat pour promouvoir l'innovation numérique en RDC",
    "Inscrire plusieurs techniciens de la même entreprise sur les 28-29 août 2026",
  ];

  const bySector: Record<string, Angle[]> = {
    finance: [
      {
        subject: `${company} - partenariat innovation IA · HACKATHON AI KINSHASA`,
        hook: `Chez ${company}, vos équipes SI portent des systèmes critiques au quotidien.`,
        body: [
          `Nous organisons le ${HACKATHON_EVENT_FACTS.title} à Kinshasa pour que les techniciens des entreprises - banques, fintech, assurances - apprennent à travailler avec l'IA là où vos SI en ont le plus besoin.`,
          "L'objectif n'est pas un show technique : c'est de renforcer la capacité interne à prototyper des assistants, sécuriser des parcours et accélérer des chantiers longtemps restés bloqués.",
          "Nous vous proposons un partenariat d'innovation : envoyer des membres de votre équipe SI, partager un défi métier si vous le souhaitez, et contribuer à la promotion de l'innovation en RDC.",
        ],
        bullets: sharedBullets,
        ctaLabel: "Découvrir le Hackathon et le partenariat",
        close:
          "Si cette orientation vous parle, répondons en quelques lignes ou parlons-en 15 minutes - Mme Patty B. reste disponible.",
      },
      {
        subject: `${company} - et si votre équipe SI prototypait avec l'IA ?`,
        hook: `Les institutions financières de Kinshasa gagnent quand leur SI apprend plus vite que le marché.`,
        body: [
          `${company} peut y participer concrètement : former plusieurs techniciens au ${HACKATHON_EVENT_FACTS.title} (${HACKATHON_EVENT_FACTS.dates}, ${HACKATHON_EVENT_FACTS.venue}).`,
          "Format pratique - Vibe Coding, prototypes, mentorat - pensé pour des profils qui livrent déjà en production.",
          "Partenariat possible : places équipe, visibilité innovation, ou défi métier soumis aux builders.",
        ],
        bullets: sharedBullets,
        ctaLabel: "Voir le programme et s'inscrire",
        close: `Dites-nous simplement qui, côté SI, pourrait représenter ${company} - nous adaptons la suite.`,
      },
      {
        subject: `Innovation RDC - invitation partenariat · ${company}`,
        hook: `McBuleli invite ${company} à un partenariat autour de l'IA appliquée aux SI.`,
        body: [
          `Le ${HACKATHON_EVENT_FACTS.title} réunit des équipes techniques à Kinshasa pour apprendre à intégrer l'IA dans des systèmes réels - y compris hors secteur « pure tech ».`,
          "Pour une organisation financière, c'est l'occasion de monter en compétence sans geler la production : deux journées intensives, plusieurs collaborateurs possibles.",
          "Nous cherchons des partenaires qui croient à l'innovation locale et veulent en être acteurs, pas spectateurs.",
        ],
        bullets: sharedBullets,
        ctaLabel: "Rejoindre la dynamique Hackathon",
        close:
          "Un retour court suffit - intérêt, questions, ou créneau d'appel.",
      },
    ],
    telecom: [
      {
        subject: `${company} - IA pour vos équipes réseaux & SI`,
        hook: `Dans les télécoms, l'avantage va à ceux qui outillent leurs techniciens plus vite.`,
        body: [
          `${company} peut envoyer plusieurs profils SI / support / développement au ${HACKATHON_EVENT_FACTS.title} pour maîtriser la programmation assistée par IA et l'appliquer à vos flux.`,
          "Partenariat innovation : contribution terrain RDC, formation d'équipe, et éventuellement un cas d'usage réseaux / clients à prototyper.",
          `Rendez-vous ${HACKATHON_EVENT_FACTS.dates} · ${HACKATHON_EVENT_FACTS.hours} · ${HACKATHON_EVENT_FACTS.venue}.`,
        ],
        bullets: sharedBullets,
        ctaLabel: "Voir le Hackathon",
        close:
          "Nous pouvons caler un court échange avec Mme Patty B. pour préciser le format partenariat.",
      },
      {
        subject: `Partenariat innovation - ${company} × HACKATHON AI KINSHASA`,
        hook: `${company} opère au cœur de la connectivité kinshoise - vos équipes SI sont un levier d'innovation nationale.`,
        body: [
          "Deux jours pour former plusieurs techniciens à l'IA appliquée, sans figer vos opérations.",
          "Nous proposons un partenariat pour promouvoir l'innovation en RDC : places équipe, défi métier optionnel, et présence dans une dynamique ouverte.",
        ],
        bullets: sharedBullets,
        ctaLabel: "Explorer le partenariat",
        close: `Indiquez-nous l'interlocuteur SI chez ${company} - Mme Patty B. assure le suivi.`,
      },
      {
        subject: `${company} - former vos techniciens à l'IA · 28-29 août`,
        hook: "Les opérateurs qui gagnent forment leurs équipes avant d'acheter encore un outil.",
        body: [
          `Le ${HACKATHON_EVENT_FACTS.title} est pensé pour des profils SI déjà en production - y compris chez ${company}.`,
          "Objectif : programmer avec l'IA, prototyper vite, et ramener des méthodes utiles dans vos systèmes.",
        ],
        bullets: sharedBullets,
        ctaLabel: "Voir le programme",
        close: "Un message court suffit pour démarrer la conversation.",
      },
    ],
    industrie: [
      {
        subject: `${company} - SI industriel & IA · partenariat Kinshasa`,
        hook: `Même hors « tech pure », vos systèmes d'information portent la productivité de ${company}.`,
        body: [
          "Le HACKATHON AI KINSHASA forme des équipes SI d'entreprises industrielles, minières et énergétiques à utiliser l'IA pour automatiser, assister et débloquer des problèmes métiers.",
          "Nous proposons un partenariat d'innovation en RDC : places pour vos techniciens, échange sur vos contraintes SI, et présence dans une dynamique nationale d'innovation.",
          `Dates : ${HACKATHON_EVENT_FACTS.dates} à ${HACKATHON_EVENT_FACTS.venue}.`,
        ],
        bullets: sharedBullets,
        ctaLabel: "Explorer le partenariat",
        close: `Si un responsable SI ou DSI peut répondre, nous adaptons la proposition à ${company}.`,
      },
      {
        subject: `Innovation terrain - invitation · ${company}`,
        hook: `Les chantiers industriels avancent mieux quand le SI sait prototyper avec l'IA.`,
        body: [
          `Nous invitons ${company} à participer en partenariat au ${HACKATHON_EVENT_FACTS.title} - pour former plusieurs techniciens et promouvoir l'innovation en RDC.`,
          "Format pratique, mentoré, orienté systèmes réels - pas un salon théorique.",
        ],
        bullets: sharedBullets,
        ctaLabel: "Découvrir le Hackathon",
        close: "Nous restons flexibles sur le format : places équipe ou partenariat plus large.",
      },
      {
        subject: `${company} - vos équipes SI et l'IA appliquée`,
        hook: "L'innovation en RDC a aussi besoin des acteurs industriels, pas seulement des startups.",
        body: [
          `Associer ${company} à cette édition, c'est donner à votre SI un terrain d'apprentissage concret sur deux jours.`,
          `Lieu : ${HACKATHON_EVENT_FACTS.venue}. Dates : ${HACKATHON_EVENT_FACTS.dates}.`,
        ],
        bullets: sharedBullets,
        ctaLabel: "Participer / partenaire",
        close: "Mme Patty B. peut caler un échange de 15 minutes si utile.",
      },
    ],
    commerce: [
      {
        subject: `${company} - digitaliser plus vite avec votre équipe SI`,
        hook: "Commerce et logistique à Kinshasa avancent quand le SI cesse d'être un goulot.",
        body: [
          `Nous invitons ${company} à participer au ${HACKATHON_EVENT_FACTS.title} - en partenariat - pour former vos techniciens à l'IA appliquée (assistants, automatisation, prototypes utiles).`,
          "Plusieurs collaborateurs peuvent s'inscrire. L'enjeu : promouvoir l'innovation en RDC tout en renforçant concrètement vos capacités internes.",
        ],
        bullets: sharedBullets,
        ctaLabel: "Découvrir le programme",
        close: "Répondez avec le contact SI le plus pertinent - nous suivons.",
      },
      {
        subject: `Partenariat · ${company} × McBuleli · HACKATHON AI KINSHASA`,
        hook: `${company} peut gagner en agilité SI sans attendre un grand projet ERP.`,
        body: [
          "Deux journées pour apprendre à prototyper avec l'IA, puis ramener des méthodes dans vos opérations commerce / distribution.",
          "Nous cherchons des partenaires kinshois pour promouvoir l'innovation numérique en RDC - concrètement, avec des équipes sur le terrain.",
        ],
        bullets: sharedBullets,
        ctaLabel: "Voir le détail",
        close: `Disons-nous qui, chez ${company}, porte le SI - la suite s'écrit avec vous.`,
      },
      {
        subject: `${company} - inscription équipe SI · 28-29 août 2026`,
        hook: "Former plusieurs techniciens d'une même entreprise change plus qu'une formation individuelle isolée.",
        body: [
          `C'est l'angle que nous proposons à ${company} pour le ${HACKATHON_EVENT_FACTS.title}.`,
          "Participer en partenariat, c'est aussi soutenir une dynamique d'innovation locale visible.",
        ],
        bullets: sharedBullets,
        ctaLabel: "Inscrire l'équipe",
        close: "Un retour « intéressé / questions / pas maintenant » suffit.",
      },
    ],
    tech: [
      {
        subject: `${company} - builders IA à Kinshasa · partenariat`,
        hook: `${company} construit déjà du digital - le hackathon accélère vos équipes sur l'IA pratique.`,
        body: [
          "Vibe Coding, prototypes, mentorat, Demo Day : un format pour que vos développeurs et techniciens livrent plus vite avec Cursor, Claude et Codex.",
          "Partenariat possible : places équipe, mentorat, défi produit, ou simple participation pour promouvoir l'écosystème innovation en RDC.",
        ],
        bullets: sharedBullets,
        ctaLabel: "Inscrire des membres de l'équipe",
        close: `On peut aussi co-construire un angle partenariat sur mesure pour ${company}.`,
      },
      {
        subject: `${company} - Vibe Coding & IA · HACKATHON AI KINSHASA`,
        hook: "Les équipes qui maîtrisent la programmation assistée par IA livrent plus vite - et mieux.",
        body: [
          `Nous proposons à ${company} d'envoyer plusieurs builders au ${HACKATHON_EVENT_FACTS.title} (${HACKATHON_EVENT_FACTS.dates}, ${HACKATHON_EVENT_FACTS.venue}).`,
          "Objectif partenariat : monter en compétence, partager un défi produit si vous le souhaitez, et contribuer à l'innovation en RDC.",
        ],
        bullets: sharedBullets,
        ctaLabel: "Découvrir le format",
        close: "Mme Patty B. peut répondre sous 24 heures ouvrées.",
      },
      {
        subject: `Invitation builders - ${company} × McBuleli`,
        hook: `Kinshasa a besoin d'équipes comme ${company} dans la conversation IA appliquée.`,
        body: [
          "Pas un concours de slides : des prototypes, du mentorat, et un Demo Day.",
          "Plusieurs places possibles pour votre équipe - tech ou SI voisin.",
        ],
        bullets: sharedBullets,
        ctaLabel: "Participer",
        close: "Dites-nous combien de profils vous pourriez envoyer - nous improvisons le reste.",
      },
    ],
    education: [
      {
        subject: `${company} - former à l'IA appliquée · HACKATHON AI KINSHASA`,
        hook: "Les acteurs de la formation à Kinshasa ont un rôle direct dans l'innovation nationale.",
        body: [
          `Nous proposons à ${company} un partenariat autour du ${HACKATHON_EVENT_FACTS.title} : envoyer des profils techniques, observer le format, et contribuer à promouvoir l'innovation en RDC.`,
          "Objectif : que les équipes apprennent à intégrer l'IA dans des SI et des projets concrets - pas seulement en théorie.",
        ],
        bullets: sharedBullets,
        ctaLabel: "Voir le Hackathon",
        close: "Discutons du format le plus utile pour vos apprenants ou votre équipe SI.",
      },
      {
        subject: `Partenariat formation · ${company} × HACKATHON AI KINSHASA`,
        hook: `${company} forme déjà - le hackathon peut enrichir votre proposition IA pratique.`,
        body: [
          "Deux jours intensifs à Silikin Village : Vibe Coding, prototypes, mentorat.",
          "Nous cherchons des partenaires éducatifs pour promouvoir l'innovation en RDC aux côtés des entreprises.",
        ],
        bullets: sharedBullets,
        ctaLabel: "Explorer le partenariat",
        close: "Un appel court avec Mme Patty B. peut clarifier le cadre.",
      },
      {
        subject: `${company} - innovation pédagogique & IA · Kinshasa`,
        hook: "Former à l'IA sans terrain pratique laisse les apprenants au milieu du gué.",
        body: [
          `Associer ${company} au ${HACKATHON_EVENT_FACTS.title}, c'est offrir un terrain réel - et soutenir une dynamique nationale.`,
          `Dates : ${HACKATHON_EVENT_FACTS.dates} · ${HACKATHON_EVENT_FACTS.hours}.`,
        ],
        bullets: sharedBullets,
        ctaLabel: "En savoir plus",
        close: "Indiquez le bon contact pédagogique ou SI - nous suivons.",
      },
    ],
    general: [
      {
        subject: `${company} - partenariat innovation · HACKATHON AI KINSHASA`,
        hook: `Toute entreprise de Kinshasa qui s'appuie sur un SI peut gagner à former son équipe à l'IA.`,
        body: [
          `McBuleli invite ${company} à un partenariat d'innovation autour du ${HACKATHON_EVENT_FACTS.title} (${HACKATHON_EVENT_FACTS.dates}, ${HACKATHON_EVENT_FACTS.venue}).`,
          "Que vous soyez PME ou grande structure, hors tech ou digital : l'idée est d'envoyer des techniciens / membres SI pour apprendre à programmer avec l'IA et l'intégrer dans vos systèmes.",
          "Participer, c'est aussi promouvoir l'innovation en RDC - concrètement, sur le terrain, avec des prototypes utiles.",
        ],
        bullets: sharedBullets,
        ctaLabel: "Découvrir et participer",
        close:
          "Un intérêt, une question ou un créneau d'appel - Mme Patty B. vous répond.",
      },
      {
        subject: `Invitation partenariat - ${company} × McBuleli Hackathon AI`,
        hook: `Nous cherchons des entreprises de Kinshasa prêtes à monter en compétence IA côté SI.`,
        body: [
          `${company} figure parmi les organisations que nous souhaitons associer à cette dynamique.`,
          "Format : deux jours intensifs, plusieurs places possibles pour votre équipe, angle partenariat pour promouvoir l'innovation numérique en RDC.",
          "Pas besoin d'être une startup tech - il suffit d'avoir un SI et l'envie de le faire évoluer.",
        ],
        bullets: sharedBullets,
        ctaLabel: "Voir le détail du Hackathon",
        close: "Merci de nous indiquer le bon interlocuteur côté SI ou direction.",
      },
      {
        subject: `${company} - vos techniciens et l'IA · 28-29 août à Kinshasa`,
        hook: `L'innovation en RDC avance quand les entreprises forment leurs équipes SI, pas seulement quand elles achètent des outils.`,
        body: [
          `Le ${HACKATHON_EVENT_FACTS.title} est conçu pour ça : pratique, partenariats, prototypes.`,
          `Lieu : ${HACKATHON_EVENT_FACTS.venue}. Horaires : ${HACKATHON_EVENT_FACTS.hours}.`,
          `Nous serions heureux d'associer ${company} - en inscription équipe ou en partenariat plus large.`,
        ],
        bullets: sharedBullets,
        ctaLabel: "Participer / partenaire",
        close: "Réponse courte bienvenue - nous improvisons la suite avec vous.",
      },
    ],
  };

  const list = bySector[sector] ?? bySector.general!;
  const angle = list[Math.min(variant, list.length - 1)]!;
  // Fix template leftovers in close strings
  return {
    ...angle,
    close: angle.close.replace(/\$\{company\}/g, company),
    hook: angle.hook.replace(/\$\{company\}/g, company),
    body: angle.body.map((p) => p.replace(/\$\{company\}/g, company)),
    subject: angle.subject.replace(/\$\{company\}/g, company),
  };
}

function buildIndividualAngle(input: LeadPersonalizeInput): Angle {
  const first = clean(input.firstName, 40) || "Bonjour";
  const company = clean(input.company, 60);
  const variant = hashPick(`${input.email ?? ""}|${first}`, 2);
  const subjects = [
    `${first}, HACKATHON AI KINSHASA - programmer avec l'IA`,
    `${first} - 28-29 août à Kinshasa · IA appliquée`,
  ];
  return {
    subject: subjects[variant] ?? subjects[0]!,
    hook: company
      ? `Votre parcours autour de ${company} peut particulièrement coller à un hackathon orienté SI et IA appliquée.`
      : "Votre profil peut particulièrement coller à un hackathon orienté IA appliquée à Kinshasa.",
    body: [
      `Le ${HACKATHON_EVENT_FACTS.title} se tient les ${HACKATHON_EVENT_FACTS.dates} (${HACKATHON_EVENT_FACTS.hours}) à ${HACKATHON_EVENT_FACTS.venue}.`,
      "Objectif : maîtriser la programmation assistée par IA, prototyper en équipe, et contribuer à l'innovation locale.",
    ],
    bullets: [
      "Vibe Coding - Cursor, Claude, Codex",
      "Prototypes utiles en deux jours",
      "Équipes et mentorat sur place",
    ],
    ctaLabel: "S'inscrire au Hackathon",
    close: "À très bientôt - Mme Patty B., équipe McBuleli.",
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

export function buildCampaignCtaUrl(args: {
  campaignSlug?: string;
  segment: string;
  clickToken?: string;
}): string {
  const base = partnershipPublicBaseUrl();
  const campaign = args.campaignSlug ?? HACKATHON_CAMPAIGN_SLUG;
  const params = new URLSearchParams({
    source: "email",
    campaign,
    segment: args.segment || "general",
  });
  if (args.clickToken) params.set("r", args.clickToken);
  return `${base}/hackathon?${params.toString()}`;
}

function renderPartnershipHtml(args: {
  greeting: string;
  headline: string;
  preheader: string;
  paragraphs: string[];
  bullets: string[];
  dateHighlight: string;
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
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">${esc(p)}</p>`,
    )
    .join("");
  const lis = args.bullets
    .map(
      (b) =>
        `<li style="margin:0 0 8px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">${esc(b)}</li>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(args.headline)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.mint};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(args.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.mint};padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:${EMAIL_BRAND.white};border-radius:16px;border:1px solid ${EMAIL_BRAND.border};overflow:hidden;">
          <tr>
            <td style="padding:24px 28px 8px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <img src="${logoSrc}" width="48" height="48" alt="McBuleli" style="display:block;border:0;border-radius:50%;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:18px;font-weight:800;color:${EMAIL_BRAND.primary};">McBuleli</p>
                    <p style="margin:2px 0 0;font-size:11px;color:${EMAIL_BRAND.muted};">Innovation · Hackathon AI Kinshasa</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;">
              <p style="margin:0 0 12px;font-size:14px;color:${EMAIL_BRAND.muted};">${args.greeting ? `Bonjour ${esc(args.greeting)},` : "Bonjour,"}</p>
              <h1 style="margin:0 0 14px;font-size:22px;line-height:1.25;font-weight:700;color:${EMAIL_BRAND.text};">${esc(args.headline)}</h1>
              ${paras}
              <p style="margin:0 0 16px;text-align:center;">
                <span style="display:inline-block;background:${EMAIL_BRAND.primary};color:#fff;font-size:13px;font-weight:800;padding:10px 18px;border-radius:999px;">${esc(args.dateHighlight)}</span>
              </p>
              <ul style="margin:0 0 18px;padding:0 0 0 20px;text-align:left;">${lis}</ul>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">${esc(args.close)}</p>
              <p style="margin:0 0 12px;text-align:center;">
                <a href="${esc(args.ctaHref)}" style="display:inline-block;background:${EMAIL_BRAND.primary};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 26px;border-radius:12px;">${esc(args.ctaLabel)}</a>
              </p>
              <p style="margin:0 0 22px;text-align:center;">
                <a href="${esc(args.waHref)}" style="display:inline-block;background:${EMAIL_BRAND.mint};color:${EMAIL_BRAND.primary};text-decoration:none;font-size:14px;font-weight:700;padding:12px 22px;border-radius:12px;border:1px solid ${EMAIL_BRAND.border};">Écrire sur WhatsApp</a>
              </p>
              <p style="margin:0 0 6px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Cordialement,</p>
              <p style="margin:0;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">
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
            <td style="padding:18px 28px 24px;border-top:1px solid ${EMAIL_BRAND.border};text-align:center;">
              <p style="margin:0;font-size:11px;color:${EMAIL_BRAND.muted};">
                © ${year} McBuleli - RCCM : ${MCBULELI_RCCM}<br />
                <a href="${esc(args.ctaHref)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">mcbuleli.org/hackathon</a>
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

function renderPartnershipText(args: {
  greeting: string;
  headline: string;
  paragraphs: string[];
  bullets: string[];
  dateHighlight: string;
  ctaLabel: string;
  ctaHref: string;
  waHref: string;
  close: string;
  unsubscribeHref: string;
}): string {
  const year = new Date().getFullYear();
  return [
    args.greeting ? `Bonjour ${args.greeting},` : "Bonjour,",
    "",
    args.headline,
    "",
    ...args.paragraphs,
    "",
    args.dateHighlight,
    "",
    ...args.bullets.map((b) => `- ${b}`),
    "",
    args.close,
    "",
    `${args.ctaLabel} : ${args.ctaHref}`,
    `WhatsApp : ${args.waHref}`,
    "",
    "Cordialement,",
    "McBuleli Team",
    "Mme Patty B.",
    SUPPORT_EMAIL,
    SUPPORT_PHONES_DISPLAY,
    "",
    `© ${year} McBuleli - RCCM : ${MCBULELI_RCCM}`,
    `Désinscription : ${args.unsubscribeHref}`,
  ].join("\n");
}

export function personalizeLeadEmail(args: {
  lead: LeadPersonalizeInput;
  unsubscribeUrl: string;
  ctaUrl: string;
  campaignName?: string;
}): PersonalizedEmail {
  const companyMode =
    isCompanyStyleLead({
      email: args.lead.email ?? "",
      firstName: args.lead.firstName,
    }) ||
    (Boolean(clean(args.lead.company, 80)) &&
      Boolean(args.lead.email) &&
      !/@(gmail|yahoo|hotmail|outlook|icloud|live)\./i.test(args.lead.email ?? ""));
  const angle = companyMode
    ? buildCompanyAngle(args.lead)
    : buildIndividualAngle(args.lead);
  const display = greetingName(args.lead, companyMode);
  const company = clean(args.lead.company, 100);
  const job = clean(args.lead.jobTitle, 100);
  const location = clean(args.lead.location, 80);
  const skills = (args.lead.skills ?? [])
    .map((s) => clean(s, 40))
    .filter(Boolean)
    .slice(0, 4);

  const facts: Record<string, string> = {
    firstName: display,
    audience: companyMode ? "company" : "individual",
    segment: String(args.lead.segment),
    sector: sectorKey(args.lead),
  };
  if (company) facts.company = company;
  if (job) facts.jobTitle = job;
  if (location) facts.location = location;
  if (skills.length) facts.skills = skills.join(", ");
  if (args.lead.recommendedProfile) {
    facts.recommendedProfile = clean(args.lead.recommendedProfile, 120);
  }

  const dateHighlight = `${HACKATHON_EVENT_FACTS.dates} · ${HACKATHON_EVENT_FACTS.hours} · ${HACKATHON_EVENT_FACTS.venue}`;
  const paragraphs = [angle.hook, ...angle.body];

  const greeting =
    companyMode || (display && display !== "Bonjour") ? display : "";

  const html = renderPartnershipHtml({
    greeting,
    headline: HACKATHON_EVENT_FACTS.title,
    preheader: companyMode
      ? `Partenariat innovation · ${HACKATHON_EVENT_FACTS.dates}`
      : `${HACKATHON_EVENT_FACTS.dates} · Kinshasa`,
    paragraphs,
    bullets: angle.bullets,
    dateHighlight,
    ctaLabel: angle.ctaLabel,
    ctaHref: args.ctaUrl,
    waHref: SUPPORT_WA_PATH,
    close: angle.close,
    unsubscribeHref: args.unsubscribeUrl,
  });

  const text = renderPartnershipText({
    greeting,
    headline: HACKATHON_EVENT_FACTS.title,
    paragraphs,
    bullets: angle.bullets,
    dateHighlight,
    ctaLabel: angle.ctaLabel,
    ctaHref: args.ctaUrl,
    waHref: SUPPORT_WA_PATH,
    close: angle.close,
    unsubscribeHref: args.unsubscribeUrl,
  });

  const possible = ["jobTitle", "company", "location", "skills", "firstName"];
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

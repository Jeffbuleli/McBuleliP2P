import { EMAIL_BRAND, logoUrl, partnershipPublicBaseUrl } from "@/lib/email/config";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

export type InstitutionalCoopPartnerId =
  | "eeas-delegation"
  | "enabel"
  | "swiss-coop"
  | "odc-orange"
  | "unicef-genu"
  | "congo-tech"
  | "undp-com"
  | "giz-rdc";

export type InstitutionalCoopProfile = {
  id: InstitutionalCoopPartnerId;
  orgName: string;
  /** Greeting line after "Bonjour" (e.g. "Madame Museme," or "l'équipe Enabel,"). */
  greeting: string;
  contactEmail: string;
  ccEmails?: string[];
  website: string | null;
  domainLabel: string;
  roleTitle: string;
  whyThem: string;
  /** Extra paragraph: what changes if they join (impact amplification). */
  withYouImpact: string;
  expectedFromPartner: string[];
  partnerGains: string[];
  /** If true, we explicitly invite cash / principal sponsorship. */
  askPrincipalSponsor?: boolean;
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const CONFIRMED_PARTNERS = [
  "Silikin Village - Lieu / hub d'innovation",
  "pawaPay - Partenaire Paiement Mobile (sandbox APIs)",
  "Binance - Demo crypto (équipes testent l'intégration via APIs demo)",
  "ILOKWE GROUP - Sponsor Or · Prix ILOKWE · Jury",
  "RDPI Think Tank - Partenaire Policy & Impact",
] as const;

const IMPACT_IA_BULLETS = [
  "L'IA n'est plus un sujet théorique : elle accélère la productivité, l'apprentissage et la création de services utiles.",
  "Quand une génération de builders en RDC maîtrise ces outils, elle peut construire plus vite des solutions locales (santé, finance, agriculture, éducation, gouvernance).",
  "Le McBuleli Hackathon transforme cette promesse en pratique : formation Vibe Coding (Cursor, Claude, Codex) + compétition + mentorat + Demo Day.",
] as const;

export const INSTITUTIONAL_COOP_PROFILES: InstitutionalCoopProfile[] = [
  {
    id: "eeas-delegation",
    orgName: "Délégation de l'Union européenne en RDC",
    greeting: "Madame, Monsieur,",
    contactEmail: "delegation-dem-rep-of-congo@eeas.europa.eu",
    website: "https://www.eeas.europa.eu/delegations/dr-congo-kinshasa_fr",
    domainLabel: "Coopération UE · Kinshasa",
    roleTitle: "Sponsor & Partenaire principal",
    askPrincipalSponsor: true,
    whyThem:
      "La Délégation de l'UE à Kinshasa joue un rôle central pour accompagner la transformation numérique, l'emploi des jeunes et un développement durable ancré dans les compétences. Le McBuleli Hackathon 2026 est un moment concret pour démontrer - à Silikin Village - ce que l'IA pratique peut changer pour la jeunesse congolaise.",
    withYouImpact:
      "Avec l'UE comme Sponsor et Partenaire principal, l'événement gagne une portée institutionnelle majeure : plus de bourses participants, un Demo Day d'envergure, une visibilité régionale, et un signal fort - la maîtrise de l'IA comme levier de croissance rapide pour notre communauté.",
    expectedFromPartner: [
      "Sponsoring principal (visibilité naming / Platinum selon modalités)",
      "Appui à l'impact : bourses participants, mentorat, ou contribution logistique",
      "Option : mot d'ouverture / présence Demo Day / jury impact",
      "Logo officiel + diffusion sur vos canaux (selon règles de communication UE)",
    ],
    partnerGains: [
      "Visibilité comme moteur de l'innovation jeunesse & compétences IA en RDC",
      "Pipeline de prototypes concrets alignés développement, inclusion et numérique",
      "Contenu / storytelling pour la diplomatie économique et la coopération digitale",
      "Ancrage terrain à Silikin Village auprès de builders, mentors et partenaires tech",
    ],
  },
  {
    id: "enabel",
    orgName: "Enabel",
    greeting: "l'équipe Enabel,",
    contactEmail: "drcongo@enabel.be",
    website: "https://www.enabel.be",
    domainLabel: "Coopération belge · compétences & emploi",
    roleTitle: "Partenaire Compétences numériques & emploi jeunes",
    whyThem:
      "Enabel accompagne en RDC des programmes de compétences, d'emploi et de développement durable. Le McBuleli Hackathon forme des builders à l'IA pratique - exactement le type de compétences qui accélèrent l'employabilité et l'entrepreneuriat numérique.",
    withYouImpact:
      "Votre appui (technique, mentorat, diffusion, et/ou contribution) permettrait d'élargir l'accès des jeunes aux outils IA et de relier les prototypes à des trajectoires d'emploi et d'accompagnement déjà portées par Enabel.",
    expectedFromPartner: [
      "Relais auprès de vos bénéficiaires / programmes jeunesse & compétences",
      "Option atelier ou mentorat : compétences IA, employabilité, passage prototype → projet",
      "Option appui (communication, bourses, ou contribution selon vos modalités)",
      "Logo partenaire + diffusion (si intérêt confirmé)",
    ],
    partnerGains: [
      "Visibilité sur un événement IA jeunesse à Kinshasa (Silikin Village)",
      "Pipeline de talents et prototypes utiles à vos programmes compétences / emploi",
      "Alignement clair avec digitalisation, jeunesse et croissance inclusive",
    ],
  },
  {
    id: "swiss-coop",
    orgName: "Coopération suisse en RDC",
    greeting: "Madame, Monsieur,",
    contactEmail: "kinshasa.cc@eda.admin.ch",
    ccEmails: ["kinshasa@eda.admin.ch"],
    website:
      "https://www.schweiz-demokratischerepublikkongo.eda.admin.ch/fr",
    domainLabel: "Coopération suisse · Kinshasa",
    roleTitle: "Partenaire Développement & Innovation jeunesse",
    whyThem:
      "La Coopération suisse en RDC soutient un développement durable et des opportunités concrètes pour les populations. Former une génération capable d'utiliser l'IA pour résoudre des problèmes locaux accélère précisément ce type d'impact.",
    withYouImpact:
      "En rejoignant le hackathon, vous renforceriez un espace pratique où les jeunes construisent des solutions (santé, agriculture, éducation, gouvernance) - et où la maîtrise de l'IA devient un accélérateur de croissance communautaire, pas seulement un sujet technologique.",
    expectedFromPartner: [
      "Appui institutionnel / partenaires (mentorat, jury impact, ou contribution)",
      "Option relais auprès de vos réseaux et programmes en RDC",
      "Option présence courte Demo Day ou mot d'encouragement",
      "Logo partenaire + diffusion (selon règles de communication)",
    ],
    partnerGains: [
      "Visibilité sur l'innovation jeunesse et les compétences numériques en RDC",
      "Prototypes concrets liés aux défis de développement",
      "Contenu et rencontres avec builders, mentors et acteurs de l'écosystème Kinshasa",
    ],
  },
  {
    id: "odc-orange",
    orgName: "Orange Digital Center (ODC) RDC",
    greeting: "Monsieur Tshibasu,",
    contactEmail: "marc.tshibasu@orange.com",
    website: null,
    domainLabel: "Formation digitale · Orange",
    roleTitle: "Partenaire Formation digitale & talents IA",
    whyThem:
      "L'Orange Digital Center forme et accompagne les talents numériques en RDC. Le McBuleli Hackathon prolonge cette mission sur 2 jours intensifs : Vibe Coding, build produit et Demo Day - pour que l'IA soit maîtrisée, pas seulement découverte.",
    withYouImpact:
      "Ensemble, ODC et McBuleli peuvent montrer qu'une communauté qui sait utiliser l'IA construit plus vite, forme plus de builders opérationnels, et accélère l'innovation locale autour des défis concrets de la RDC.",
    expectedFromPartner: [
      "Mentorat / atelier : compétences digitales, outils IA, posture produit",
      "Option mobilisation de votre communauté ODC / alumni vers le hackathon",
      "Option présence Demo Day ou regard jury formation",
      "Logo partenaire + relais sur vos canaux ODC / Orange",
    ],
    partnerGains: [
      "Visibilité ODC auprès de builders IA et partenaires tech à Silikin",
      "Pipeline de talents et projets pour vos parcours formation / incubation",
      "Positionnement référence formation IA pratique en RDC",
    ],
  },
  {
    id: "unicef-genu",
    orgName: "UNICEF · Génération sans limites (GenU)",
    greeting: "Madame, Monsieur,",
    contactEmail: "nssona@unicef.org",
    ccEmails: ["jsimon@unicef.org", "cfofana@unicef.org"],
    website: null,
    domainLabel: "Jeunesse · compétences · GenU",
    roleTitle: "Partenaire Jeunesse & compétences pour l'avenir",
    whyThem:
      "Génération sans limites (GenU) / UNICEF mise sur les compétences, l'emploi et l'engagement des jeunes. L'IA pratique est aujourd'hui un levier décisif : la maîtriser, c'est donner aux jeunes les moyens d'apprendre, créer et entreprendre plus vite.",
    withYouImpact:
      "Votre appui permettrait d'élargir l'accès des jeunes au hackathon, de renforcer le mentorat, et de relier les prototypes à une trajectoire d'impact jeunesse - pour que l'IA accélère réellement la croissance de notre communauté.",
    expectedFromPartner: [
      "Relais auprès des jeunes / réseaux GenU et partenaires jeunesse",
      "Option atelier : compétences numériques, IA responsable, employabilité",
      "Option appui (bourses participants, mentorat, communication)",
      "Logo partenaire + diffusion (si intérêt confirmé)",
    ],
    partnerGains: [
      "Visibilité GenU / UNICEF sur un événement IA jeunesse à Kinshasa",
      "Pipeline de jeunes builders et prototypes à potentiel social",
      "Alignement compétences du XXIe siècle, innovation et inclusion",
    ],
  },
  {
    id: "congo-tech",
    orgName: "Congo Tech",
    greeting: "l'équipe Congo Tech,",
    contactEmail: "info@congo-tech.com",
    website: "https://www.moncongo.com/congotech-ste-r-j-trading",
    domainLabel: "Tech locale · innovation",
    roleTitle: "Partenaire Tech locale & innovation",
    whyThem:
      "Congo Tech s'inscrit dans l'écosystème technologique local. Le McBuleli Hackathon rassemble builders, mentors et partenaires pour produire des prototypes IA utiles - une opportunité de croiser votre expertise terrain avec une génération qui apprend à construire plus vite grâce à l'IA.",
    withYouImpact:
      "En étant partenaire, vous aidez à ancrer l'événement dans le tissu tech congolais : mentorat métier, diffusion, et mise en relation - pour que la maîtrise de l'IA serve la croissance rapide de solutions locales.",
    expectedFromPartner: [
      "Mentorat court ou regard expert sur les prototypes",
      "Option relais auprès de votre réseau tech / clients",
      "Option présence Demo Day ou stand partenaires",
      "Logo partenaire + diffusion",
    ],
    partnerGains: [
      "Visibilité auprès de builders et partenaires à Silikin Village",
      "Pipeline de talents et projets digitaux",
      "Positionnement acteur tech engagé dans l'IA pratique en RDC",
    ],
  },
  {
    id: "undp-com",
    orgName: "PNUD RDC (Communication)",
    greeting: "Madame Museme,",
    contactEmail: "clarisse.museme@undp.org",
    website: null,
    domainLabel: "Communication · développement",
    roleTitle: "Partenaire Communication & Impact développement",
    whyThem:
      "Le service de communication du PNUD en RDC valorise les initiatives qui transforment concrètement les communautés. Le McBuleli Hackathon montre l'impact de l'IA maîtrisée : jeunes qui construisent des solutions locales en 48 heures, avec mentorat et Demo Day.",
    withYouImpact:
      "Avec le PNUD en appui communication / partenariat, l'histoire de ces builders - et le message « maîtriser l'IA pour accélérer la croissance » - peut toucher bien plus large : institutions, médias, jeunesse et partenaires de développement.",
    expectedFromPartner: [
      "Conseil / appui communication autour de l'événement et de l'impact IA",
      "Option relais sur vos canaux PNUD (selon validation interne)",
      "Option présence / couverture Demo Day",
      "Logo partenaire + citation / storytelling commun (si intérêt confirmé)",
    ],
    partnerGains: [
      "Contenu fort : jeunesse, IA, innovation et développement en RDC",
      "Visibilité PNUD auprès de builders et acteurs tech à Kinshasa",
      "Alignement ODD / compétences numériques / innovation sociale",
    ],
  },
  {
    id: "giz-rdc",
    orgName: "GIZ RDC",
    greeting: "Madame, Monsieur,",
    contactEmail: "giz-kongo-rdc@giz.de",
    website: null,
    domainLabel: "Coopération allemande · transformation",
    roleTitle: "Partenaire Transformation digitale & compétences",
    whyThem:
      "La GIZ accompagne en RDC des dynamiques de transformation et de compétences. Le McBuleli Hackathon forme des builders à l'utilisation concrète de l'IA - un accélérateur pour l'innovation locale, l'employabilité et des services numériques utiles.",
    withYouImpact:
      "Votre partenariat renforcerait la portée et la qualité du programme (mentorat, bourses, expertise) - et montrerait qu'une communauté qui maîtrise l'IA peut croître plus vite, avec des prototypes ancrés dans les défis congolais.",
    expectedFromPartner: [
      "Appui technique / mentorat (digital, innovation, compétences)",
      "Option contribution (bourses, atelier, ou soutien selon modalités GIZ)",
      "Option jury / feedback impact sur les prototypes",
      "Logo partenaire + diffusion (selon règles de communication)",
    ],
    partnerGains: [
      "Visibilité sur l'innovation jeunesse et la transformation digitale en RDC",
      "Pipeline de projets et talents alignés compétences numériques",
      "Ancrage terrain à Silikin Village avec l'écosystème tech Kinshasa",
    ],
  },
];

export function getInstitutionalCoopProfile(
  id: InstitutionalCoopPartnerId,
): InstitutionalCoopProfile {
  const profile = INSTITUTIONAL_COOP_PROFILES.find((p) => p.id === id);
  if (!profile) throw new Error(`Unknown partner id: ${id}`);
  return profile;
}

export type InstitutionalCoopEmailCopy = {
  subject: string;
  preheader: string;
  html: string;
  text: string;
};

function mintRows(items: readonly string[]): string {
  return items
    .map(
      (item) =>
        `<tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">${esc(item)}</td></tr>`,
    )
    .join(
      '<tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>',
    );
}

export function buildInstitutionalCoopEmail(
  profile: InstitutionalCoopProfile,
): InstitutionalCoopEmailCopy {
  const hackathonUrl = `${partnershipPublicBaseUrl()}/hackathon`;
  const logo = logoUrl();
  const year = new Date().getFullYear();

  const subject = profile.askPrincipalSponsor
    ? `McBuleli Hackathon × ${profile.orgName} - invitation Sponsor & Partenaire principal`
    : `McBuleli Hackathon × ${profile.orgName} - partenariat & impact IA`;

  const preheader = profile.askPrincipalSponsor
    ? "Portée, impact IA, partenaires déjà confirmés - et ce que l'événement devient avec l'UE comme partenaire principal."
    : "Où nous en sommes, impact de l'IA pour la jeunesse en RDC, et rôle sur mesure pour votre organisation.";

  const sponsorshipNote = profile.askPrincipalSponsor
    ? "Nous vous sollicitons explicitement comme Sponsor et Partenaire principal - pour amplifier la portée et l'impact de l'événement."
    : "L'appui peut être technique, mentorat, communication, bourses, et/ou contribution selon vos modalités - l'essentiel est d'avancer ensemble sur l'impact.";

  const text = [
    `Bonjour ${profile.greeting}`,
    "",
    profile.whyThem,
    "",
    "POURQUOI L'IA MAINTENANT",
    ...IMPACT_IA_BULLETS.map((b) => `- ${b}`),
    "",
    "OÙ NOUS EN SOMMES",
    "- Programme public : " + hackathonUrl,
    "- Dates confirmées : vendredi 28 et samedi 29 août 2026, 08h00–17h00",
    "- Lieu : Silikin Village, 63 Ave Colonel Mondjiba, Kinshasa",
    "- Format : formation pratique IA (Vibe Coding) + compétition + mentorat + Demo Day",
    "- 8 défis : IA, FinTech, GovTech, Santé, Agriculture, Éducation, Médias, Cybersécurité",
    "",
    "Partenaires déjà confirmés (extrait) :",
    ...CONFIRMED_PARTNERS.map((p) => `- ${p}`),
    "",
    "D'autres acteurs (campus, médias, services, FinTech) sont en discussion. Nous déployons aussi un réseau d'ambassadeurs universitaires.",
    "",
    `RÔLE PROPOSÉ - ${profile.roleTitle}`,
    `(${profile.domainLabel})`,
    "",
    profile.withYouImpact,
    "",
    "CE QUE NOUS ATTENDONS DE VOUS",
    ...profile.expectedFromPartner.map((item) => `- ${item}`),
    "",
    "CE QUE VOUS Y GAGNEZ",
    ...profile.partnerGains.map((item) => `- ${item}`),
    "",
    sponsorshipNote,
    "",
    "PROCHAINE ÉTAPE",
    "Merci de nous renvoyer :",
    "1) Intérêt - oui / à discuter / pas maintenant",
    "2) Contact référent (nom, fonction, email, téléphone / WhatsApp)",
    "3) Modalités envisagées (sponsor, mentorat, communication, bourses, autre)",
    "4) Logo officiel PNG/SVG (si intérêt confirmé)",
    "",
    `Programme : ${hackathonUrl}`,
    profile.website ? `Réf. : ${profile.website}` : "",
    "",
    "Cordialement,",
    "McBuleli Team",
    "Mme Patty B.",
    SUPPORT_EMAIL,
    SUPPORT_PHONES_DISPLAY,
    `WhatsApp : ${SUPPORT_WA_PATH}`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.mint};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.mint};padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:${EMAIL_BRAND.white};border-radius:16px;border:1px solid ${EMAIL_BRAND.border};overflow:hidden;">
          <tr>
            <td style="padding:22px 28px 8px;border-bottom:1px solid ${EMAIL_BRAND.border};">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <img src="${esc(logo)}" width="44" height="44" alt="McBuleli" style="display:block;border:0;border-radius:50%;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:17px;font-weight:800;color:${EMAIL_BRAND.primary};letter-spacing:-0.02em;">McBuleli</p>
                    <p style="margin:2px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">Hackathon IA · ${esc(profile.roleTitle)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Bonjour ${esc(profile.greeting)}</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                ${esc(profile.whyThem)}
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Pourquoi l'IA maintenant
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                ${mintRows(IMPACT_IA_BULLETS)}
              </table>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Où nous en sommes
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 10px;">
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>Dates</strong> - ven. 28 &amp; sam. 29 août 2026, 08h00–17h00</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>Lieu</strong> - Silikin Village, 63 Ave Colonel Mondjiba, Kinshasa</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>Format</strong> - Formation IA (Vibe Coding) + compétition + mentorat + Demo Day</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>Défis</strong> - IA, FinTech, GovTech, Santé, Agriculture, Éducation, Médias, Cybersécurité</td></tr>
              </table>
              <p style="margin:0 0 10px;font-size:14px;line-height:1.5;color:${EMAIL_BRAND.muted};">
                Partenaires déjà confirmés :
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 10px;">
                ${mintRows(CONFIRMED_PARTNERS)}
              </table>
              <p style="margin:0 0 18px;font-size:13px;line-height:1.45;color:${EMAIL_BRAND.muted};">
                D'autres acteurs (campus, médias, services, FinTech) sont en discussion. Réseau d'ambassadeurs universitaires en cours de déploiement.
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Rôle proposé pour ${esc(profile.orgName)}
              </p>
              <p style="margin:0 0 12px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.text};">
                <strong>${esc(profile.roleTitle)}</strong>
                <span style="color:${EMAIL_BRAND.muted};"> (${esc(profile.domainLabel)})</span>
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                ${esc(profile.withYouImpact)}
              </p>

              <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Ce que McBuleli attend de vous
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;">
                ${mintRows(profile.expectedFromPartner)}
              </table>

              <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Ce que vous y gagnez
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 14px;">
                ${mintRows(profile.partnerGains)}
              </table>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.5;color:${EMAIL_BRAND.muted};">
                ${esc(sponsorshipNote)}
              </p>

              <p style="margin:0 0 10px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Prochaine étape
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>1.</strong> Intérêt - oui / à discuter / pas maintenant</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>2.</strong> Contact référent (nom, fonction, email, téléphone / WhatsApp)</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>3.</strong> Modalités (sponsor, mentorat, communication, bourses…)</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>4.</strong> Logo officiel PNG/SVG (si intérêt confirmé)</td></tr>
              </table>

              <p style="margin:0 0 22px;text-align:center;">
                <a href="${esc(hackathonUrl)}" style="display:inline-block;background:${EMAIL_BRAND.primary};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 26px;border-radius:12px;">
                  Voir mcbuleli.org/hackathon
                </a>
              </p>

              <p style="margin:0 0 6px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Cordialement,</p>
              <p style="margin:0;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">
                <strong>McBuleli Team</strong><br />
                Mme Patty B.<br />
                <a href="mailto:${SUPPORT_EMAIL}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${SUPPORT_EMAIL}</a><br />
                ${SUPPORT_PHONES_DISPLAY}<br />
                WhatsApp :
                <a href="${esc(SUPPORT_WA_PATH)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">écrire sur WhatsApp</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 24px;border-top:1px solid ${EMAIL_BRAND.border};text-align:center;">
              <p style="margin:0;font-size:11px;color:${EMAIL_BRAND.muted};">
                © ${year} McBuleli · RCCM : CD/KNG/RCCM/26-A-00382<br />
                <a href="${esc(hackathonUrl)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">mcbuleli.org/hackathon</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, preheader, html, text };
}

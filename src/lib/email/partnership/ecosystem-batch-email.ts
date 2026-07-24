import { EMAIL_BRAND, logoUrl, partnershipPublicBaseUrl } from "@/lib/email/config";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

export type EcosystemBatchPartnerId =
  | "mojes-rdc"
  | "fogec"
  | "fpi-rdc"
  | "pull-up-bw"
  | "ebale-yamozindo"
  | "cnj-rdc"
  | "main-money"
  | "vodacom"
  | "airtel"
  | "kimia-service"
  | "veilleurs-du-web";

export type EcosystemBatchProfile = {
  id: EcosystemBatchPartnerId;
  orgName: string;
  contactEmail: string;
  /** Extra recipients (CC) for production sends only. */
  ccEmails?: string[];
  website: string | null;
  facebook: string | null;
  domainLabel: string;
  roleTitle: string;
  /** One short line on what they do / why we reach out. */
  whyThem: string;
  expectedFromPartner: string[];
  partnerGains: string[];
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const ECOSYSTEM_BATCH_PROFILES: EcosystemBatchProfile[] = [
  {
    id: "mojes-rdc",
    orgName: "MOJES RDC",
    contactEmail: "mojesrdc@gmail.com",
    website: "http://www.mojesrdc.org/",
    facebook: "https://www.facebook.com/Mojesrdc",
    domainLabel: "Entrepreneuriat jeunes",
    roleTitle: "Partenaire Accélération Startups & PME jeunes",
    whyThem:
      "MOJES propulse les startups et PME des jeunes en RDC : accompagnement, induction et structuration de projets - un alignement direct avec un hackathon où les équipes passent du prototype à la crédibilité entrepreneuriale.",
    expectedFromPartner: [
      "Relais auprès de vos porteurs d'idées et projets pour candidater au hackathon",
      "Atelier court ou mentorat : structuration de projet, exécution et posture entrepreneuriale",
      "Option jury / feedback sur les prototypes à potentiel startup",
    ],
    partnerGains: [
      "Visibilité auprès de builders IA et porteurs de projets à Silikin Village",
      "Pipeline de talents et prototypes pour vos programmes d'accompagnement",
      "Positionnement comme propulseur jeunesse-entrepreneuriat dans l'écosystème tech Kinshasa",
    ],
  },
  {
    id: "fogec",
    orgName: "FOGEC",
    contactEmail: "contact@fogec.cd",
    website: "http://fogec.cd/",
    facebook: null,
    domainLabel: "Garantie & financement MPME",
    roleTitle: "Partenaire Accès au financement & bancabilité",
    whyThem:
      "Le FOGEC facilite l'accès au financement des startups, MPME et artisans (garanties, accompagnement, plateforme Bokeli). Nos équipes construisent des produits digitaux qui, demain, devront être bancables.",
    expectedFromPartner: [
      "Intervention courte sur bancabilité, garanties et parcours FOGEC / Bokeli",
      "Mentorat des équipes sur structuration de dossier et crédibilité financière",
      "Option mise en relation post-Demo Day pour projets prometteurs",
    ],
    partnerGains: [
      "Sourcing de projets numériques précoces à accompagner vers le financement",
      "Visibilité institutionnelle auprès de jeunes entrepreneurs tech",
      "Renforcement de votre rôle d'acteur-clé de l'écosystème entrepreneurial digital",
    ],
  },
  {
    id: "fpi-rdc",
    orgName: "Fonds de Promotion de l'Industrie (FPI)",
    contactEmail: "dgkinshasa@fpi-rdc.cd",
    website: "http://fpi-rdc.cd/",
    facebook: "https://www.facebook.com/profile.php?id=61578230795304",
    domainLabel: "Industrie & financement",
    roleTitle: "Partenaire Industrie & Projets jeunes",
    whyThem:
      "Le FPI promeut l'industrie locale et finance notamment des projets industriels de jeunes (ex. programme VIJANA). Le hackathon produit des prototypes qui peuvent nourrir des trajectoires industrielles et d'innovation produit.",
    expectedFromPartner: [
      "Cadrage des enjeux industrie locale / transformation pour les équipes",
      "Mentorat ou jury sur pertinence industrielle et scalabilité des prototypes",
      "Option : relais vers vos programmes d'appui aux jeunes porteurs de projets",
    ],
    partnerGains: [
      "Accès à des prototypes et équipes utiles pour l'innovation industrielle",
      "Visibilité auprès d'un public tech / builders à Kinshasa",
      "Pipeline pour vos dispositifs d'appui aux projets industriels des jeunes",
    ],
  },
  {
    id: "pull-up-bw",
    orgName: "Pull Up Business Women",
    contactEmail: "pullupbw@gmail.com",
    website: "http://pullup.cd/",
    facebook: "https://www.facebook.com/pullupbusinesswomen",
    domainLabel: "Incubation femmes entrepreneures",
    roleTitle: "Partenaire Inclusion & Entrepreneuriat féminin",
    whyThem:
      "Pull Up Business Women (branche Commission Nationale des Femmes Entrepreneures / FEC) accompagne les entrepreneures de l'incubation à la croissance - un partenaire naturel pour l'inclusion et le mentoring au hackathon.",
    expectedFromPartner: [
      "Mobilisation de femmes builders / entrepreneures vers le hackathon",
      "Atelier ou mentorat : pitch, exécution, passage incubation → croissance",
      "Option jury / coaching ciblé pour équipes mixtes ou portées par des femmes",
    ],
    partnerGains: [
      "Visibilité de votre incubateur auprès de l'écosystème tech Kinshasa",
      "Pipeline de projets et talents féminins en phase prototype",
      "Synergies avec partenaires FEC / innovation pour futurs programmes",
    ],
  },
  {
    id: "ebale-yamozindo",
    orgName: "Ebale Ya Mozindo",
    contactEmail: "ebaleyamozindo@gmail.com",
    website: null,
    facebook: "https://www.facebook.com/profile.php?id=100087328825904",
    domainLabel: "Médias & actualité",
    roleTitle: "Partenaire Média & Diffusion",
    whyThem:
      "Ebale Ya Mozindo informe un large public (actualité) : un relais puissant pour faire connaître le hackathon, les défis et les projets qui en sortent.",
    expectedFromPartner: [
      "Couverture / relais des temps forts du McBuleli Hackathon",
      "Diffusion de l'appel à candidatures sur vos canaux",
      "Option interview / contenu sur builders et partenaires le Demo Day",
    ],
    partnerGains: [
      "Accès privilégié au contenu (projets, jury, moments forts)",
      "Visibilité éditoriale comme média de référence sur l'innovation jeunesse",
      "Nouvelles opportunités de partenariats avec acteurs tech et institutions",
    ],
  },
  {
    id: "cnj-rdc",
    orgName: "Conseil National de la Jeunesse (CNJ-RDC)",
    contactEmail: "burea@cnj.cd",
    ccEmails: ["bureaucnjrdc@gmail.com"],
    website: "https://cnj.cd",
    facebook: "https://www.facebook.com/profile.php?id=100075670587419",
    domainLabel: "Jeunesse & représentation nationale",
    roleTitle: "Partenaire Jeunesse & Mobilisation nationale",
    whyThem:
      "Le CNJ-RDC représente, coordonne et accompagne la jeunesse congolaise : plateforme idéale pour mobiliser les jeunes vers l'innovation, l'entrepreneuriat et les compétences numériques.",
    expectedFromPartner: [
      "Relais officiel de l'appel à candidatures auprès des structures de jeunesse",
      "Appui à la mobilisation des jeunes builders (Kinshasa et provinces affiliées)",
      "Option présence / mot d'ouverture ou jury sur l'impact jeunesse",
    ],
    partnerGains: [
      "Visibilité nationale sur un événement tech jeunesse à Silikin Village",
      "Valorisation de votre mission innovation & engagement citoyen des jeunes",
      "Pipeline d'initiatives numériques à accompagner dans vos programmes",
    ],
  },
  {
    id: "main-money",
    orgName: "MainMoney",
    contactEmail: "business@mainmoney.net",
    website: "https://mainmoney.net",
    facebook: "https://www.facebook.com/MainMoneyDRC/",
    domainLabel: "FinTech Paiement",
    roleTitle: "Partenaire Paiement & Inclusion financière",
    whyThem:
      "MainMoney réinvente l'écosystème financier (particuliers, commerçants, entreprises) avec paiements sécurisés et compatibilité Mobile Money - parfaitement aligné avec nos défis FinTech.",
    expectedFromPartner: [
      "Partage d'expérience sur paiements digitaux et adoption en RDC",
      "Mentorat des équipes FinTech (parcours utilisateur, sécurité, commerçants)",
      "Option démo produit / API pendant le hackathon",
    ],
    partnerGains: [
      "Visibilité auprès d'équipes qui construisent des produits transactionnels",
      "Cas d'usage concrets et leads startups / PME digitales",
      "Positionnement innovation paiement dans l'écosystème Kinshasa",
    ],
  },
  {
    id: "vodacom",
    orgName: "Vodacom RDC",
    contactEmail: "corporateaffairs@vodacom.cd",
    ccEmails: ["vodacom@vodacom.cd", "foundation@vodacom.cd"],
    website: "https://vodacom.cd",
    facebook: "https://www.facebook.com/VodacomRDC",
    domainLabel: "Télécoms & M-Pesa",
    roleTitle: "Partenaire Connectivité & Mobile Money",
    whyThem:
      "Vodacom RDC (réseau, data, M-Pesa) est au cœur des usages digitaux et des paiements mobiles. Le hackathon s'appuie déjà sur le rail Mobile Money et forme des builders qui construisent sur ces infrastructures.",
    expectedFromPartner: [
      "Appui connectivité / data pour l'événement (selon possibilités)",
      "Intervention ou mentorat M-Pesa / inclusion financière digitale",
      "Option Fondation : volet jeunesse, compétences numériques ou impact social",
      "Logo partenaire + relais communication Corporate / Fondation",
    ],
    partnerGains: [
      "Visibilité marque auprès de builders, mentors et partenaires à Silikin",
      "Pipeline d'usages et prototypes autour de M-Pesa / data",
      "Alignement RSE / Fondation avec jeunesse, tech et inclusion",
    ],
  },
  {
    id: "airtel",
    orgName: "Airtel RDC",
    contactEmail: "infos@cd.airtel.com",
    website: "https://airtel.cd",
    facebook: null,
    domainLabel: "Télécoms & Airtel Money",
    roleTitle: "Partenaire Connectivité & Airtel Money",
    whyThem:
      "Airtel RDC (connectivité et Airtel Money) est un rail essentiel pour les produits digitaux et le paiement des tickets hackathon. Nous souhaitons un partenariat aligné sur connectivité, mobile money et jeunesse tech.",
    expectedFromPartner: [
      "Appui connectivité / data pour l'événement (selon possibilités)",
      "Intervention ou mentorat Airtel Money / parcours paiement",
      "Logo partenaire + relais sur vos canaux corporate",
    ],
    partnerGains: [
      "Visibilité auprès de builders qui intègrent Mobile Money au quotidien",
      "Cas d'usage concrets autour d'Airtel Money et des services data",
      "Positionnement innovation jeunesse dans l'écosystème Kinshasa",
    ],
  },
  {
    id: "kimia-service",
    orgName: "KIMIA Service",
    contactEmail: "kimiaservice896@gmail.com",
    website: null,
    facebook: "https://www.facebook.com/profile.php?id=61560600003901",
    domainLabel: "Services entreprises & talents",
    roleTitle: "Partenaire Services & Talents",
    whyThem:
      "KIMIA accompagne les besoins personnels et entreprises (services, recrutement, mise en relation) - utile pour relier prototypes, talents et structures qui cherchent des profils opérationnels.",
    expectedFromPartner: [
      "Mentorat court : professionnalisation, posture, mise en marché des services",
      "Option relais offres / talents vers les équipes du hackathon",
      "Logo partenaire + diffusion auprès de votre réseau entreprises",
    ],
    partnerGains: [
      "Accès à un vivier de talents tech / builders en action",
      "Visibilité B2B auprès de startups et partenaires à Silikin",
      "Pipeline de missions et profils pour vos clients entreprises",
    ],
  },
  {
    id: "veilleurs-du-web",
    orgName: "Veilleurs du web RDC",
    contactEmail: "veilleursduwebrdc@gmail.com",
    website: null,
    facebook: "https://www.facebook.com/veilleursduwebrdc",
    domainLabel: "Cybersécurité citoyenne & médias",
    roleTitle: "Partenaire Cybersécurité & Web positif",
    whyThem:
      "Initiative UNICEF : les Veilleurs du web RDC luttent contre les fausses informations et la violence en ligne pour un web congolais plus positif - aligné avec nos défis Médias et Cybersécurité.",
    expectedFromPartner: [
      "Atelier ou sensibilisation : désinformation, violence en ligne, web positif",
      "Mentorat des équipes sur les défis Médias / Cybersécurité",
      "Relais de l'appel à candidatures auprès de votre communauté (~60K)",
    ],
    partnerGains: [
      "Visibilité nationale sur un hackathon IA jeunesse à Kinshasa",
      "Prototypes concrets utiles à la lutte contre la désinformation",
      "Positionnement référence « web positif » dans l'écosystème tech",
    ],
  },
];

export function getEcosystemBatchProfile(
  id: EcosystemBatchPartnerId,
): EcosystemBatchProfile {
  const profile = ECOSYSTEM_BATCH_PROFILES.find((p) => p.id === id);
  if (!profile) throw new Error(`Unknown partner id: ${id}`);
  return profile;
}

export type EcosystemBatchEmailCopy = {
  subject: string;
  preheader: string;
  html: string;
  text: string;
};

export function buildEcosystemBatchEmail(
  profile: EcosystemBatchProfile,
): EcosystemBatchEmailCopy {
  const hackathonUrl = `${partnershipPublicBaseUrl()}/hackathon`;
  const logo = logoUrl();
  const year = new Date().getFullYear();

  const subject = `Partenariat sur mesure - ${profile.orgName} × McBuleli Hackathon`;
  const preheader =
    "Programme 2 Jours (28–29 Août 2026, Silikin Village) - rôle partenaire sur mesure, valeur claire pour votre organisation.";

  const text = [
    `Bonjour l'équipe ${profile.orgName},`,
    "",
    profile.whyThem,
    "",
    "Nous organisons le McBuleli Hackathon à Kinshasa : 2 Jours (28–29 Août 2026, 08h00–17h00) de bootcamp Vibe Coding, build produit et Demo Day au Silikin Village.",
    "",
    "PROGRAMME (2 JOURS)",
    "- 28 Août 2026 - Vendredi Bootcamp & Build (08h00-17h00)",
    "- 29 Août 2026 - Samedi Build & Demo Day (08h00-17h00)",
    "Lieu : Silikin Village, Kinshasa",
    "Statut lieu : en attente d'approbation finale de Silikin Village",
    "",
    "Le hackathon couvre 8 défis : IA, FinTech, GovTech, Santé, Agriculture, Éducation, Médias, Cybersécurité.",
    "",
    `RÔLE PROPOSÉ POUR ${profile.orgName.toUpperCase()}`,
    `${profile.roleTitle} (${profile.domainLabel})`,
    "",
    "CE QUE NOUS ATTENDONS DE VOUS",
    ...profile.expectedFromPartner.map((item) => `- ${item}`),
    "",
    "CE QUE VOUS Y GAGNEZ",
    ...profile.partnerGains.map((item) => `- ${item}`),
    "",
    "Ce n'est pas d'abord une demande de sponsoring cash.",
    "",
    "PROCHAINE ÉTAPE",
    "Merci de nous renvoyer :",
    "1) Contact référent (nom, email, téléphone / WhatsApp)",
    "2) Logo officiel (PNG ou SVG)",
    "3) Option retenue (atelier, mentorat, jury, diffusion, etc.)",
    "",
    `Programme : ${hackathonUrl}`,
    profile.website ? `Votre site : ${profile.website}` : "",
    profile.facebook ? `Facebook : ${profile.facebook}` : "",
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

  const expectedRows = profile.expectedFromPartner
    .map(
      (item) =>
        `<tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">${esc(item)}</td></tr>`,
    )
    .join(
      '<tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>',
    );

  const gainsRows = profile.partnerGains
    .map(
      (item) =>
        `<tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">${esc(item)}</td></tr>`,
    )
    .join(
      '<tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>',
    );

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
                    <p style="margin:2px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">Hackathon IA · Partenariat sur mesure</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Bonjour l'équipe ${esc(profile.orgName)},</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                ${esc(profile.whyThem)}
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Nous organisons le <strong style="color:${EMAIL_BRAND.text};">McBuleli Hackathon</strong> à Kinshasa :
                2 Jours (28–29 Août 2026, 08h00–17h00) de bootcamp Vibe Coding, build produit et Demo Day devant jury/partenaires au Silikin Village.
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Programme (2 Jours)
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 10px;">
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>28 Août 2026</strong> - Vendredi Bootcamp &amp; Build (08h00–17h00)</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>29 Août 2026</strong> - Samedi Build &amp; Demo Day (08h00–17h00)</td></tr>
              </table>
              <p style="margin:0 0 16px;font-size:13px;line-height:1.45;color:${EMAIL_BRAND.muted};">
                Lieu : Silikin Village, Kinshasa · <strong style="color:${EMAIL_BRAND.text};">Statut :</strong> en attente d'approbation finale de Silikin Village.
              </p>

              <p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Le hackathon couvre <strong style="color:${EMAIL_BRAND.text};">8 défis</strong> : IA, FinTech, GovTech, Santé, Agriculture, Éducation, Médias et Cybersécurité.
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Rôle proposé pour ${esc(profile.orgName)}
              </p>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.text};">
                <strong>${esc(profile.roleTitle)}</strong> <span style="color:${EMAIL_BRAND.muted};">(${esc(profile.domainLabel)})</span>
              </p>

              <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Ce que McBuleli attend de vous
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;">
                ${expectedRows}
              </table>

              <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Ce que vous y gagnez
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 14px;">
                ${gainsRows}
              </table>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.5;color:${EMAIL_BRAND.muted};">
                Ce n'est <strong style="color:${EMAIL_BRAND.text};">pas</strong> d'abord une demande de sponsoring cash.
              </p>

              <p style="margin:0 0 10px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Prochaine étape
              </p>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Merci de nous renvoyer : (1) contact référent, (2) logo officiel PNG/SVG, (3) option retenue (atelier, mentorat, jury, diffusion...).
              </p>

              <p style="margin:0 0 22px;text-align:center;">
                <a href="${esc(hackathonUrl)}" style="display:inline-block;background:${EMAIL_BRAND.primary};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 26px;border-radius:12px;">
                  Consulter le programme McBuleli Hackathon
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

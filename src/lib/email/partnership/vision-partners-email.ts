import { EMAIL_BRAND, logoUrl, partnershipPublicBaseUrl } from "@/lib/email/config";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

export type VisionPartnerId =
  | "ilokwe-group"
  | "agro-green-corp"
  | "carmy-nany"
  | "iita-cgiar"
  | "fintech-medias"
  | "palabres-fintech"
  | "kinpay-xpay"
  | "serdipay"
  | "netikash"
  | "maishapay"
  | "mbote"
  | "rdpi-thinktank"
  | "africa-tech-invest"
  | "inpp";

export type VisionPartnerProfile = {
  id: VisionPartnerId;
  orgName: string;
  contactEmail: string | null;
  website: string | null;
  facebook: string | null;
  domainLabel: string;
  roleTitle: string;
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

export const VISION_PARTNER_PROFILES: VisionPartnerProfile[] = [
  {
    id: "ilokwe-group",
    orgName: "ILOKWE GROUP",
    contactEmail: "ilokwegroup@gmail.com",
    website: null,
    facebook: "https://www.facebook.com/profile.php?id=100065743382631",
    domainLabel: "Agriculture",
    roleTitle: "Partenaire Agriculture & AgriBusiness",
    expectedFromPartner: [
      "Atelier court sur rentabilité agricole, exécution terrain et chaîne de valeur (option retenue)",
      "Mentorat des équipes AgroTech (production, marché, distribution)",
      "Référence terrain du défi AgroTech : moderniser la chaîne de production",
      "Option jury sur les prototypes AgriTech · premier prix nommé Prix ILOKWE",
    ],
    partnerGains: [
      "Visibilité auprès des jeunes builders et porteurs de projets",
      "Accès à des prototypes utiles pour l'agri-business local",
      "Pipeline de talents pour projets agricoles digitaux",
      "Naming du premier prix : Prix ILOKWE",
    ],
  },
  {
    id: "agro-green-corp",
    orgName: "Agro Green Corp RDC",
    contactEmail: "agrogreencorprdc@gmail.com",
    website: null,
    facebook: "https://www.facebook.com/Agrogreencorprdc",
    domainLabel: "Agriculture",
    roleTitle: "Partenaire Agriculture Durable",
    expectedFromPartner: [
      "Partage de cas d'usage agriculture durable et transformation locale",
      "Mentorat pour prototypes agri, logistique et commercialisation",
      "Logo partenaire + présence thématique sur le hackathon",
    ],
    partnerGains: [
      "Positionnement innovation agricole auprès d'un public tech",
      "Visibilité de marque auprès d'étudiants et entrepreneurs",
      "Opportunité d'identifier des équipes pour pilotes terrain",
    ],
  },
  {
    id: "carmy-nany",
    orgName: "Carmy Nany",
    contactEmail: "carmynany1@gmail.com",
    website: null,
    facebook: "https://www.facebook.com/profile.php?id=61566552830673",
    domainLabel: "Entrepreneuriat",
    roleTitle: "Partenaire Communauté & Entrepreneuriat",
    expectedFromPartner: [
      "Relais communauté et mobilisation de profils entrepreneurs",
      "Intervention courte sur lancement de projet et exécution",
      "Mentorat soft skills / pitch pour équipes sélectionnées",
    ],
    partnerGains: [
      "Visibilité auprès d'un écosystème tech en croissance",
      "Accès à des startups en phase prototype",
      "Synergies pour futurs programmes d'accompagnement",
    ],
  },
  {
    id: "iita-cgiar",
    orgName: "IITA Kinshasa / CGIAR",
    contactEmail: "iita-kinshasa@cgiar.org",
    website: "https://www.cgiar.org/",
    facebook: null,
    domainLabel: "Agriculture & Recherche",
    roleTitle: "Partenaire Recherche AgriTech",
    expectedFromPartner: [
      "Cadrage d'un ou plusieurs défis agriculture orientés impact",
      "Mentorat scientifique / terrain sur les solutions proposées",
      "Participation optionnelle au jury des défis agriculture",
    ],
    partnerGains: [
      "Accès à des prototypes numériques orientés problématiques terrain",
      "Visibilité auprès de jeunes talents IA et produit",
      "Pipeline d'initiatives co-construites avec l'écosystème local",
    ],
  },
  {
    id: "fintech-medias",
    orgName: "FinTech Medias",
    contactEmail: "contact@fintechmedias.cd",
    website: "https://fintechmedias.cd/",
    facebook: "https://www.facebook.com/FinTechMedias",
    domainLabel: "FinTech & Media",
    roleTitle: "Partenaire Média FinTech",
    expectedFromPartner: [
      "Couverture média des temps forts FinTech du hackathon",
      "Relais de l'appel à candidatures sur vos canaux",
      "Intervention courte sur tendances FinTech en RDC",
    ],
    partnerGains: [
      "Accès privilégié au contenu du hackathon (projets, interviews, jury)",
      "Visibilité éditoriale comme média FinTech de référence",
      "Nouvelles opportunités de partenariats avec startups et sponsors",
    ],
  },
  {
    id: "palabres-fintech",
    orgName: "Palabres Fintech",
    contactEmail: "contact@palabresfintech.com",
    website: "https://palabresfintech.com/",
    facebook: "https://www.facebook.com/profile.php?id=61556201261775",
    domainLabel: "FinTech",
    roleTitle: "Partenaire Écosystème FinTech",
    expectedFromPartner: [
      "Animation d'un échange sur innovation, conformité et inclusion financière",
      "Mentorat des équipes sur les cas d'usage paiement / wallet",
      "Mise en relation avec acteurs FinTech pertinents",
    ],
    partnerGains: [
      "Visibilité forte auprès des builders IA et produit",
      "Positionnement comme acteur structurant de la conversation FinTech",
      "Détection de projets à fort potentiel",
    ],
  },
  {
    id: "kinpay-xpay",
    orgName: "KinPay / XPAY CASH",
    contactEmail: null,
    website: "https://kinpay.cd/",
    facebook: "https://www.facebook.com/XPAYCASH01",
    domainLabel: "FinTech Paiement",
    roleTitle: "Partenaire Paiement Mobile",
    expectedFromPartner: [
      "Partage d'expérience sur paiements digitaux en contexte RDC",
      "Mentorat des équipes sur intégration paiement et adoption utilisateur",
      "Option démo produit pendant le hackathon",
    ],
    partnerGains: [
      "Visibilité auprès d'équipes qui construisent des produits transactionnels",
      "Cas d'usage concrets pour l'adoption de vos rails de paiement",
      "Lead qualifiés (startups et PME digitales)",
    ],
  },
  {
    id: "serdipay",
    orgName: "SerdiPay",
    contactEmail: "info@serdipay.com",
    website: "https://serdipay.com/",
    facebook: "https://www.facebook.com/profile.php?id=61560847979113",
    domainLabel: "FinTech Paiement",
    roleTitle: "Partenaire APIs Paiement",
    expectedFromPartner: [
      "Atelier technique sur intégration API paiement / USSD",
      "Mentorat FinTech pour les équipes des défis paiement",
      "Option jury sur la robustesse produit et parcours paiement",
    ],
    partnerGains: [
      "Accès à des prototypes qui peuvent intégrer vos services",
      "Visibilité développeur / startup dans l'écosystème Kinshasa",
      "Positionnement innovation sur les usages paiement en RDC",
    ],
  },
  {
    id: "netikash",
    orgName: "Netikash",
    contactEmail: "contact@netikash.com",
    website: "https://www.netikash.com/",
    facebook: "https://www.facebook.com/netikash",
    domainLabel: "FinTech & E-commerce",
    roleTitle: "Partenaire Paiement & E-commerce",
    expectedFromPartner: [
      "Atelier court sur paiements e-commerce et conversion",
      "Mentorat produits marketplace / checkout / abonnement",
      "Option présence démo sur parcours de paiement local",
    ],
    partnerGains: [
      "Visibilité auprès d'équipes e-commerce et marketplace",
      "Pistes d'intégration sur de nouveaux cas d'usage",
      "Accès à talents produit et ingénierie",
    ],
  },
  {
    id: "maishapay",
    orgName: "MaishaPay",
    contactEmail: "contact@maishapay.net",
    website: "https://www.maishapay.net/",
    facebook: "https://www.facebook.com/maishapay",
    domainLabel: "FinTech Paiement",
    roleTitle: "Partenaire Gateway & POS",
    expectedFromPartner: [
      "Partage d'expérience sur paiements omnicanaux (POS + online)",
      "Mentorat des équipes sur cas d'usage checkout / merchant tools",
      "Option support jury pour les prototypes FinTech",
    ],
    partnerGains: [
      "Visibilité auprès de fondateurs et marchands digitaux",
      "Nouveaux scénarios d'usage pour vos produits",
      "Leads startups en phase de build",
    ],
  },
  {
    id: "mbote",
    orgName: "Mbote.cd",
    contactEmail: "info@mbote.cd",
    website: "https://mbote.cd/",
    facebook: "https://www.facebook.com/mbotecd",
    domainLabel: "Médias",
    roleTitle: "Partenaire Média & Amplification",
    expectedFromPartner: [
      "Couverture média des étapes clés (ouverture, Demo Day, prix)",
      "Relais social pour attirer participants et audience",
      "Format interview des équipes / mentors / partenaires",
    ],
    partnerGains: [
      "Accès exclusif à des histoires startup locales",
      "Contenu premium tech/jeunesse pour vos canaux",
      "Positionnement comme média de référence sur l'innovation congolaise",
    ],
  },
  {
    id: "rdpi-thinktank",
    orgName: "RDPI Think Tank",
    contactEmail: "info@rdpithinktank.org",
    website: "https://rdpithinktank.org/",
    facebook: "https://www.facebook.com/profile.php?id=61563273011384",
    domainLabel: "Policy & Think Tank",
    roleTitle: "Partenaire Policy & Impact",
    expectedFromPartner: [
      "Cadre d'analyse impact / politiques publiques pour certains défis",
      "Intervention sur innovation, régulation et adoption",
      "Contribution jury sur pertinence socio-économique des solutions",
    ],
    partnerGains: [
      "Accès à des prototypes concrets à analyser et valoriser",
      "Visibilité auprès d'un public jeune orienté action",
      "Renforcement de votre rôle d'acteur d'idées appliquées",
    ],
  },
  {
    id: "africa-tech-invest",
    orgName: "Africa Tech Invest",
    contactEmail: "contact@anemonetech.com",
    website: "https://africatechinvest.com/",
    facebook: "https://www.facebook.com/Africatechinvest",
    domainLabel: "Innovation & Investissement",
    roleTitle: "Partenaire Innovation & Investissement",
    expectedFromPartner: [
      "Appui sur la dimension investissement / scaling des projets",
      "Intervention ou mentorat sur pitch investisseurs",
      "Mise en visibilité croisée des initiatives tech locales",
    ],
    partnerGains: [
      "Sourcing de projets précoces à fort potentiel",
      "Visibilité conjointe sur un public startup/builder",
      "Synergies événementielles futures dans l'écosystème tech RDC",
    ],
  },
  {
    id: "inpp",
    orgName: "INPP",
    contactEmail: "contact@inpp.cd",
    website: "https://inpp.cd/",
    facebook: "https://www.facebook.com/inppofficiel",
    domainLabel: "Formation professionnelle",
    roleTitle: "Partenaire Compétences & Employabilité",
    expectedFromPartner: [
      "Mobilisation d'apprenants et encadreurs vers le hackathon",
      "Contribution atelier sur compétences professionnelles attendues",
      "Option parcours post-hackathon pour talents prometteurs",
    ],
    partnerGains: [
      "Visibilité auprès de jeunes talents tech en action",
      "Pipeline de profils pour vos programmes de montée en compétences",
      "Positionnement comme acteur central de l'employabilité numérique",
    ],
  },
];

export function getVisionPartnerProfile(id: VisionPartnerId): VisionPartnerProfile {
  const profile = VISION_PARTNER_PROFILES.find((p) => p.id === id);
  if (!profile) throw new Error(`Unknown partner id: ${id}`);
  return profile;
}

export type VisionPartnerEmailCopy = {
  subject: string;
  preheader: string;
  html: string;
  text: string;
};

export function buildVisionPartnerEmail(profile: VisionPartnerProfile): VisionPartnerEmailCopy {
  const hackathonUrl = `${partnershipPublicBaseUrl()}/hackathon`;
  const logo = logoUrl();
  const year = new Date().getFullYear();

  const subject = `Partenariat sur mesure - ${profile.orgName} × McBuleli Hackathon`;
  const preheader =
    "Programme 3 jours (12-14 août 2026, sous réserve Silikin) - rôle partenaire sur mesure, valeur claire pour votre organisation.";

  const text = [
    `Bonjour l'équipe ${profile.orgName},`,
    "",
    "Nous organisons le McBuleli Hackathon à Kinshasa : 3 jours de bootcamp Vibe Coding, build produit et Demo Day.",
    "",
    "PROGRAMME (3 JOURS)",
    "- 12 août 2026 - Jour 1 Bootcamp & lancement (08h00-13h30)",
    "- 13 août 2026 - Jour 2 Build Day & mentorat (08h00-13h30)",
    "- 14 août 2026 - Jour 3 Demo Day & cérémonie (08h00-13h30)",
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
  ].filter(Boolean).join("\n");

  const expectedRows = profile.expectedFromPartner
    .map(
      (item) =>
        `<tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">${esc(item)}</td></tr>`,
    )
    .join('<tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>');

  const gainsRows = profile.partnerGains
    .map(
      (item) =>
        `<tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">${esc(item)}</td></tr>`,
    )
    .join('<tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>');

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
                Nous organisons le <strong style="color:${EMAIL_BRAND.text};">McBuleli Hackathon</strong> à Kinshasa :
                3 jours de bootcamp Vibe Coding, build produit et Demo Day devant jury/partenaires.
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Programme (3 jours)
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 10px;">
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>12 août 2026</strong> - Jour 1 Bootcamp &amp; lancement (08h00-13h30)</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>13 août 2026</strong> - Jour 2 Build Day &amp; mentorat (08h00-13h30)</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>14 août 2026</strong> - Jour 3 Demo Day &amp; cérémonie (08h00-13h30)</td></tr>
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
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                ${gainsRows}
              </table>

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

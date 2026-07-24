/**
 * Campus / student visibility partners - McBuleli Hackathon.
 * Same collab offer for all: 2 seats, -10% code, 10 USD cashback per paid signup.
 * French accents in copy; emails, URLs and HTML attributes stay ASCII.
 * Font: Poppins (Google Fonts) with Arial/Helvetica fallback.
 */
import { EMAIL_BRAND, logoUrl, partnershipPublicBaseUrl } from "@/lib/email/config";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

export type CampusVisibilityId =
  | "ista-coord"
  | "hec-coord"
  | "upn-rectorat"
  | "omnia"
  | "upc"
  | "aba-kin"
  | "univ-realites"
  | "rijec"
  | "bietu"
  | "mangina-carlos";

export type CampusVisibilityKind =
  | "coordination"
  | "university"
  | "media"
  | "creator"
  | "digital";

export type CampusVisibilityProfile = {
  id: CampusVisibilityId;
  orgName: string;
  greeting: string;
  /** ASCII email only */
  contactEmail: string;
  /** ASCII URL only */
  website: string | null;
  facebook: string | null;
  kind: CampusVisibilityKind;
  roleTitle: string;
  whyThem: string;
  expectedFromPartner: string[];
  partnerGains: string[];
};

const FONT =
  "'Poppins',Arial,Helvetica,sans-serif";

export const CAMPUS_VISIBILITY_PROFILES: CampusVisibilityProfile[] = [
  {
    id: "ista-coord",
    orgName: "Coordination Estudiantine DEISTA (ISTA Kinshasa)",
    greeting: "Bonjour la Coordination Estudiantine DEISTA,",
    contactEmail: "coordinationestudiantinedeista@gmail.com",
    website: null,
    facebook: "https://www.facebook.com/profile.php?id=61551668947648",
    kind: "coordination",
    roleTitle: "Relais campus ISTA",
    whyThem:
      "L'ISTA forme des profils techniques appliqués - exactement le public builders que nous voulons autour des équipes du McBuleli Hackathon à Silikin Village.",
    expectedFromPartner: [
      "Diffusion sur vos canaux estudiantins (groupes, Facebook, WhatsApp)",
      "Point focal COM jusqu'à l'événement",
      "Mobilisation d'étudiants motivés vers l'inscription",
    ],
    partnerGains: [
      "2 places offertes pour la Coordination / ambassadeurs",
      "Code promo campus -10% pour vos étudiants",
      "Cashback 10 USD par inscription payée via votre code",
      "Mention Relais campus ISTA sur nos supports",
    ],
  },
  {
    id: "hec-coord",
    orgName: "Coordination Estudiantine HEC Kinshasa",
    greeting: "Bonjour la Coordination Estudiantine HEC / cellule COM,",
    contactEmail: "coordinationheckin@gmail.com",
    website: null,
    facebook: "https://www.facebook.com/Hauteecoledecommerce",
    kind: "coordination",
    roleTitle: "Relais campus HEC",
    whyThem:
      "La HEC regroupe des étudiants en commerce et gestion : un relais fort pour des équipes qui allient produit numérique et vision business au hackathon.",
    expectedFromPartner: [
      "Publicité sur vos canaux universitaires (stratégie COM HEC)",
      "Point focal cellule COM",
      "Relais clair : programme payant + accès campus (places + code)",
    ],
    partnerGains: [
      "2 places offertes pour la Coordination / cellule COM",
      "Code promo campus -10%",
      "Cashback 10 USD par inscription payée via votre code",
      "Mention Relais campus HEC",
    ],
  },
  {
    id: "upn-rectorat",
    orgName: "Université Pédagogique Nationale (UPN)",
    greeting: "Madame, Monsieur,",
    contactEmail: "rectorat@upnrdc.net",
    website: "https://upn.ac.cd/",
    facebook: "https://www.facebook.com/profile.php?id=100091745986585",
    kind: "university",
    roleTitle: "Campus Partner UPN",
    whyThem:
      "L'UPN est un pilier de l'enseignement supérieur à Kinshasa. Nous souhaitons ouvrir le McBuleli Hackathon aux étudiants UPN via un partenariat de diffusion simple et gagnant-gagnant.",
    expectedFromPartner: [
      "Relais officiel vers associations estudiantines / filières intéressées",
      "Autorisation de diffusion du message campus validé",
      "Point de contact pour le suivi des inscriptions",
    ],
    partnerGains: [
      "2 places offertes (ambassadeurs campus)",
      "Code promo campus -10%",
      "Cashback 10 USD par inscription payée via le code UPN",
      "Statut Campus Partner + logo sur la page hackathon",
    ],
  },
  {
    id: "omnia",
    orgName: "Université Omnia Omnibus",
    greeting: "Bonjour l'équipe Omnia Omnibus,",
    contactEmail: "contact@universiteomniaomnibus.com",
    website: "https://universiteomniaomnibus.com",
    facebook: "https://www.facebook.com/omniaUniversite",
    kind: "university",
    roleTitle: "Campus Partner Omnia Omnibus",
    whyThem:
      "Omnia Omnibus forme notamment en Sciences Informatiques - un alignement direct avec un hackathon IA / Vibe Coding orienté prototypes utiles pour la RDC.",
    expectedFromPartner: [
      "Relais auprès des étudiants (surtout Sciences Informatiques)",
      "Diffusion sur vos canaux institutionnels",
      "Point focal partenariat / communication",
    ],
    partnerGains: [
      "2 places offertes",
      "Code promo campus -10%",
      "Cashback 10 USD par inscription payée via votre code",
      "Statut Campus Partner + visibilité builders à Silikin",
    ],
  },
  {
    id: "upc",
    orgName: "Université Protestante au Congo (UPC)",
    greeting: "Bonjour l'équipe UPC,",
    contactEmail: "info@upc.ac.cd",
    website: "https://upc.ac.cd",
    facebook: "https://www.facebook.com/UPCofficiel",
    kind: "university",
    roleTitle: "Campus Partner UPC",
    whyThem:
      "L'UPC dispose d'une Faculté des Sciences Informatiques et d'un large public étudiant à Kinshasa - idéal pour constituer des équipes solides au McBuleli Hackathon.",
    expectedFromPartner: [
      "Relais vers Sciences Informatiques et filières intéressées",
      "Diffusion sur vos canaux officiels",
      "Point focal pour le suivi",
    ],
    partnerGains: [
      "2 places offertes",
      "Code promo campus -10%",
      "Cashback 10 USD par inscription payée via votre code",
      "Statut Campus Partner + mention sur nos supports",
    ],
  },
  {
    id: "aba-kin",
    orgName: "Académie des Beaux-Arts de Kinshasa",
    greeting: "Madame, Monsieur,",
    contactEmail: "direction@academie-kinshasa.cd",
    website: "https://academie-kinshasa.cd",
    facebook: "https://www.facebook.com/profile.php?id=100064631414806",
    kind: "university",
    roleTitle: "Campus Partner Design et identité visuelle",
    whyThem:
      "L'Académie des Beaux-Arts forme designers et graphistes : des compétences clés pour l'identité visuelle, l'UX et le pitch des équipes du hackathon.",
    expectedFromPartner: [
      "Relais auprès des étudiants design / graphisme",
      "Diffusion sur vos canaux",
      "Option : regard créatif / mentorat court sur la présentation visuelle",
    ],
    partnerGains: [
      "2 places offertes",
      "Code promo campus -10%",
      "Cashback 10 USD par inscription payée via votre code",
      "Mise en avant du rôle design dans les équipes",
    ],
  },
  {
    id: "univ-realites",
    orgName: "Univ Réalités",
    greeting: "Bonjour l'équipe Univ Réalités,",
    contactEmail: "univrealites@gmail.com",
    website: null,
    facebook: "https://www.facebook.com/univrealites",
    kind: "media",
    roleTitle: "Média partenaire campus",
    whyThem:
      "Univ Réalités informe la vie universitaire : vous êtes le canal naturel pour expliquer clairement un hackathon payant avec accès campus (places + code), sans confusion.",
    expectedFromPartner: [
      "Couverture / posts sur vos canaux",
      "Message validé : programme payant + offre campus transparente",
      "Option interview / reportage autour de Silikin",
    ],
    partnerGains: [
      "2 places / badges couverture",
      "Code promo -10% pour votre audience",
      "Cashback 10 USD par inscription payée via votre code",
      "Mention Média partenaire + accès contenu",
    ],
  },
  {
    id: "rijec",
    orgName: "RIJEC",
    greeting: "Bonjour l'équipe RIJEC,",
    contactEmail: "contact@rijec.org",
    website: "https://rijec.org",
    facebook: "https://www.facebook.com/profile.php?id=61571808353522",
    kind: "media",
    roleTitle: "Partenaire diffusion jeunesse / campus",
    whyThem:
      "RIJEC touche une audience jeunesse et campus : un relais utile pour faire connaître le McBuleli Hackathon avec une offre gagnant-gagnant concrète.",
    expectedFromPartner: [
      "Diffusion sur vos canaux (site, Facebook, réseaux)",
      "Message clair sur l'offre (2 places, -10%, cashback)",
      "Point focal communication",
    ],
    partnerGains: [
      "2 places offertes",
      "Code promo -10%",
      "Cashback 10 USD par inscription payée via votre code",
      "Mention partenaire diffusion + accès événement",
    ],
  },
  {
    id: "bietu",
    orgName: "Bietu",
    greeting: "Bonjour l'équipe Bietu,",
    contactEmail: "bietuinfos@gmail.com",
    website: "https://bietu.info",
    facebook: "https://www.facebook.com/bietu.cd",
    kind: "digital",
    roleTitle: "Partenaire visibilité digitale",
    whyThem:
      "Bietu accompagne la transformation digitale et le marketing : nous cherchons un relais digital concret pour faire connaître le hackathon auprès des jeunes et des campus de Kinshasa.",
    expectedFromPartner: [
      "Diffusion sur vos canaux digitaux",
      "Option : supports / posts pour la campagne campus",
      "Point focal suivi",
    ],
    partnerGains: [
      "2 places offertes",
      "Code promo -10%",
      "Cashback 10 USD par inscription payée via votre code",
      "Mention partenaire digital",
    ],
  },
  {
    id: "mangina-carlos",
    orgName: "Mangina Carlos",
    greeting: "Bonjour Carlos,",
    contactEmail: "mangingacarlos@gmail.com",
    website: null,
    facebook: "https://www.facebook.com/profile.php?id=100071168913406",
    kind: "creator",
    roleTitle: "Ambassadeur contenu campus",
    whyThem:
      "Tu crées du contenu autour de l'université : tu peux expliquer simplement l'offre campus (2 places, -10%, cashback) et aider des étudiants à rejoindre des équipes au hackathon.",
    expectedFromPartner: [
      "3 contenus courts (reels / posts) avec message validé",
      "Relais honnête : programme payant + accès via code campus",
      "Lien d'inscription McBuleli",
    ],
    partnerGains: [
      "2 places offertes",
      "Code promo -10% pour ton audience",
      "Cashback 10 USD par inscription payée via ton code",
      "Brief + visuels fournis",
    ],
  },
];

export function getCampusVisibilityProfile(
  id: CampusVisibilityId,
): CampusVisibilityProfile {
  const p = CAMPUS_VISIBILITY_PROFILES.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown campus visibility id: ${id}`);
  return p;
}

export type CampusVisibilityEmailCopy = {
  subject: string;
  preheader: string;
  html: string;
  text: string;
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function bulletRows(items: string[]): string {
  return items
    .map(
      (item, i) => `<tr>
      <td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};font-family:${FONT};">
        ${esc(item)}
      </td>
    </tr>${
      i < items.length - 1
        ? `<tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>`
        : ""
    }`,
    )
    .join("");
}

export function buildCampusVisibilityEmail(
  profile: CampusVisibilityProfile,
): CampusVisibilityEmailCopy {
  const hackathonUrl = `${partnershipPublicBaseUrl()}/hackathon`;
  const logo = logoUrl();
  const year = new Date().getFullYear();

  const subject = `McBuleli Hackathon x ${profile.orgName} - partenariat diffusion campus`;
  const preheader =
    "Même offre pour tous : 2 places, code -10%, cashback 10 USD / inscription payée. Format ~12 équipes à Silikin.";

  const offerLines = [
    "2 places offertes pour votre structure",
    "Code promo : -10% (90 USD au lieu de 100)",
    "Cashback : 10 USD par inscription payée via votre code",
    "Format : ~12 équipes - 2 Jours (13–14 Août 2026, 08h00–17h00) à Silikin Village",
  ];

  const text = [
    profile.greeting,
    "",
    "Nous sommes McBuleli (mcbuleli.org). Nous organisons le McBuleli Hackathon à Silikin Village (Kinshasa) : bootcamp Vibe Coding (Cursor, Claude, Codex), compétition en équipes, mentorat et Demo Day.",
    "",
    profile.whyThem,
    "",
    `Programme : ${hackathonUrl}`,
    "",
    "Précision importante : le programme est payant (100 USD / participant). Nous ne vous demandons pas de vendre à froid : nous proposons un partenariat de diffusion gagnant-gagnant, avec les mêmes conditions pour tous.",
    "",
    "OFFRE (identique pour tous)",
    ...offerLines.map((l) => `- ${l}`),
    "",
    `Rôle proposé : ${profile.roleTitle}`,
    "",
    "Ce que nous attendons",
    ...profile.expectedFromPartner.map((l) => `- ${l}`),
    "",
    "Ce que vous gagnez",
    ...profile.partnerGains.map((l) => `- ${l}`),
    "",
    "Prochaine étape : confirmez votre intérêt et un point focal. Nous envoyons ensuite le code campus, les textes et les visuels de diffusion.",
    "",
    "Cordialement,",
    "McBuleli Team",
    "Mme Patty B.",
    SUPPORT_EMAIL,
    SUPPORT_PHONES_DISPLAY,
    `WhatsApp : ${SUPPORT_WA_PATH}`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <title>${esc(subject)}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.mint};font-family:${FONT};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.mint};padding:28px 16px;font-family:${FONT};">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${EMAIL_BRAND.border};font-family:${FONT};">
          <tr>
            <td style="padding:22px 24px 8px;text-align:center;font-family:${FONT};">
              <img src="${logo}" alt="McBuleli" width="48" height="48" style="display:inline-block;border-radius:12px;" />
              <p style="margin:12px 0 0;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${EMAIL_BRAND.primary};font-family:${FONT};">McBuleli Hackathon</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 4px;font-family:${FONT};">
              <h1 style="margin:0;font-size:22px;line-height:1.3;color:${EMAIL_BRAND.text};font-family:${FONT};font-weight:800;">Partenariat diffusion campus</h1>
              <p style="margin:8px 0 0;font-size:14px;color:${EMAIL_BRAND.muted};font-family:${FONT};">${esc(profile.roleTitle)} - ${esc(profile.orgName)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 8px;font-family:${FONT};">
              <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-family:${FONT};">${esc(profile.greeting)}</p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-family:${FONT};">
                Nous organisons le <strong style="color:${EMAIL_BRAND.text};">McBuleli Hackathon</strong> à Silikin Village :
                bootcamp Vibe Coding, compétition en équipes, mentorat et Demo Day.
              </p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-family:${FONT};">${esc(profile.whyThem)}</p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-family:${FONT};">
                <strong style="color:${EMAIL_BRAND.text};">Précision :</strong> le programme est payant (100 USD).
                Nous proposons un partenariat de diffusion gagnant-gagnant - mêmes conditions pour tous -
                pour que votre audience ait un accès réel (places + code), sans vente à froid.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px;font-family:${FONT};">
              <p style="margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${EMAIL_BRAND.primary};font-family:${FONT};">Offre (identique pour tous)</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${bulletRows(offerLines)}</table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 8px;font-family:${FONT};">
              <p style="margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${EMAIL_BRAND.primary};font-family:${FONT};">Ce que nous attendons</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${bulletRows(profile.expectedFromPartner)}</table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 8px;font-family:${FONT};">
              <p style="margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${EMAIL_BRAND.primary};font-family:${FONT};">Ce que vous gagnez</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${bulletRows(profile.partnerGains)}</table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px 8px;font-family:${FONT};" align="center">
              <a href="${hackathonUrl}" style="display:inline-block;background:${EMAIL_BRAND.primary};color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;padding:14px 22px;border-radius:12px;font-family:${FONT};">
                Voir le programme du McBuleli Hackathon
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 24px;font-family:${FONT};">
              <p style="margin:0;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.text};font-family:${FONT};">
                Prochaine étape : confirmez votre intérêt et un point focal. Nous envoyons le code campus, les textes et les visuels.
              </p>
              <p style="margin:16px 0 0;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.text};font-family:${FONT};">
                Cordialement,<br />
                <strong>McBuleli Team</strong> - Mme Patty B.<br />
                <a href="mailto:${SUPPORT_EMAIL}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${SUPPORT_EMAIL}</a><br />
                ${esc(SUPPORT_PHONES_DISPLAY)}<br />
                <a href="${SUPPORT_WA_PATH}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">WhatsApp</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 24px;background:${EMAIL_BRAND.primary};color:#ffffff;font-size:11px;text-align:center;font-family:${FONT};">
              McBuleli Hackathon ${year} - Silikin Village - ~12 équipes
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

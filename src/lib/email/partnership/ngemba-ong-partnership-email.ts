/**
 * NGEMBA - outreach partenariat ONG (DH / VBG / protection / jeunesse).
 * From: hi@ · Signature: Mme Patty B. · RCCM + NIF · WhatsApp.
 */
import { EMAIL_BRAND, logoUrl } from "@/lib/email/config";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

export const NGEMBA_URL = "https://ngemba-rdc.org";
export const NGEMBA_CHARTE = "https://ngemba-rdc.org/legal/charte-ong";
export const RCCM = "CD/KNG/RCCM/26-A-00382";
export const ID_NAT = "G2660507E";

export type NgembaOrg = {
  id: string;
  name: string;
  greeting: string;
  to: string;
  website?: string;
  phone?: string;
  zone: string;
  /** One line: what they do */
  focus: string;
  /** What they gain with Ngemba */
  gains: string[];
  /** What they bring as partner */
  contribute: string[];
  /** Category angle for routing */
  angle: string;
  /** Skip production batch if true */
  skipBatch?: boolean;
  note?: string;
};

export const NGEMBA_ORGS: NgembaOrg[] = [
  {
    id: "sofepadi",
    name: "SOFEPADI",
    greeting: "Bonjour l'équipe SOFEPADI",
    to: "sofepadi@gmail.com",
    website: "https://sofepadirdc.org",
    phone: "+243 811 982 266",
    zone: "Ituri, Nord-Kivu, Tshopo + Kinshasa",
    focus:
      "défense des droits des femmes et filles, prise en charge holistique VBG, prévention et co-lead sous-cluster VBG",
    angle: "VBG · Safe School · orientation juridique",
    gains: [
      "Canal discret de signalement (SOS, témoin, mode discret) vers vos opérateurs",
      "File /ops dédiée par zone (Est + clubs scolaires Kin)",
      "Ngemba IA : triage d'urgence + résumé - décision humaine chez vous",
      "Observatoire agrégé (sans PII) pour plaidoyer et coordination",
    ],
    contribute: [
      "Expertise VBG et mécanismes de référencement déjà en place",
      "Couverture Est + clubs scolaires Kinshasa",
      "Crédibilité cluster / partenaires humanitaires",
    ],
  },
  {
    id: "heal-africa",
    name: "HEAL Africa",
    greeting: "Bonjour l'équipe HEAL Africa",
    to: "contact_us@healafrica.org",
    website: "https://www.healafrica.org",
    zone: "Goma / Nord-Kivu",
    focus:
      "soins holistiques (santé, éducation, action communautaire, leadership) pour communautés vulnérables à l'Est",
    angle: "Référencement médical / psychosocial VBG",
    gains: [
      "Orientation rapide des survivant·e·s vers vos services à Goma",
      "Moins de friction pour joindre une écoute humaine 24/7 via /ops",
      "Multilingue (FR, EN, Lingala, Kiswahili…) adapté à votre bassin",
    ],
    contribute: [
      "Capacité clinique et communautaire reconnue à Goma",
      "Parcours de prise en charge holistique",
    ],
  },
  {
    id: "ajedi-ka",
    name: "AJEDI-Ka",
    greeting: "Bonjour l'équipe AJEDI-Ka",
    to: "staffajidika@gmail.com",
    website: "https://ajedikaong.org",
    phone: "+243 813 136 690",
    zone: "Uvira / Fizi · Sud-Kivu",
    focus:
      "protection de l'enfance, EAFGA, réhabilitation et plaidoyer pour enfants affectés par les conflits",
    angle: "Protection enfant · Safe School Est",
    gains: [
      "Canal Safe School / child_danger pour signalements protégés",
      "Routage par zone Uvira-Fizi vers vos opérateurs",
      "Traçabilité ops sans exposer les mineurs sur une carte publique",
    ],
    contribute: [
      "Mandat enfance et présence terrain Sud-Kivu",
      "Réseaux child protection / CAAFAG",
    ],
  },
  {
    id: "centre-olame",
    name: "Centre Olame",
    greeting: "Bonjour l'équipe du Centre Olame",
    to: "olame.centre@gmail.com",
    website: "https://olamerdc.org",
    zone: "Bukavu · Sud-Kivu",
    focus:
      "accompagnement des femmes, jeunes filles et enfants (y compris accusés de sorcellerie), formation et protection depuis 1959",
    angle: "Protection femmes / enfants · écoute",
    gains: [
      "Signalements discrets orientés vers votre écoute Bukavu",
      "Réduction des barrières (distance, stigmatisation) via mobile / PWA",
      "File ops alignée sur votre mandat protection",
    ],
    contribute: [
      "Ancrage diocésain et confiance communautaire à Bukavu",
      "Expérience longue de prise en charge femmes et enfants",
    ],
  },
  {
    id: "sadi",
    name: "SADI RDC",
    greeting: "Bonjour l'équipe SADI RDC",
    to: "rdcsadi@gmail.com",
    website: "https://sadirdc.org",
    phone: "+243 991 617 457",
    zone: "Sud-Kivu / RDC",
    focus:
      "développement durable, plaidoyer basé sur des preuves et amplification des besoins communautaires",
    angle: "Plaidoyer · paix · genre",
    gains: [
      "Données agrégées d'alertes (anonymisées) pour appuyer le plaidoyer",
      "Visibilité d'un canal citoyen innovant dans vos campagnes",
      "Partenariat digital aligné sur votre rôle d'influence politique",
    ],
    contribute: [
      "Capacité de plaidoyer et de mise en réseau OSC",
      "Relais Forum / coalitions jeunesse et genre à Bukavu",
    ],
  },
  {
    id: "yfp",
    name: "Youth For Peace DRC",
    greeting: "Bonjour l'équipe Youth For Peace DRC",
    to: "coordination@yfpdrc.org",
    website: "https://yfpdrc.org",
    phone: "+243 800 300 413",
    zone: "RDC / Grands Lacs · Bukavu",
    focus:
      "réseau d'organisations pour la participation des jeunes aux processus de paix et de sécurité",
    angle: "Jeunesse · paix · VBG scolaire",
    gains: [
      "Outil concret pour vos membres (Safe School, prévention, orientation)",
      "Ngemba Jeunesse : scénarios de prévention pour animateurs",
      "Canal multilingue pour mobiliser les jeunes sur le terrain",
    ],
    contribute: [
      "Réseau national de jeunes et organisations membres",
      "Expérience sensibilisation VBG / paix en milieu scolaire",
    ],
  },
  {
    id: "remed",
    name: "REMED",
    greeting: "Bonjour l'équipe REMED",
    to: "remeddrc@gmail.com",
    website: "https://remeddrc.org",
    phone: "+243 994 222 989",
    zone: "Sud-Kivu",
    focus:
      "éducation, santé, nutrition, protection et urgences (« savoir pour sauver ») auprès des communautés",
    angle: "Protection · urgence · orientation communautaire",
    gains: [
      "Alerte citoyenne pour accélérer l'orientation vers vos réponses protection / santé",
      "Support aux relais communautaires avec un canal discret",
      "Complément digital à vos actions d'urgence et de protection",
    ],
    contribute: [
      "Présence terrain Sud-Kivu (éducation, santé, protection)",
      "Réseaux communautaires et centres de santé partenaires",
    ],
  },
  {
    id: "tpo",
    name: "TPO DRC",
    greeting: "Bonjour l'équipe TPO DRC",
    to: "info@tpordc.org",
    website: "https://tpordc.org",
    phone: "+243 999 965 943",
    zone: "RDC (Est / national selon programmes)",
    focus:
      "soutien psychosocial et santé mentale pour personnes affectées par la violence et les crises",
    angle: "Psychosocial · trauma · VBG",
    gains: [
      "Orientation structurée des cas vers une écoute psychosociale",
      "Triage IA pour prioriser les urgences - prise en charge humaine chez TPO",
      "Confidentialité et minimisation des données (aligné soin)",
    ],
    contribute: [
      "Expertise psychosociale / santé mentale",
      "Protocoles de prise en charge des survivant·e·s",
    ],
  },
  {
    id: "zaida",
    name: "Club Zaïda Catalan",
    greeting: "Bonjour l'équipe du Club Zaïda Catalan",
    to: "czaidacatalan.ps@gmail.com",
    website: "https://clubzaidacatalan.org",
    phone: "+243 972 291 375",
    zone: "Est de la RDC",
    focus:
      "paix et sécurité, genre et droits humains, pouvoir économique des femmes et des jeunes",
    angle: "Genre · paix · droits humains Est",
    gains: [
      "Canal d'alerte pour renforcer vos actions genre / DH à l'Est",
      "Visibilité d'innovation locale dans vos projets paix et sécurité",
      "Outil utilisable par vos animateurs et bénéficiaires",
    ],
    contribute: [
      "Ancrage Est (genre, paix, gouvernance)",
      "Réseaux femmes et jeunes",
    ],
  },
  {
    id: "hope-peace",
    name: "Hope and Peace",
    greeting: "Bonjour l'équipe Hope and Peace",
    to: "hopeandpeacedrc@gmail.com",
    website: "https://hopeandpeacerdc.org",
    phone: "+243 828 818 913",
    zone: "RDC",
    focus: "promotion de la paix, cohésion et accompagnement communautaire",
    angle: "Paix · orientation citoyenne",
    gains: [
      "Plateforme citoyenne concrète pour orienter sans remplacer la justice",
      "Multilingue pour atteindre plus de communautés",
      "Partenariat ops pour vos zones d'intervention",
    ],
    contribute: [
      "Mission paix et proximité communautaire",
      "Capacité de sensibilisation terrain",
    ],
  },
  {
    id: "iwhe",
    name: "IWHE (Indigenous Women for Health and Equality)",
    greeting: "Bonjour l'équipe IWHE",
    to: "indigenouswomen2021@gmail.com",
    website: "https://iwhe-ong.org",
    phone: "+243 813 033 335",
    zone: "RDC (femmes et filles autochtones)",
    focus:
      "dignité, autonomie économique, terre et justice climatique pour les femmes et filles autochtones",
    angle: "Femmes autochtones · protection · justice",
    gains: [
      "Canal discret adapté aux contextes vulnérables / stigmatisation",
      "Orientation vers vos actions dignité et relevement",
      "Voix citoyenne sans exposition cartographique des victimes",
    ],
    contribute: [
      "Expertise femmes autochtones et justice climatique",
      "Approche communautaire spécifique",
    ],
  },
  {
    id: "panzi",
    name: "Fondation Panzi",
    greeting: "Bonjour l'équipe Fondation Panzi",
    to: "info@panzi.org",
    website: "https://panzi.org",
    zone: "Bukavu + Clinique Panzi Kinshasa",
    focus:
      "prise en charge holistique des survivant·e·s de violences sexuelles (médical, psycho, juridique, réinsertion)",
    angle: "Référencement One Stop Center / VSBG",
    gains: [
      "Orientation vers Panzi Bukavu et Clinique Panzi Kinshasa",
      "Réduction du délai entre signalement et accès aux soins",
      "Complément digital discret au modèle One Stop Center",
    ],
    contribute: [
      "Référence mondiale de prise en charge VSBG en RDC",
      "Réseau OSC / cliniques et clinique Kinshasa",
    ],
  },
  {
    id: "uwezo",
    name: "Uwezo Afrika Initiative",
    greeting: "Bonjour l'équipe Uwezo Afrika Initiative",
    to: "uwezoafrikainitiative@gmail.com",
    website: "https://uwezoafrika.org",
    phone: "+243 962 545 075",
    zone: "RDC / Afrique",
    focus: "renforcement des capacités, initiatives citoyennes et développement",
    angle: "Capacitation · innovation citoyenne",
    gains: [
      "Outil digital à intégrer dans vos formations / incubations",
      "Cas concret d'IA au service de la protection citoyenne",
      "Partenariat visible sur l'innovation sociale",
    ],
    contribute: [
      "Réseau d'initiatives et de capacitation",
      "Relais vers porteurs de projets locaux",
    ],
  },
  {
    id: "ajefem",
    name: "AJEFEM ASBL",
    greeting: "Bonjour l'équipe AJEFEM",
    to: "contact@ajefem.org",
    website: "https://ajefem.org",
    phone: "+243 826 704 930",
    zone: "RDC",
    focus: "accompagnement des femmes, justice et autonomisation",
    angle: "Femmes · justice · VBG",
    gains: [
      "Canal d'orientation juridique / écoute pour les femmes",
      "File ops pour vos référents",
      "Multilingue pour élargir l'accès",
    ],
    contribute: [
      "Mandat femmes et justice",
      "Présence associative et formation (lien TIA Academy)",
    ],
  },
  {
    id: "opadec",
    name: "OPADEC ASBL",
    greeting: "Bonjour l'équipe OPADEC",
    to: "opadecasbl@gmail.com",
    phone: "+243 971 366 367",
    zone: "Bukavu / Sud-Kivu",
    focus:
      "développement communautaire, paix et actions de société civile à l'Est",
    angle: "Paix · développement · réseau OSC Bukavu",
    gains: [
      "Outil citoyen pour renforcer vos actions de proximité",
      "Lien avec le réseau jeunesse / genre Bukavu",
      "Partenariat ops sur votre zone",
    ],
    contribute: [
      "Ancrage Bukavu et coalitions OSC",
      "Capacité d'organisation d'événements et de plaidoyer",
    ],
  },
  {
    id: "wfad",
    name: "WFAD DRC",
    greeting: "Bonjour l'équipe WFAD DRC",
    to: "infodrc@wfad.se",
    website: "https://wfad.se",
    phone: "+46 73 532 48 54",
    zone: "RDC (antenne / programmes)",
    focus:
      "prévention des addictions et renforcement communautaire (World Federation Against Drugs)",
    angle: "Prévention · jeunesse · orientation",
    gains: [
      "Canal d'orientation pour situations à risque (jeunesse / familles)",
      "Complément digital à vos programmes de prévention",
      "Traçabilité ops pour vos équipes RDC",
    ],
    contribute: [
      "Réseau international et programmes RDC",
      "Expertise prévention et jeunesse",
    ],
  },
  {
    id: "ccj",
    name: "CCJ RDC (Conseil Consultatif des Jeunes)",
    greeting: "Bonjour le Conseil Consultatif des Jeunes",
    to: "ccjrdc.officiel@gmail.com",
    phone: "+243 978 802 345",
    zone: "National · Kinshasa",
    focus: "voix consultative de la jeunesse et participation citoyenne",
    angle: "Jeunesse · prévention · Safe School",
    gains: [
      "Outil national utilisable par les conseils / clubs jeunes",
      "Ngemba Jeunesse pour sensibilisation",
      "Canal discret pour signalements scolaires / communautaires",
    ],
    contribute: [
      "Légitimité jeunesse au niveau national",
      "Réseau de relais jeunes dans les provinces",
    ],
  },
  {
    id: "mwanamke",
    name: "Mwanamke Kesho ASBL",
    greeting: "Bonjour l'équipe Mwanamke Kesho",
    to: "mwanamkekeshodrc@gmail.com",
    website: "https://mwanamkekesho.org",
    phone: "+243 991 982 062",
    zone: "RDC",
    focus: "droits des femmes, autonomisation et avenir des filles (« femme demain »)",
    angle: "Femmes · VBG · orientation",
    gains: [
      "Signalement discret pour les femmes et filles que vous accompagnez",
      "Orientation vers vos services d'écoute / autonomisation",
      "Partenariat digital aligné sur votre mission",
    ],
    contribute: [
      "Mandat femmes et filles",
      "Présence associative et confiance bénéficiaires",
    ],
  },
  {
    id: "bca",
    name: "Bloc Citoyen Amani (BCA)",
    greeting: "Bonjour l'équipe du Bloc Citoyen Amani",
    to: "blocamanirdc@gmail.com",
    phone: "+243 996 839 254",
    website: "https://www.facebook.com/profile.php?id=61593232664992",
    zone: "Sud-Kivu (Bukavu, Uvira, Baraka) · Grands Lacs",
    focus:
      "synergie confessions / mouvements citoyens / ASBL pour la paix (Amani), la citoyenneté et le développement communautaire — enquêtes enfants de rue à Bukavu, plaidoyer réfugiés, Congo Peace Honors",
    angle: "Protection enfant · paix communautaire · orientation Sud-Kivu",
    gains: [
      "File /ops filtrée Sud-Kivu (Bukavu, Uvira…) — enfants en danger, école, VBG, harcèlement",
      "Canal discret citoyen → opérateurs BCA (pas un substitut police / SAMU)",
      "Ngemba IA : triage + résumé ; décision humaine chez vous",
      "Traçabilité des dossiers pour plaidoyer (observatoire agrégé, sans PII publique)",
    ],
    contribute: [
      "Ancrage Bukavu et réseaux confessionnels / citoyens Sud-Kivu",
      "Expertise terrain enfants de rue (~13 000 recensés à Bukavu) et cohésion sociale",
      "Voix publique (réfugiés Uvira–Burundi, Congo Peace Honors)",
    ],
    note: "Accès ops : docs/ngemba/31-BCA-BLOC-CITOYEN-AMANI.md · email dédié send-ngemba-bca-access-email.ts",
  },
  {
    id: "ajucv-tchad",
    name: "Association Jeunesse Unie Contre les VBG",
    greeting: "Bonjour l'Association Jeunesse Unie Contre les VBG",
    to: "collectiftchdien@gmail.com",
    phone: "+235 63 88 24 70",
    zone: "Tchad (réseau régional)",
    focus: "jeunesse unie contre les violences basées sur le genre",
    angle: "Réseau régional VBG / jeunesse",
    gains: [
      "Inspiration / partenariat Sud-Sud sur un canal d'alerte IA + humain",
      "Échange de pratiques VBG jeunesse (RDC ↔ Tchad)",
      "Accès démo plateforme pour adapter localement si pertinent",
    ],
    contribute: [
      "Expérience jeunesse contre les VBG",
      "Perspective régionale Afrique centrale",
    ],
    note: "Siège Tchad - pas un ops zone RDC ; pitch réseau / échange.",
    skipBatch: true,
  },
];

export type NgembaEmailCopy = {
  id: string;
  to: string;
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

function bulletsHtml(items: string[]): string {
  return items
    .map(
      (g) =>
        `<tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">${esc(g)}</td></tr><tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>`,
    )
    .join("");
}

function bulletsText(items: string[]): string {
  return items.map((g) => `- ${g}`).join("\n");
}

export function buildNgembaOrgEmail(org: NgembaOrg): NgembaEmailCopy {
  const year = new Date().getFullYear();
  const logo = logoUrl();
  const subject = `Partenariat NGEMBA × ${org.name} - alertes citoyennes & orientation`;
  const preheader = `Ce que ${org.name} gagne avec Ngemba IA, et ce que vous apportez - démo 20 min.`;

  const text = [
    `${org.greeting},`,
    "",
    `Nous sommes McBuleli. Nous opérons NGEMBA (${NGEMBA_URL}) : plateforme congolaise d'alertes citoyennes (SOS, témoin, mode discret, Safe School) qui oriente vers des opérateurs humains ONG - sans remplacer police, SAMU ni justice.`,
    "",
    "VISION",
    "Une RDC où chaque personne peut alerter en sécurité, être entendue et orientée vers l'aide la plus proche - dans sa langue, avec dignité.",
    "",
    "MISSION",
    "Fournir un canal numérique discret et multilingue (FR, EN, Lingala, Kiswahili, Tshiluba, Kikongo), trié par Ngemba IA puis traité par des humains accrédités selon un SLA et une charte ONG.",
    "",
    `POURQUOI ${org.name.toUpperCase()}`,
    `Nous connaissons votre travail : ${org.focus} (${org.zone}). Angle proposé : ${org.angle}.`,
    "",
    "CE QUE VOUS GAGNEZ AVEC NGEMBA IA",
    bulletsText(org.gains),
    "",
    "CE QUE VOUS APPORTEZ",
    bulletsText(org.contribute),
    "",
    "PILOTE",
    "Accord type 3 mois, token ops dédié, formation 30 min, charte : " + NGEMBA_CHARTE,
    "Pilote déjà engagé avec Justicia Great Lakes (JGL AFRICA).",
    "",
    "Prochaine étape : 20 minutes (appel ou Meet) pour une démo /ops.",
    "",
    "Cordialement,",
    "McBuleli Team",
    "Mme Patty B.",
    SUPPORT_EMAIL,
    SUPPORT_PHONES_DISPLAY,
    `WhatsApp : ${SUPPORT_WA_PATH}`,
    NGEMBA_URL,
    `RCCM : ${RCCM} · ID Nat / NIF : ${ID_NAT}`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.mint};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.mint};padding:28px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:${EMAIL_BRAND.white};border-radius:16px;border:1px solid ${EMAIL_BRAND.border};overflow:hidden;">
        <tr>
          <td style="padding:22px 28px 8px;border-bottom:1px solid ${EMAIL_BRAND.border};">
            <table role="presentation" cellspacing="0" cellpadding="0"><tr>
              <td style="vertical-align:middle;padding-right:12px;">
                <img src="${esc(logo)}" width="44" height="44" alt="McBuleli" style="display:block;border:0;border-radius:50%;" />
              </td>
              <td style="vertical-align:middle;">
                <p style="margin:0;font-size:17px;font-weight:800;color:${EMAIL_BRAND.primary};">McBuleli</p>
                <p style="margin:2px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">NGEMBA · Partenariat ONG</p>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px 8px;">
            <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">${esc(org.greeting)},</p>
            <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
              Nous opérons <strong style="color:${EMAIL_BRAND.text};">NGEMBA</strong>
              (<a href="${NGEMBA_URL}" style="color:${EMAIL_BRAND.primary};">ngemba-rdc.org</a>) :
              alertes citoyennes (SOS, témoin, mode discret, Safe School) orientées vers des
              <strong style="color:${EMAIL_BRAND.text};">opérateurs humains ONG</strong> -
              sans remplacer police, SAMU ni justice.
            </p>

            <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:${EMAIL_BRAND.text};">Vision</p>
            <p style="margin:0 0 14px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
              Une RDC où chacun peut alerter en sécurité, être entendu et orienté vers l'aide la plus proche - dans sa langue, avec dignité.
            </p>
            <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:${EMAIL_BRAND.text};">Mission</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
              Canal discret multilingue, triage <strong style="color:${EMAIL_BRAND.text};">Ngemba IA</strong>,
              décision humaine, SLA et
              <a href="${NGEMBA_CHARTE}" style="color:${EMAIL_BRAND.primary};">charte ONG</a>.
            </p>

            <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:${EMAIL_BRAND.text};">Pourquoi ${esc(org.name)}</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
              ${esc(org.focus)}. Zone : <strong style="color:${EMAIL_BRAND.text};">${esc(org.zone)}</strong>.
              Angle : <strong style="color:${EMAIL_BRAND.text};">${esc(org.angle)}</strong>.
            </p>

            <p style="margin:0 0 10px;font-size:15px;font-weight:700;color:${EMAIL_BRAND.text};">Ce que vous gagnez avec Ngemba IA</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 8px;">${bulletsHtml(org.gains)}</table>

            <p style="margin:0 0 10px;font-size:15px;font-weight:700;color:${EMAIL_BRAND.text};">Ce que vous apportez</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;">${bulletsHtml(org.contribute)}</table>

            <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
              Pilote 3 mois · token ops · formation 30 min · déjà engagé avec
              <strong style="color:${EMAIL_BRAND.text};">Justicia Great Lakes</strong>.
              Prochaine étape : <strong style="color:${EMAIL_BRAND.text};">20 min</strong> pour une démo /ops.
            </p>

            <p style="margin:0 0 22px;text-align:center;">
              <a href="${NGEMBA_URL}" style="display:inline-block;background:${EMAIL_BRAND.primary};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 26px;border-radius:12px;">Voir NGEMBA</a>
            </p>

            <p style="margin:0 0 6px;font-size:15px;color:${EMAIL_BRAND.text};">Cordialement,</p>
            <p style="margin:0;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">
              <strong>McBuleli Team</strong><br />
              Mme Patty B.<br />
              <a href="mailto:${SUPPORT_EMAIL}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${SUPPORT_EMAIL}</a><br />
              ${esc(SUPPORT_PHONES_DISPLAY)}<br />
              WhatsApp :
              <a href="${SUPPORT_WA_PATH}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">écrire sur WhatsApp</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 28px 24px;border-top:1px solid ${EMAIL_BRAND.border};text-align:center;">
            <p style="margin:0;font-size:11px;color:${EMAIL_BRAND.muted};">
              © ${year} McBuleli · RCCM : ${RCCM} · ID Nat / NIF : ${ID_NAT}<br />
              <a href="${NGEMBA_URL}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">ngemba-rdc.org</a>
              · <a href="https://mcbuleli.org" style="color:${EMAIL_BRAND.primary};text-decoration:none;">mcbuleli.org</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { id: org.id, to: org.to, subject, preheader, html, text };
}

export function getNgembaOrg(id: string): NgembaOrg | undefined {
  return NGEMBA_ORGS.find((o) => o.id === id);
}

export function ngembaOrgsForBatch(): NgembaOrg[] {
  return NGEMBA_ORGS.filter((o) => !o.skipBatch && o.to.includes("@"));
}

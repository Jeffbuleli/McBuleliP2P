/**
 * Annuaire public « Nos partenaires » (citoyen) — cartes détaillées.
 * Ops seed + ONG réseau NGEMBA (sans contacts privés / emails ops).
 */

export type PublicPartner = {
  id: string;
  name: string;
  roleFr: string;
  roleEn: string;
  blurbFr: string;
  blurbEn: string;
  zone: string;
  angle: string;
  website?: string;
  /** Public path under /public or absolute URL */
  logoUrl?: string | null;
  /** Ops pilote actif */
  opsActive?: boolean;
};

export const PUBLIC_PARTNERS: PublicPartner[] = [
  {
    id: "jgl",
    name: "Justicia Great Lakes (JGL AFRICA)",
    roleFr: "Partenaire ops pilote · VBG & orientation",
    roleEn: "Pilot ops partner · GBV & referral",
    blurbFr:
      "ONG juridique et d’accompagnement des survivant·e·s. Premier partenaire ops NGEMBA : file alertes, prise en charge humaine et orientation.",
    blurbEn:
      "Legal and survivor-support NGO. First NGEMBA ops partner: alert queue, human intake and referral.",
    zone: "National (pilote)",
    angle: "VBG · enfant · école",
    opsActive: true,
  },
  {
    id: "bca",
    name: "Bloc Citoyen Amani (BCA)",
    roleFr: "Partenaire ops · Sud-Kivu · paix & enfance",
    roleEn: "Ops partner · South Kivu · peace & children",
    blurbFr:
      "Synergie citoyenne pour la paix (Amani), la citoyenneté et le développement communautaire. File ops Sud-Kivu (Bukavu, Uvira) — enfants en danger, école, orientation.",
    blurbEn:
      "Civic synergy for peace (Amani), citizenship and community development. South Kivu ops queue (Bukavu, Uvira) — child protection, school, referral.",
    zone: "Sud-Kivu · Bukavu / Uvira",
    angle: "Paix · enfant · communauté",
    website: "https://www.facebook.com/profile.php?id=61593232664992",
    logoUrl: "/partners/bloc-citoyen-amani.png",
    opsActive: true,
  },
  {
    id: "sofepadi",
    name: "SOFEPADI",
    roleFr: "Droits des femmes · VBG",
    roleEn: "Women’s rights · GBV",
    blurbFr:
      "Défense des droits des femmes et filles, prise en charge holistique VBG, prévention et co-lead sous-cluster VBG.",
    blurbEn:
      "Women and girls’ rights, holistic GBV care, prevention and VBG sub-cluster co-lead.",
    zone: "Ituri, Nord-Kivu, Tshopo + Kinshasa",
    angle: "VBG · Safe School",
    website: "https://sofepadirdc.org",
  },
  {
    id: "panzi",
    name: "Fondation Panzi",
    roleFr: "One Stop · VSBG",
    roleEn: "One Stop · CRSV",
    blurbFr:
      "Prise en charge holistique des survivantes de violences sexuelles et basées sur le genre (modèle One Stop).",
    blurbEn:
      "Holistic care for survivors of sexual and gender-based violence (One Stop model).",
    zone: "Bukavu · Kinshasa",
    angle: "VSBG · médical · psychosocial",
    website: "https://panzi.org",
  },
  {
    id: "heal-africa",
    name: "HEAL Africa",
    roleFr: "Soins holistiques · Est",
    roleEn: "Holistic care · East",
    blurbFr:
      "Santé, éducation et action communautaire pour les populations vulnérables à l’Est de la RDC.",
    blurbEn:
      "Health, education and community action for vulnerable communities in eastern DRC.",
    zone: "Goma / Nord-Kivu",
    angle: "Médical · psychosocial",
    website: "https://www.healafrica.org",
  },
  {
    id: "ajedi-ka",
    name: "AJEDI-Ka",
    roleFr: "Protection de l’enfance",
    roleEn: "Child protection",
    blurbFr:
      "Protection de l’enfance, EAFGA, réhabilitation et plaidoyer pour les enfants affectés par les conflits.",
    blurbEn:
      "Child protection, CAAFAG, rehabilitation and advocacy for conflict-affected children.",
    zone: "Uvira / Fizi · Sud-Kivu",
    angle: "Enfant · Safe School",
    website: "https://ajedikaong.org",
  },
  {
    id: "centre-olame",
    name: "Centre Olame",
    roleFr: "Femmes & enfants · Bukavu",
    roleEn: "Women & children · Bukavu",
    blurbFr:
      "Accompagnement des femmes et enfants à Bukavu — écoute, protection et renforcement communautaire.",
    blurbEn:
      "Support for women and children in Bukavu — listening, protection and community strengthening.",
    zone: "Bukavu · Sud-Kivu",
    angle: "Femmes · enfants",
    website: "https://olamerdc.org",
  },
  {
    id: "tpo",
    name: "TPO DRC",
    roleFr: "Psychosocial · trauma",
    roleEn: "Psychosocial · trauma",
    blurbFr:
      "Soutien psychosocial et prise en charge du trauma pour les communautés affectées.",
    blurbEn:
      "Psychosocial support and trauma care for affected communities.",
    zone: "Est RDC",
    angle: "Psychosocial",
    website: "https://tpordc.org",
  },
  {
    id: "yfp",
    name: "Youth For Peace DRC",
    roleFr: "Jeunesse · paix",
    roleEn: "Youth · peace",
    blurbFr:
      "Jeunesse pour la paix : prévention, engagement citoyen et sensibilisation (dont VBG scolaire).",
    blurbEn:
      "Youth for peace: prevention, civic engagement and awareness (including school GBV).",
    zone: "RDC",
    angle: "Jeunesse · paix · école",
    website: "https://yfpdrc.org",
  },
  {
    id: "hope-peace",
    name: "Hope and Peace",
    roleFr: "Paix communautaire",
    roleEn: "Community peace",
    blurbFr:
      "Promotion de la paix et de la cohésion sociale au niveau communautaire.",
    blurbEn:
      "Promoting peace and social cohesion at community level.",
    zone: "Est RDC",
    angle: "Paix · communauté",
    website: "https://hopeandpeacerdc.org",
  },
  {
    id: "remed",
    name: "REMED",
    roleFr: "Éducation · santé · protection",
    roleEn: "Education · health · protection",
    blurbFr:
      "Éducation, santé et protection — ancrage Sud-Kivu et accompagnement des populations vulnérables.",
    blurbEn:
      "Education, health and protection — South Kivu footprint and support for vulnerable populations.",
    zone: "Sud-Kivu",
    angle: "Éducation · protection",
    website: "https://remeddrc.org",
  },
  {
    id: "sadi",
    name: "SADI RDC",
    roleFr: "Plaidoyer · développement",
    roleEn: "Advocacy · development",
    blurbFr:
      "Plaidoyer et développement communautaire pour renforcer les droits et la dignité.",
    blurbEn:
      "Advocacy and community development to strengthen rights and dignity.",
    zone: "RDC",
    angle: "Plaidoyer",
    website: "https://sadirdc.org",
  },
  {
    id: "zaida",
    name: "Club Zaïda Catalan",
    roleFr: "Genre · paix",
    roleEn: "Gender · peace",
    blurbFr:
      "Engagement genre et paix à l’Est — sensibilisation et appui communautaire.",
    blurbEn:
      "Gender and peace engagement in the East — awareness and community support.",
    zone: "Est RDC",
    angle: "Genre · paix",
    website: "https://clubzaidacatalan.org",
  },
  {
    id: "iwhe",
    name: "IWHE",
    roleFr: "Femmes autochtones",
    roleEn: "Indigenous women",
    blurbFr:
      "Droits et empowerment des femmes autochtones — voix, protection et plaidoyer.",
    blurbEn:
      "Rights and empowerment of indigenous women — voice, protection and advocacy.",
    zone: "RDC",
    angle: "Femmes autochtones",
    website: "https://iwhe-ong.org",
  },
  {
    id: "uwezo",
    name: "Uwezo Afrika",
    roleFr: "Capacitation",
    roleEn: "Capacity building",
    blurbFr:
      "Capacitation et initiatives pour renforcer les acteurs locaux et la jeunesse.",
    blurbEn:
      "Capacity building and initiatives to strengthen local actors and youth.",
    zone: "RDC",
    angle: "Capacitation",
    website: "https://uwezoafrika.org",
  },
  {
    id: "ajefem",
    name: "AJEFEM ASBL",
    roleFr: "Femmes · justice",
    roleEn: "Women · justice",
    blurbFr:
      "Association pour la justice et l’empowerment des femmes.",
    blurbEn:
      "Association for justice and women’s empowerment.",
    zone: "RDC",
    angle: "Femmes · justice",
    website: "https://ajefem.org",
  },
  {
    id: "opadec",
    name: "OPADEC ASBL",
    roleFr: "OSC · Bukavu",
    roleEn: "CSO · Bukavu",
    blurbFr:
      "Organisation de la société civile à Bukavu — développement et action citoyenne.",
    blurbEn:
      "Civil society organization in Bukavu — development and civic action.",
    zone: "Bukavu",
    angle: "OSC · communauté",
  },
  {
    id: "wfad",
    name: "WFAD DRC",
    roleFr: "Prévention · jeunesse",
    roleEn: "Prevention · youth",
    blurbFr:
      "Prévention et accompagnement des jeunes — réseau World Federation Against Drugs en RDC.",
    blurbEn:
      "Youth prevention and support — World Federation Against Drugs network in DRC.",
    zone: "RDC",
    angle: "Jeunesse · prévention",
    website: "https://wfad.se",
  },
  {
    id: "ccj",
    name: "CCJ RDC",
    roleFr: "Jeunesse nationale",
    roleEn: "National youth",
    blurbFr:
      "Coordination et mobilisation jeunesse à l’échelle nationale.",
    blurbEn:
      "Youth coordination and mobilization nationwide.",
    zone: "National",
    angle: "Jeunesse",
  },
  {
    id: "mwanamke",
    name: "Mwanamke Kesho",
    roleFr: "Femmes · filles",
    roleEn: "Women · girls",
    blurbFr:
      "Accompagnement des femmes et filles — dignité, droits et autonomisation.",
    blurbEn:
      "Support for women and girls — dignity, rights and empowerment.",
    zone: "RDC",
    angle: "Femmes · filles",
    website: "https://mwanamkekesho.org",
  },
];

export function publicPartnerInitials(name: string): string {
  const parts = name
    .replace(/[()]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "NG";
}

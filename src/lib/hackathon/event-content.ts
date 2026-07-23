/**
 * Configurable marketing content for McBuleli events (hackathons, bootcamps, etc.).
 * Edit this file to reuse the landing template for other editions.
 */
import type { BenefitIconId, PrizeIconId } from "@/components/hackathon/event-icons";

export type EventNavItem = { id: string; labelFr: string; labelEn: string };

export type ProgramSlot = {
  time: string;
  activityFr: string;
  activityEn: string;
  icon: ProgramIconId;
};

export type ProgramDay = {
  day: number;
  labelFr: string;
  labelEn: string;
  subtitleFr: string;
  subtitleEn: string;
  slots: ProgramSlot[];
};

export type ProgramIconId =
  | "welcome"
  | "mic"
  | "partners"
  | "target"
  | "coffee"
  | "brain"
  | "code"
  | "help"
  | "team"
  | "build"
  | "clock"
  | "presentation"
  | "jury"
  | "award"
  | "network"
  | "media";

export type PrizeCard = {
  id: PrizeIconId;
  icon: PrizeIconId;
  titleFr: string;
  titleEn: string;
  bodyFr: string;
  bodyEn: string;
};

export type PartnerBenefit = {
  id: string;
  icon: BenefitIconId;
  titleFr: string;
  titleEn: string;
  bodyFr: string;
  bodyEn: string;
};

export type SponsorTier = {
  id: "platinum" | "gold" | "silver" | "bronze";
  labelFr: string;
  labelEn: string;
  perksFr: string[];
  perksEn: string[];
};

export type EventHeroStats = {
  teamsExpected: number;
  mentorsLabelFr: string;
  mentorsLabelEn: string;
  partnersLabelFr: string;
  partnersLabelEn: string;
  prizesCountFr: string;
  prizesCountEn: string;
};

/** Edition year shown on the landing when dates are TBA. */
export const HACKATHON_EVENT_YEAR = 2026;

export const HACKATHON_EVENT_DAYS = 3;

/** Public date label while venue dates are pending confirmation. */
export const HACKATHON_DATES_LABEL_FR = "Août 2026";
export const HACKATHON_DATES_LABEL_EN = "August 2026";

/** Confirmed payment rail partner for builders (sandbox APIs). */
export const PAWAPAY_PARTNER = {
  name: "pawaPay",
  roleFr: "Partenaire Paiement Mobile",
  roleEn: "Mobile Payment Partner",
  website: "https://www.pawapay.io/",
  docs: "https://docs.pawapay.io/",
  logoUrl: "/partners/pawapay-logo.png",
  blurbFr:
    "Rail Mobile Money (Orange, Airtel, M-Pesa). Les participants utilisent le sandbox pawaPay et les APIs pour leurs prototypes.",
  blurbEn:
    "Mobile Money rail (Orange, Airtel, M-Pesa). Participants use the pawaPay sandbox and APIs in their prototypes.",
} as const;

/** Confirmed crypto partner for builders (demo APIs). */
export const BINANCE_PARTNER = {
  name: "Binance",
  roleFr: "Partenaire Crypto",
  roleEn: "Crypto Partner",
  website: "https://www.binance.com/",
  demo: "https://demo.binance.com/",
  docs: "https://developers.binance.com/",
  logoUrl: "/partners/binance-logo.png",
  blurbFr:
    "Exchange crypto. Les participants intègrent dans leurs prototypes les endpoints demo Spot et Futures via les APIs demo.binance.com (demo-api.binance.com · demo-fapi.binance.com).",
  blurbEn:
    "Crypto exchange. Participants integrate demo Spot and Futures endpoints via demo.binance.com APIs in their prototypes (demo-api.binance.com · demo-fapi.binance.com).",
} as const;

/** Confirmed agriculture / AgriBusiness partner (AgroTech challenge + Prix ILOKWE). */
export const ILOKWE_PARTNER = {
  name: "ILOKWE GROUP",
  roleFr: "Partenaire Agriculture & AgriBusiness · Sponsor Or",
  roleEn: "Agriculture & AgriBusiness Partner · Gold Sponsor",
  website: "https://www.facebook.com/profile.php?id=100065743382631",
  facebook: "https://www.facebook.com/profile.php?id=100065743382631",
  logoUrl: "/partners/ilokwe-group-logo.png",
  sloganFr: "La valeur ajoutée du terroir",
  sloganEn: "The added value of the terroir",
  contactName: "Mr Christian Ikwele",
  phone: "+243 990 044 150",
  email: "ilokwegroup@gmail.com",
  promoCode: "ILOKWE",
  sponsorTier: "gold" as const,
  blurbFr:
    "Production agricole et accompagnement d'investissements agricoles à Kinshasa (Mont Ngafula). Référence terrain du défi AgroTech : moderniser la chaîne de production en RDC. Premier prix nommé Prix ILOKWE · Sponsor Or · Jury.",
  blurbEn:
    "Agricultural production and investment support in Kinshasa (Mont Ngafula). Field reference for the AgroTech challenge: modernize the production chain in DRC. First prize named Prix ILOKWE · Gold Sponsor · Jury.",
} as const;

/** Featured partner logos on landing + badges/tickets. Add here to auto-update all surfaces. */
export type HackathonFeaturedLogo = {
  id: string;
  name: string;
  logoUrl: string;
  href: string;
  /** Tile background (brand fill, like Binance / pawaPay). */
  tileBgClass: string;
  /** contain = letterbox in tile (pawaPay/Binance); cover = full-bleed photo logos (ILOKWE). */
  fit: "contain" | "cover";
};

export function hackathonFeaturedPartners(): HackathonFeaturedLogo[] {
  return [
    {
      id: "pawapay",
      name: PAWAPAY_PARTNER.name,
      logoUrl: PAWAPAY_PARTNER.logoUrl,
      href: PAWAPAY_PARTNER.website,
      tileBgClass: "bg-[#F7F7F7]",
      fit: "contain",
    },
    {
      id: "binance",
      name: BINANCE_PARTNER.name,
      logoUrl: BINANCE_PARTNER.logoUrl,
      href: BINANCE_PARTNER.demo,
      tileBgClass: "bg-[#12161D]",
      fit: "contain",
    },
    {
      id: "ilokwe",
      name: ILOKWE_PARTNER.name,
      logoUrl: ILOKWE_PARTNER.logoUrl,
      href: ILOKWE_PARTNER.facebook,
      tileBgClass: "bg-[#0B3D2E]",
      fit: "cover",
    },
  ];
}

export type HackathonFeaturedSponsor = {
  id: string;
  name: string;
  logoUrl: string;
  website: string;
  pack: "platinum" | "gold" | "silver" | "bronze";
  roleFr: string;
  roleEn: string;
};

/** Confirmed sponsors shown on the landing (independent of DB leads). */
export function hackathonFeaturedSponsors(): HackathonFeaturedSponsor[] {
  return [
    {
      id: "ilokwe-gold",
      name: ILOKWE_PARTNER.name,
      logoUrl: ILOKWE_PARTNER.logoUrl,
      website: ILOKWE_PARTNER.facebook,
      pack: "gold",
      roleFr: "Sponsor Or · Prix ILOKWE · Jury",
      roleEn: "Gold Sponsor · ILOKWE Prize · Jury",
    },
  ];
}

export type HackathonFeaturedJury = {
  id: string;
  name: string;
  company: string | null;
  titleFr: string;
  titleEn: string;
  expertiseFr: string;
  expertiseEn: string;
  /** Portrait URL — set when provided; null shows initial. */
  photoUrl: string | null;
  href: string | null;
};

/** Featured jury members on the landing (merge with DB / demo rows). */
export function hackathonFeaturedJury(): HackathonFeaturedJury[] {
  return [
    {
      id: "jury-expert-innovation",
      name: "Expert Innovation",
      company: null,
      titleFr: "Jury - À annoncer",
      titleEn: "Jury - TBA",
      expertiseFr: "Startups · Impact",
      expertiseEn: "Startups · Impact",
      photoUrl: null,
      href: null,
    },
    {
      id: "jury-ilokwe-christian",
      name: ILOKWE_PARTNER.contactName,
      company: ILOKWE_PARTNER.name,
      titleFr: "Jury · Agriculture & AgriBusiness",
      titleEn: "Jury · Agriculture & AgriBusiness",
      expertiseFr: "AgroTech · Prix ILOKWE",
      expertiseEn: "AgroTech · ILOKWE Prize",
      photoUrl: null,
      href: ILOKWE_PARTNER.facebook,
    },
  ];
}

export const HACKATHON_NAV: EventNavItem[] = [
  { id: "about", labelFr: "À propos", labelEn: "About" },
  { id: "programme", labelFr: "Programme", labelEn: "Program" },
  { id: "defis", labelFr: "Défis", labelEn: "Challenges" },
  { id: "prix", labelFr: "Prix", labelEn: "Prizes" },
  { id: "partenaires", labelFr: "Partenaires", labelEn: "Partners" },
  { id: "sponsors", labelFr: "Sponsors", labelEn: "Sponsors" },
  { id: "faq", labelFr: "FAQ", labelEn: "FAQ" },
  { id: "contact", labelFr: "Contact", labelEn: "Contact" },
];

export function defaultHeroStats(
  _mentorsCount: number,
  partnersCount: number,
): EventHeroStats {
  return {
    teamsExpected: 12,
    mentorsLabelFr: "3+",
    mentorsLabelEn: "3+",
    partnersLabelFr: partnersCount > 0 ? `${partnersCount}+` : "5+",
    partnersLabelEn: partnersCount > 0 ? `${partnersCount}+` : "5+",
    prizesCountFr: "5",
    prizesCountEn: "5",
  };
}

export function hackathonProgramDays(): ProgramDay[] {
  return [
    {
      day: 1,
      labelFr: "Jour 1 - Bootcamp & Lancement",
      labelEn: "Day 1 - Bootcamp & Launch",
      subtitleFr: "08h00 - 13h30",
      subtitleEn: "8:00 AM - 1:30 PM",
      slots: [
        { time: "08h00 - 08h45", activityFr: "Accueil, badges et networking (café)", activityEn: "Welcome, badges & networking (coffee)", icon: "welcome" },
        { time: "08h45 - 09h00", activityFr: "Mot de bienvenue McBuleli et objectifs", activityEn: "McBuleli welcome & goals", icon: "mic" },
        { time: "09h00 - 09h20", activityFr: "Discours partenaire principal", activityEn: "Lead partner keynote", icon: "partners" },
        { time: "09h20 - 09h35", activityFr: "Présentation partenaires et sponsors", activityEn: "Partners & sponsors intro", icon: "partners" },
        { time: "09h35 - 10h10", activityFr: "Présentation des défis et règles", activityEn: "Challenges & rules briefing", icon: "target" },
        { time: "10h10 - 10h25", activityFr: "Pause café & networking", activityEn: "Coffee break & networking", icon: "coffee" },
        { time: "10h25 - 11h10", activityFr: "Bootcamp 1 : Design Thinking & validation", activityEn: "Bootcamp 1: Design Thinking & validation", icon: "brain" },
        { time: "11h10 - 11h45", activityFr: "Bootcamp 2 : Cursor, Claude, Codex & APIs", activityEn: "Bootcamp 2: Cursor, Claude, Codex & APIs", icon: "code" },
        { time: "11h45 - 12h05", activityFr: "Q&R avec les mentors", activityEn: "Q&A with mentors", icon: "help" },
        { time: "12h05 - 12h25", activityFr: "Formation des équipes et choix des défis", activityEn: "Team formation & challenge pick", icon: "team" },
        { time: "12h25 - 13h20", activityFr: "Travail en équipe (mentorat)", activityEn: "Team work (mentoring)", icon: "build" },
        { time: "13h20 - 13h30", activityFr: "Briefing Jour 2 et clôture", activityEn: "Day 2 briefing & wrap-up", icon: "clock" },
      ],
    },
    {
      day: 2,
      labelFr: "Jour 2 - Build Day & Mentorat",
      labelEn: "Day 2 - Build Day & Mentoring",
      subtitleFr: "08h00 - 13h30",
      subtitleEn: "8:00 AM - 1:30 PM",
      slots: [
        { time: "08h00 - 08h15", activityFr: "Accueil et rappel des objectifs", activityEn: "Welcome & goals recap", icon: "welcome" },
        { time: "08h15 - 10h00", activityFr: "Développement intensif des prototypes", activityEn: "Intensive prototype development", icon: "build" },
        { time: "10h00 - 10h15", activityFr: "Pause café", activityEn: "Coffee break", icon: "coffee" },
        { time: "10h15 - 10h45", activityFr: "Session partenaire (entrepreneuriat / innovation)", activityEn: "Partner session (entrepreneurship / innovation)", icon: "mic" },
        { time: "10h45 - 12h15", activityFr: "Développement avec mentorat tech & business", activityEn: "Build with tech & business mentoring", icon: "code" },
        { time: "12h15 - 12h40", activityFr: "Revue d'avancement (3 min / équipe)", activityEn: "Progress check-in (3 min / team)", icon: "presentation" },
        { time: "12h40 - 13h10", activityFr: "Préparation pitch & démo", activityEn: "Pitch & demo prep", icon: "presentation" },
        { time: "13h10 - 13h30", activityFr: "Critères d'évaluation et clôture", activityEn: "Judging criteria & wrap-up", icon: "jury" },
      ],
    },
    {
      day: 3,
      labelFr: "Jour 3 - Demo Day & Cérémonie",
      labelEn: "Day 3 - Demo Day & Ceremony",
      subtitleFr: "08h00 - 13h30",
      subtitleEn: "8:00 AM - 1:30 PM",
      slots: [
        { time: "08h00 - 08h20", activityFr: "Installation et tests techniques", activityEn: "Setup & tech checks", icon: "build" },
        { time: "08h20 - 08h35", activityFr: "Mot d'ouverture Demo Day", activityEn: "Demo Day opening", icon: "mic" },
        { time: "08h35 - 10h35", activityFr: "Pitch + demo + questions jury", activityEn: "Pitch + demo + jury Q&A", icon: "jury" },
        { time: "10h35 - 10h50", activityFr: "Pause cafe & networking", activityEn: "Coffee break & networking", icon: "coffee" },
        { time: "10h50 - 11h20", activityFr: "Intervention entrepreneur / partenaire", activityEn: "Guest entrepreneur / partner talk", icon: "mic" },
        { time: "11h20 - 11h50", activityFr: "Délibération jury & programmes partenaires", activityEn: "Jury deliberation & partner programs", icon: "partners" },
        { time: "11h50 - 12h20", activityFr: "Annonce des gagnants et remise des prix", activityEn: "Winners announcement & awards", icon: "award" },
        { time: "12h20 - 12h40", activityFr: "Certificats, partenariats symboliques, photos", activityEn: "Certificates, partnerships, photos", icon: "award" },
        { time: "12h40 - 13h00", activityFr: "Cocktail de clôture", activityEn: "Closing cocktail", icon: "network" },
        { time: "13h00 - 13h30", activityFr: "Interviews presse et cloture officielle", activityEn: "Press interviews & official close", icon: "media" },
      ],
    },
  ];
}

export function crossCuttingActivities(isFr: boolean): string[] {
  if (isFr) {
    return [
      "Couverture médiatique (photos, vidéos, réseaux sociaux)",
      "Espace partenaires (produits, services, opportunités)",
      "Interviews équipes et mentors",
      "Publications live McBuleli & partenaires",
      "Capsules sponsors aux transitions",
      "Rencontres B2B partenaires - mentors - porteurs de projets",
    ];
  }
  return [
    "Media coverage (photos, video, social)",
    "Partner booth (products, services, opportunities)",
    "Team & mentor interviews",
    "Live posts from McBuleli & partners",
    "Sponsor spots during transitions",
    "B2B meetings: partners - mentors - founders",
  ];
}

const PRIZES: PrizeCard[] = [
  {
    id: "first",
    icon: "first",
    titleFr: "Prix ILOKWE",
    titleEn: "ILOKWE Prize",
    bodyFr:
      "Premier prix - meilleure équipe globale. Nommée en partenariat avec ILOKWE GROUP (valorisation agricole & chaîne de production).",
    bodyEn:
      "First prize - top overall team. Named in partnership with ILOKWE GROUP (agri value & production chain).",
  },
  { id: "second", icon: "second", titleFr: "Deuxième Prix", titleEn: "Second Prize", bodyFr: "Excellence technique et exécution.", bodyEn: "Technical excellence & execution." },
  { id: "third", icon: "third", titleFr: "Troisième Prix", titleEn: "Third Prize", bodyFr: "Projet prometteur avec fort potentiel.", bodyEn: "Promising project with strong potential." },
  { id: "innovation", icon: "innovation", titleFr: "Prix Innovation", titleEn: "Innovation Award", bodyFr: "Solution la plus originale et créative.", bodyEn: "Most original & creative solution." },
  { id: "impact", icon: "impact", titleFr: "Prix Impact Social", titleEn: "Social Impact Award", bodyFr: "Impact mesurable pour la communauté en RDC.", bodyEn: "Measurable impact for communities in DRC." },
];

export function podiumPrizes(_isFr: boolean): PrizeCard[] {
  return PRIZES;
}

const BENEFITS: PartnerBenefit[] = [
  { id: "visibility", icon: "visibility", titleFr: "Visibilité", titleEn: "Visibility", bodyFr: "Logo, mentions et présence sur site & réseaux.", bodyEn: "Logo, mentions & presence on site & social." },
  { id: "talents", icon: "talents", titleFr: "Accès aux talents", titleEn: "Talent access", bodyFr: "Rencontrez builders, étudiants et entrepreneurs.", bodyEn: "Meet builders, students and founders." },
  { id: "innovation", icon: "innovation", titleFr: "Innovation", titleEn: "Innovation", bodyFr: "Co-créez autour de l'IA et des défis locaux.", bodyEn: "Co-create around AI and local challenges." },
  { id: "impact", icon: "impact", titleFr: "Impact social", titleEn: "Social impact", bodyFr: "Soutenez la jeunesse tech congolaise.", bodyEn: "Support Congolese tech youth." },
  { id: "network", icon: "network", titleFr: "Networking", titleEn: "Networking", bodyFr: "Rencontres B2B avec mentors et porteurs de projets.", bodyEn: "B2B with mentors and project leads." },
  { id: "hiring", icon: "hiring", titleFr: "Recrutement", titleEn: "Hiring", bodyFr: "Identifiez des profils prometteurs sur place.", bodyEn: "Spot promising profiles on site." },
  { id: "comms", icon: "comms", titleFr: "Communication", titleEn: "Communications", bodyFr: "Contenu réutilisable (talks, interviews, capsules).", bodyEn: "Reusable content (talks, interviews, spots)." },
  { id: "report", icon: "report", titleFr: "Rapport d'impact", titleEn: "Impact report", bodyFr: "Synthèse post-événement (portée, équipes, médias).", bodyEn: "Post-event summary (reach, teams, media)." },
];

export function partnerBenefits(_isFr: boolean): PartnerBenefit[] {
  return BENEFITS;
}

export function sponsorTiers(): SponsorTier[] {
  return [
    {
      id: "platinum",
      labelFr: "Platine",
      labelEn: "Platinum",
      perksFr: ["Logo XXL", "Stand premium", "Intervention officielle", "Siège jury", "Communication maximale"],
      perksEn: ["XXL logo", "Premium booth", "Official talk", "Jury seat", "Maximum comms"],
    },
    {
      id: "gold",
      labelFr: "Or",
      labelEn: "Gold",
      perksFr: ["Logo large", "Stand événement", "Atelier ou talk", "Mention presse", "Visibilité réseaux"],
      perksEn: ["Large logo", "Event booth", "Workshop or talk", "Press mention", "Social visibility"],
    },
    {
      id: "silver",
      labelFr: "Argent",
      labelEn: "Silver",
      perksFr: ["Logo page hackathon", "Stand partagé", "Kit presse", "Mention réseaux"],
      perksEn: ["Hackathon page logo", "Shared booth", "Press kit", "Social mention"],
    },
    {
      id: "bronze",
      labelFr: "Bronze",
      labelEn: "Bronze",
      perksFr: ["Logo partenaire", "Mention événement", "Présence espace partenaires"],
      perksEn: ["Partner logo", "Event mention", "Partner area presence"],
    },
  ];
}

export function hackathonFaqNav(isFr: boolean): { q: string; a: string }[] {
  if (isFr) {
    return [
      {
        q: "Qui peut participer ?",
        a: "Étudiants, développeurs, designers, entrepreneurs et profils pluridisciplinaires. Les débutants sont les bienvenus grâce au bootcamp Jour 1.",
      },
      {
        q: "Faut-il une équipe ?",
        a: "Non. Inscrivez-vous seul ou en équipe - la formation des équipes a lieu le Jour 1.",
      },
      {
        q: "Le hackathon est-il gratuit ?",
        a: "Non. Tarif unique : 100 USD pour le programme complet (3 demi-journées). Des bourses partenaires peuvent être annoncées.",
      },
      {
        q: "Quels sont les critères ?",
        a: "Innovation (25 %), impact (25 %), qualité technique (20 %), business model (15 %) et présentation (15 %).",
      },
      {
        q: "Qui garde la propriété intellectuelle ?",
        a: "Les participants conservent la PI de leurs projets, sauf accord écrit avec un partenaire. McBuleli peut communiquer sur les projets présentés.",
      },
      {
        q: "Comment devenir partenaire ?",
        a: "Remplissez le formulaire Partenaire ou contactez-nous. Chaque collaboration est définie sur mesure après échange.",
      },
      {
        q: "Comment devenir sponsor ?",
        a: "Choisissez un niveau (Bronze à Platine) via le formulaire Sponsor. Les montants seront confirmés lors de la discussion.",
      },
      {
        q: "Comment utiliser les APIs Binance (demo) ?",
        a: "Intégrez les endpoints demo Spot (demo-api.binance.com) et Futures (demo-fapi.binance.com) via les APIs demo.binance.com dans votre prototype. Documentation : developers.binance.com.",
      },
    ];
  }
  return [
    {
      q: "Who can participate?",
      a: "Students, developers, designers, founders and multidisciplinary profiles. Beginners welcome thanks to Day 1 bootcamp.",
    },
    {
      q: "Do I need a team?",
      a: "No. Register solo or as a team - team formation happens on Day 1.",
    },
    {
      q: "Is the hackathon free?",
      a: "No. Single price: 100 USD for the full 3 half-day program. Partner scholarships may be announced.",
    },
    {
      q: "What are the criteria?",
      a: "Innovation (25%), impact (25%), technical quality (20%), business model (15%) and presentation (15%).",
    },
    {
      q: "Who owns the intellectual property?",
      a: "Participants keep IP unless otherwise agreed with a partner. McBuleli may communicate about presented projects.",
    },
    {
      q: "How to become a partner?",
      a: "Fill the Partner form or contact us. Each collaboration is tailored after discussion.",
    },
    {
      q: "How to become a sponsor?",
      a: "Pick a tier (Bronze to Platinum) via the Sponsor form. Amounts confirmed during discussion.",
    },
    {
      q: "How to use Binance demo APIs?",
      a: "Create an account on demo.binance.com, then API Management to generate keys. Spot: demo-api.binance.com · Futures: demo-fapi.binance.com. Docs: developers.binance.com.",
    },
  ];
}

export function aboutBlurb(isFr: boolean): { title: string; body: string } {
  if (isFr) {
    return {
      title: "3 demi-journées pour apprendre, builder et pitcher",
      body: "Bootcamp Vibe Coding avec Cursor, Claude et Codex, hackathon intensif et Demo Day au Silikin Village (août 2026). Format professionnel pensé pour la RDC - visibilité partenaires et expérience fluide pour les équipes.",
    };
  }
  return {
    title: "3 half-days to learn, build and pitch",
    body: "Vibe Coding bootcamp with Cursor, Claude and Codex, intensive hackathon and Demo Day at Silikin Village (August 2026). A professional format built for DRC - partner visibility and a smooth experience for teams.",
  };
}

export function eventDateLabel(
  startDate: string | null,
  isFr: boolean,
): string {
  if (!startDate) {
    return isFr ? HACKATHON_DATES_LABEL_FR : HACKATHON_DATES_LABEL_EN;
  }
  try {
    return new Date(startDate).toLocaleDateString(isFr ? "fr-FR" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return isFr ? HACKATHON_DATES_LABEL_FR : HACKATHON_DATES_LABEL_EN;
  }
}

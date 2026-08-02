/**
 * Configurable marketing content for McBuleli events (hackathons, bootcamps, etc.).
 * Edit this file to reuse the landing template for other editions.
 */
import type { BenefitIconId, PrizeIconId } from "@/components/hackathon/event-icons";
import {
  sortFeaturedPartnersByShape,
  type PartnerLogoShape,
} from "@/lib/hackathon/partner-logo-display";

export type EventNavItem = {
  id: string;
  labelFr: string;
  labelEn: string;
  /** Absolute path for off-page links (e.g. /hackathon/chat). Default: #id */
  href?: string;
};

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

/** Edition year shown on the landing. */
export const HACKATHON_EVENT_YEAR = 2026;

export const HACKATHON_EVENT_DAYS = 2;

/** Confirmed schedule at Silikin Village. */
export const HACKATHON_DATES_CONFIRMED = true;

export const HACKATHON_DATES_LABEL_FR = "28–29 Août 2026";
export const HACKATHON_DATES_LABEL_EN = "August 28–29, 2026";

export const HACKATHON_HOURS_LABEL_FR = "08h00 – 17h00";
export const HACKATHON_HOURS_LABEL_EN = "8:00 AM – 5:00 PM";

/** Compact hours for badges / tickets (matches spoken form). */
export const HACKATHON_HOURS_COMPACT_FR = "8h00 - 17h00";
export const HACKATHON_HOURS_COMPACT_EN = "8:00 AM - 5:00 PM";

/** Day 1 door open - Africa/Kinshasa (UTC+1). */
export const HACKATHON_START_AT = "2026-08-28T08:00:00+01:00";

export const HACKATHON_VENUE_SHORT = "Silikin Village";

export const HACKATHON_SCHEDULE_SUMMARY = [
  {
    weekdayFr: "Vendredi",
    weekdayEn: "Friday",
    dateFr: "28 Août 2026",
    dateEn: "August 28, 2026",
    hoursFr: "08h00 – 17h00",
    hoursEn: "8:00 AM – 5:00 PM",
    focusFr: "Bootcamp & Build",
    focusEn: "Bootcamp & Build",
  },
  {
    weekdayFr: "Samedi",
    weekdayEn: "Saturday",
    dateFr: "29 Août 2026",
    dateEn: "August 29, 2026",
    hoursFr: "08h00 – 17h00",
    hoursEn: "8:00 AM – 5:00 PM",
    focusFr: "Build & Demo Day",
    focusEn: "Build & Demo Day",
  },
] as const;

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

/** Crypto stack for builders via Binance demo APIs (not a signed partnership). */
export const BINANCE_PARTNER = {
  name: "Binance",
  roleFr: "Demo Crypto",
  roleEn: "Crypto Demo",
  website: "https://www.binance.com/",
  demo: "https://demo.binance.com/",
  docs: "https://developers.binance.com/",
  logoUrl: "/partners/binance-logo.png",
  blurbFr:
    "Pas un partenariat signé. Les équipes utilisent demo Binance pour tester l'intégration crypto (Spot & Futures via demo.binance.com : demo-api.binance.com · demo-fapi.binance.com).",
  blurbEn:
    "Not a signed partnership. Teams use Binance demo to test crypto integration (Spot & Futures via demo.binance.com: demo-api.binance.com · demo-fapi.binance.com).",
} as const;

/** Confirmed agriculture / AgriBusiness partner (AgroTech challenge + Prix ILOKWE). */
export const ILOKWE_PARTNER = {
  name: "ILOKWE GROUP",
  roleFr: "Partenaire Agriculture & AgriBusiness · Sponsor Or",
  roleEn: "Agriculture & AgriBusiness Partner · Gold Sponsor",
  website: "https://www.facebook.com/profile.php?id=100065743382631",
  facebook: "https://www.facebook.com/profile.php?id=100065743382631",
  logoUrl: "/partners/ilokwe-group-logo.png?v=20260724c",
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

/** Confirmed venue / innovation hub partner (host site). */
export const SILIKIN_PARTNER = {
  name: "Silikin Village",
  roleFr: "Partenaire Lieu · Hub d'innovation",
  roleEn: "Venue Partner · Innovation Hub",
  website: "https://www.silikinvillage.com/",
  logoUrl: "/partners/silikin-village-logo.png",
  blurbFr:
    "Hub d'innovation et d'entrepreneuriat à Kinshasa (Gombe). Accueille le McBuleli Hackathon : bootcamp, build et Demo Day.",
  blurbEn:
    "Innovation and entrepreneurship hub in Kinshasa (Gombe). Hosts the McBuleli Hackathon: bootcamp, build and Demo Day.",
} as const;

/** Confirmed digital / SaaS partner (Kisangani → Kinshasa ecosystem). */
export const SANJA_PARTNER = {
  name: "SanJa",
  roleFr: "Partenaire Transformation Numérique & SaaS",
  roleEn: "Digital Transformation & SaaS Partner",
  website: "https://www.sanjaservice.com/",
  logoUrl: "/partners/sanja-service-logo.png?v=20260725c",
  contactName: "Ir Joseph TOKOMBE",
  email: "josephtokombe@icloud.com",
  blurbFr:
    "Basée à Kisangani, SanJa (Sanja Service) accompagne la transformation numérique en RDC : SaaS (Commerce, GPME), cloud, web & apps, réseaux et formation. Partenaire confirmé pour mentorat produit / tech et relais auprès des PME.",
  blurbEn:
    "Based in Kisangani, SanJa (Sanja Service) drives digital transformation in DRC: SaaS (Commerce, GPME), cloud, web & apps, networks and training. Confirmed partner for product/tech mentoring and SME outreach.",
} as const;

/** Confirmed services & talents partner (mentoring employability). */
export const KIMIA_PARTNER = {
  name: "KIMIA Service",
  roleFr: "Partenaire Services & Talents - Mentorat",
  roleEn: "Services & Talents Partner - Mentoring",
  website: "https://facebook.com/p/KIMIA-61560600003901/",
  logoUrl: "/partners/kimia-service-logo.png?v=20260728",
  contactName: "Mr Mike Mulopo",
  email: "kimiaservice896@gmail.com",
  blurbFr:
    "Services aux particuliers et entreprises : recrutement, mise en relation et accompagnement professionnel.",
  blurbEn:
    "Services for individuals and businesses: recruitment, matchmaking and professional support.",
} as const;

/** Confirmed policy & impact think tank (workshop + jury). */
export const RDPI_PARTNER = {
  name: "RDPI Think Tank",
  roleFr: "Partenaire Policy & Impact - Atelier - Jury",
  roleEn: "Policy & Impact Partner - Workshop - Jury",
  website: "https://rdpithinktank.org/",
  logoUrl: "/partners/rdpi-thinktank-logo.png?v=20260728b",
  contactName: "Mr Aristote MUGISHO",
  email: "info@rdpithinktank.org",
  blurbFr:
    "Think tank indépendant en RDC : recherche, analyses et recommandations pour éclairer les politiques publiques et la prospérité.",
  blurbEn:
    "Independent DRC think tank: research, analysis and recommendations to inform public policy and prosperity.",
} as const;

/** Confirmed local services marketplace partner (talk + mentoring). */
export const KILELO_PARTNER = {
  name: "Kilelo",
  roleFr: "Partenaire Marketplace Services Locaux - Talk - Mentorat",
  roleEn: "Local Services Marketplace Partner - Talk - Mentoring",
  website: "https://kileloapp.com/",
  logoUrl: "/partners/kilelo-logo.png?v=20260728c",
  /** Circular mark for avatars / mentor cards. */
  markUrl: "/partners/kilelo-logo-mark.png?v=20260728c",
  contactName: "Jeancy Kabangu",
  email: "support@kileloapp.com",
  sloganFr: "Services & petits boulots",
  sloganEn: "Services & small jobs",
  blurbFr:
    "Kilelo connecte les clients avec des travailleurs locaux qualifiés à Kinshasa. Consultez les profils, lisez les avis, et contactez directement le professionnel qu'il vous faut.",
  blurbEn:
    "Kilelo connects clients with qualified local workers in Kinshasa. Browse profiles, read reviews, and contact the professional you need directly.",
} as const;

/** Confirmed academic partner (IA training + CHK digital campus). */
export const IA_ACADEMIE_PARTNER = {
  name: "IA Académie RDC",
  roleFr: "Partenaire académique - Vivier - Atelier / Mentorat",
  roleEn: "Academic Partner - Talent pool - Workshop / Mentoring",
  website: "https://ia-academie.cd/",
  logoUrl: "/partners/ia-academie-logo.png?v=20260729",
  contactName: "Rodrigue KASHARA DAVID",
  email: "contact@ia-academie.cd",
  phone: "+243 901 815 632",
  blurbFr:
    "Centre de formation en Intelligence Artificielle en RDC depuis 2015. Programmes certifiants : IA générative, LLMs, agents autonomes, prompting, analyse de données et automatisation - vivier de talents pour le McBuleli Hackathon.",
  blurbEn:
    "AI training centre in DRC since 2015. Certified programs: generative AI, LLMs, autonomous agents, prompting, data analysis and automation - talent pool for the McBuleli Hackathon.",
} as const;

/** Confirmed FinTech / escrow partner (talk + mentoring marketplace / wallet). */
export const MONTANA_PAY_PARTNER = {
  name: "MontanaPay",
  roleFr: "Partenaire FinTech / Escrow - Talk - Mentorat",
  roleEn: "FinTech / Escrow Partner - Talk - Mentoring",
  website: "https://montana-pay.com/",
  logoUrl: "/partners/montana-pay-logo.jpg?v=20260729b",
  contactName: "Delly Montana",
  email: "montanadelly7@gmail.com",
  blurbFr:
    "Wallet sécurisé et e-commerce avec protection Escrow anti-arnaque. Paiements protégés jusqu'à validation de livraison, transferts instantanés et retraits Mobile Money (Orange, Airtel, M-Pesa…). Référence FinTech pour les prototypes marketplace du McBuleli Hackathon.",
  blurbEn:
    "Secure wallet and e-commerce with anti-scam Escrow protection. Funds held until delivery validation, instant transfers and Mobile Money cash-out (Orange, Airtel, M-Pesa…). FinTech reference for marketplace prototypes at the McBuleli Hackathon.",
} as const;

/** Featured partner logos on landing + badges/tickets. Add here to auto-update all surfaces. */
export type HackathonFeaturedLogo = {
  id: string;
  name: string;
  logoUrl: string;
  href: string;
  /** Tile background (brand fill, like Binance / pawaPay). */
  tileBgClass: string;
  /** contain = letterbox in tile (pawaPay/Binance/ILOKWE); cover = full-bleed photo logos. */
  fit: "contain" | "cover";
  /** wide = horizontal · wide-bleed = horizontal full-bleed (Binance) · square-bleed = full square · round = circle */
  shape: PartnerLogoShape;
  /** Optional Tailwind scale on the image (e.g. round logos). */
  imageScaleClass?: string;
};

const FEATURED_PARTNER_LOGOS: HackathonFeaturedLogo[] = [
  {
    id: "kilelo",
    name: KILELO_PARTNER.name,
    logoUrl: KILELO_PARTNER.logoUrl,
    href: KILELO_PARTNER.website,
    tileBgClass: "bg-white",
    fit: "contain",
    shape: "wide",
  },
  {
    id: "pawapay",
    name: PAWAPAY_PARTNER.name,
    logoUrl: PAWAPAY_PARTNER.logoUrl,
    href: PAWAPAY_PARTNER.website,
    tileBgClass: "bg-[#F7F7F7]",
    fit: "contain",
    shape: "wide",
  },
  {
    id: "sanja",
    name: SANJA_PARTNER.name,
    logoUrl: SANJA_PARTNER.logoUrl,
    href: SANJA_PARTNER.website,
    tileBgClass: "bg-[#F5F2EB]",
    fit: "contain",
    shape: "wide",
  },
  {
    id: "rdpi",
    name: RDPI_PARTNER.name,
    logoUrl: RDPI_PARTNER.logoUrl,
    href: RDPI_PARTNER.website,
    tileBgClass: "bg-white",
    fit: "contain",
    shape: "wide",
  },
  {
    id: "montana-pay",
    name: MONTANA_PAY_PARTNER.name,
    logoUrl: MONTANA_PAY_PARTNER.logoUrl,
    href: MONTANA_PAY_PARTNER.website,
    tileBgClass: "bg-white",
    fit: "contain",
    shape: "square-bleed",
    imageScaleClass: "scale-[1.2]",
  },
  {
    id: "binance",
    name: BINANCE_PARTNER.name,
    logoUrl: BINANCE_PARTNER.logoUrl,
    href: BINANCE_PARTNER.demo,
    tileBgClass: "bg-[#0B0E11]",
    fit: "cover",
    shape: "wide-bleed",
  },
  {
    id: "ilokwe",
    name: ILOKWE_PARTNER.name,
    logoUrl: ILOKWE_PARTNER.logoUrl,
    href: ILOKWE_PARTNER.facebook,
    tileBgClass: "bg-[#2e5506]",
    fit: "cover",
    shape: "square-bleed",
  },
  {
    id: "kimia",
    name: KIMIA_PARTNER.name,
    logoUrl: KIMIA_PARTNER.logoUrl,
    href: KIMIA_PARTNER.website,
    tileBgClass: "bg-[#0c0a09]",
    fit: "contain",
    shape: "round",
    imageScaleClass: "scale-[1.12]",
  },
  {
    id: "ia-academie",
    name: IA_ACADEMIE_PARTNER.name,
    logoUrl: IA_ACADEMIE_PARTNER.logoUrl,
    href: IA_ACADEMIE_PARTNER.website,
    tileBgClass: "bg-white",
    fit: "contain",
    shape: "square-bleed",
    imageScaleClass: "scale-[1.30]",
  },
];

export function hackathonFeaturedPartners(): HackathonFeaturedLogo[] {
  return sortFeaturedPartnersByShape(FEATURED_PARTNER_LOGOS);
}

export type HackathonPartnerDetailRow = {
  logo: HackathonFeaturedLogo;
  roleFr: string;
  roleEn: string;
  blurbFr: string;
  blurbEn: string;
  metaFr: string;
  metaEn: string;
};

/** Partner detail cards (same shape order as ecosystem grid). */
export function hackathonPartnerDetails(): HackathonPartnerDetailRow[] {
  const rows: HackathonPartnerDetailRow[] = [
    {
      logo: FEATURED_PARTNER_LOGOS.find((p) => p.id === "kilelo")!,
      roleFr: KILELO_PARTNER.roleFr,
      roleEn: KILELO_PARTNER.roleEn,
      blurbFr: KILELO_PARTNER.blurbFr,
      blurbEn: KILELO_PARTNER.blurbEn,
      metaFr: "kileloapp.com · Kinshasa · services & petits boulots",
      metaEn: "kileloapp.com · Kinshasa · services & small jobs",
    },
    {
      logo: FEATURED_PARTNER_LOGOS.find((p) => p.id === "pawapay")!,
      roleFr: PAWAPAY_PARTNER.roleFr,
      roleEn: PAWAPAY_PARTNER.roleEn,
      blurbFr: PAWAPAY_PARTNER.blurbFr,
      blurbEn: PAWAPAY_PARTNER.blurbEn,
      metaFr: "pawapay.io · docs.pawapay.io",
      metaEn: "pawapay.io · docs.pawapay.io",
    },
    {
      logo: FEATURED_PARTNER_LOGOS.find((p) => p.id === "sanja")!,
      roleFr: SANJA_PARTNER.roleFr,
      roleEn: SANJA_PARTNER.roleEn,
      blurbFr: SANJA_PARTNER.blurbFr,
      blurbEn: SANJA_PARTNER.blurbEn,
      metaFr: "sanjaservice.com · Kisangani · SaaS & digital",
      metaEn: "sanjaservice.com · Kisangani · SaaS & digital",
    },
    {
      logo: FEATURED_PARTNER_LOGOS.find((p) => p.id === "rdpi")!,
      roleFr: RDPI_PARTNER.roleFr,
      roleEn: RDPI_PARTNER.roleEn,
      blurbFr: RDPI_PARTNER.blurbFr,
      blurbEn: RDPI_PARTNER.blurbEn,
      metaFr: "rdpithinktank.org",
      metaEn: "rdpithinktank.org",
    },
    {
      logo: FEATURED_PARTNER_LOGOS.find((p) => p.id === "montana-pay")!,
      roleFr: MONTANA_PAY_PARTNER.roleFr,
      roleEn: MONTANA_PAY_PARTNER.roleEn,
      blurbFr: MONTANA_PAY_PARTNER.blurbFr,
      blurbEn: MONTANA_PAY_PARTNER.blurbEn,
      metaFr: "montana-pay.com · Escrow · Mobile Money",
      metaEn: "montana-pay.com · Escrow · Mobile Money",
    },
    {
      logo: FEATURED_PARTNER_LOGOS.find((p) => p.id === "binance")!,
      roleFr: BINANCE_PARTNER.roleFr,
      roleEn: BINANCE_PARTNER.roleEn,
      blurbFr: BINANCE_PARTNER.blurbFr,
      blurbEn: BINANCE_PARTNER.blurbEn,
      metaFr: "demo.binance.com · developers.binance.com",
      metaEn: "demo.binance.com · developers.binance.com",
    },
    {
      logo: FEATURED_PARTNER_LOGOS.find((p) => p.id === "ilokwe")!,
      roleFr: ILOKWE_PARTNER.roleFr,
      roleEn: ILOKWE_PARTNER.roleEn,
      blurbFr: ILOKWE_PARTNER.blurbFr,
      blurbEn: ILOKWE_PARTNER.blurbEn,
      metaFr: "Facebook · Prix ILOKWE · Sponsor Or · Jury",
      metaEn: "Facebook · ILOKWE Prize · Gold Sponsor · Jury",
    },
    {
      logo: FEATURED_PARTNER_LOGOS.find((p) => p.id === "kimia")!,
      roleFr: KIMIA_PARTNER.roleFr,
      roleEn: KIMIA_PARTNER.roleEn,
      blurbFr: KIMIA_PARTNER.blurbFr,
      blurbEn: KIMIA_PARTNER.blurbEn,
      metaFr: "Facebook · mentorat employabilité",
      metaEn: "Facebook · employability mentoring",
    },
    {
      logo: FEATURED_PARTNER_LOGOS.find((p) => p.id === "ia-academie")!,
      roleFr: IA_ACADEMIE_PARTNER.roleFr,
      roleEn: IA_ACADEMIE_PARTNER.roleEn,
      blurbFr: IA_ACADEMIE_PARTNER.blurbFr,
      blurbEn: IA_ACADEMIE_PARTNER.blurbEn,
      metaFr: "ia-academie.cd · CHK · formations IA certifiantes",
      metaEn: "ia-academie.cd · CHK · certified AI programs",
    },
  ];
  return sortFeaturedPartnersByShape(rows.map((r) => r.logo)).map(
    (logo) => rows.find((r) => r.logo.id === logo.id)!,
  );
}

const CHAT_PARTNER_LOGO_BY_SLUG: Record<string, string> = {
  ilokwe: "ilokwe",
  pawapay: "pawapay",
  binance: "binance",
  kimia: "kimia",
  "sanja-service": "sanja",
  rdpi: "rdpi",
  kilelo: "kilelo",
  "ia-academie-chk": "ia-academie",
  "montana-pay": "montana-pay",
};

const CHAT_PARTNER_LOGO_BY_SHORT: Record<string, string> = {
  kimia: "kimia",
  rdpi: "rdpi",
  pawapay: "pawapay",
  binance: "binance",
  ilokwe: "ilokwe",
  sanja: "sanja",
  kilelo: "kilelo",
  iaacadémie: "ia-academie",
  iaacademie: "ia-academie",
  montanapay: "montana-pay",
};

/** Featured logo tile for partner chat (slug or shortName). */
export function featuredPartnerForChatOrg(org: {
  slug?: string | null;
  shortName?: string | null;
}): HackathonFeaturedLogo | undefined {
  const slug = (org.slug ?? "").toLowerCase();
  const featuredId =
    CHAT_PARTNER_LOGO_BY_SLUG[slug] ??
    CHAT_PARTNER_LOGO_BY_SHORT[(org.shortName ?? "").toLowerCase().replace(/\s+/g, "")];
  if (!featuredId) return undefined;
  return FEATURED_PARTNER_LOGOS.find((p) => p.id === featuredId);
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
  /** Portrait URL - set when provided; null shows initial. */
  photoUrl: string | null;
  photoFit?: "cover" | "contain";
  /** Circle avatar background when photoUrl is a brand logo. */
  photoBgClass?: string;
  href: string | null;
};

export type HackathonFeaturedMentor = {
  id: string;
  name: string;
  company: string | null;
  titleFr: string;
  titleEn: string;
  expertiseFr: string;
  expertiseEn: string;
  photoUrl: string | null;
  photoFit?: "cover" | "contain";
  /** Optional circle background (brand fill). */
  photoBgClass?: string;
  /** Optional Tailwind scale on the avatar image. */
  photoScaleClass?: string;
  href: string | null;
};

/** Featured jury members on the landing (merge with DB / demo rows). */
export function hackathonFeaturedJury(): HackathonFeaturedJury[] {
  return [
    {
      id: "jury-ilokwe-christian",
      name: ILOKWE_PARTNER.contactName,
      company: ILOKWE_PARTNER.name,
      titleFr: "Jury - Agriculture & AgriBusiness",
      titleEn: "Jury - Agriculture & AgriBusiness",
      expertiseFr: "AgroTech - chaîne de valeur & Prix ILOKWE",
      expertiseEn: "AgroTech - value chain & ILOKWE Prize",
      photoUrl: ILOKWE_PARTNER.logoUrl,
      photoFit: "cover",
      photoBgClass: "bg-[#2e5506]",
      href: ILOKWE_PARTNER.facebook,
    },
    {
      id: "jury-rdpi-aristote",
      name: RDPI_PARTNER.contactName,
      company: RDPI_PARTNER.name,
      titleFr: "Jury - Policy & Impact",
      titleEn: "Jury - Policy & Impact",
      expertiseFr: "Politiques publiques, régulation & impact socio-économique",
      expertiseEn: "Public policy, regulation & socio-economic impact",
      photoUrl: RDPI_PARTNER.logoUrl,
      photoFit: "contain",
      href: RDPI_PARTNER.website,
    },
  ];
}

/** Featured mentors on the landing (merge with DB / demo rows). */
export function hackathonFeaturedMentors(): HackathonFeaturedMentor[] {
  return [
    {
      id: "mentor-kimia-mike",
      name: KIMIA_PARTNER.contactName,
      company: KIMIA_PARTNER.name,
      titleFr: "Mentor - Services & Talents",
      titleEn: "Mentor - Services & Talents",
      expertiseFr: "Employabilité, professionnalisation & mise en relation talents",
      expertiseEn: "Employability, professionalization & talent matching",
      photoUrl: KIMIA_PARTNER.logoUrl,
      photoFit: "cover",
      href: KIMIA_PARTNER.website,
    },
    {
      id: "mentor-kilelo-jeancy",
      name: KILELO_PARTNER.contactName,
      company: KILELO_PARTNER.name,
      titleFr: "Mentor - Marketplace services locaux",
      titleEn: "Mentor - Local services marketplace",
      expertiseFr: "Matching, avis, confiance & contact client-travailleur à Kinshasa",
      expertiseEn: "Matching, reviews, trust & client-worker contact in Kinshasa",
      photoUrl: KILELO_PARTNER.markUrl,
      photoFit: "cover",
      href: KILELO_PARTNER.website,
    },
    {
      id: "mentor-ia-academie-rodrigue",
      name: IA_ACADEMIE_PARTNER.contactName,
      company: IA_ACADEMIE_PARTNER.name,
      titleFr: "Mentor - IA & formation",
      titleEn: "Mentor - AI & training",
      expertiseFr: "IA générative, prompting, agents & automatisation",
      expertiseEn: "Generative AI, prompting, agents & automation",
      photoUrl: IA_ACADEMIE_PARTNER.logoUrl,
      photoFit: "contain",
      photoBgClass: "bg-white ring-1 ring-[color:var(--fd-primary)]/15",
      href: IA_ACADEMIE_PARTNER.website,
    },
    {
      id: "mentor-montana-pay",
      name: MONTANA_PAY_PARTNER.contactName,
      company: MONTANA_PAY_PARTNER.name,
      titleFr: "Mentor - FinTech / Escrow",
      titleEn: "Mentor - FinTech / Escrow",
      expertiseFr: "Escrow, marketplace, wallet & Mobile Money",
      expertiseEn: "Escrow, marketplace, wallet & Mobile Money",
      photoUrl: MONTANA_PAY_PARTNER.logoUrl,
      photoFit: "contain",
      photoBgClass: "bg-white ring-1 ring-[color:var(--fd-primary)]/15",
      href: MONTANA_PAY_PARTNER.website,
    },
  ];
}

export const HACKATHON_NAV: EventNavItem[] = [
  { id: "register", labelFr: "Participer", labelEn: "Join" },
  { id: "espace", labelFr: "Mon espace", labelEn: "My hub", href: "/hackathon/espace" },
  { id: "defis", labelFr: "Défis", labelEn: "Challenges" },
  { id: "prix", labelFr: "Prix", labelEn: "Prizes" },
  { id: "programme", labelFr: "Programme", labelEn: "Program" },
  { id: "parcours", labelFr: "Parcours", labelEn: "Journey" },
  { id: "about", labelFr: "À propos", labelEn: "About" },
  { id: "partenaires", labelFr: "Écosystème", labelEn: "Ecosystem" },
  { id: "chat", labelFr: "Échange", labelEn: "Exchange", href: "/hackathon/chat" },
  { id: "slides", labelFr: "Slides", labelEn: "Slides", href: "/hackathon/slides" },
  { id: "live", labelFr: "Live", labelEn: "Live", href: "/hackathon/live" },
  { id: "faq", labelFr: "FAQ", labelEn: "FAQ" },
  { id: "contact", labelFr: "Contact", labelEn: "Contact" },
];

export function defaultHeroStats(
  _mentorsCount: number,
  partnersCount: number,
): EventHeroStats {
  return {
    teamsExpected: 12,
    mentorsLabelFr: "5+",
    mentorsLabelEn: "5+",
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
      labelFr: "Vendredi 28 Août - Bootcamp & Build",
      labelEn: "Friday, August 28 - Bootcamp & Build",
      subtitleFr: "08h00 – 17h00 · Silikin Village",
      subtitleEn: "8:00 AM – 5:00 PM · Silikin Village",
      slots: [
        { time: "08h00 - 08h45", activityFr: "Accueil, badges et networking", activityEn: "Welcome, badges & networking", icon: "welcome" },
        { time: "08h45 - 09h00", activityFr: "Mot de bienvenue McBuleli et objectifs", activityEn: "McBuleli welcome & goals", icon: "mic" },
        { time: "09h00 - 09h25", activityFr: "Discours partenaire principal", activityEn: "Lead partner keynote", icon: "partners" },
        { time: "09h25 - 09h40", activityFr: "Présentation partenaires et sponsors", activityEn: "Partners & sponsors intro", icon: "partners" },
        { time: "09h40 - 10h15", activityFr: "Présentation des défis et règles", activityEn: "Challenges & rules briefing", icon: "target" },
        { time: "10h15 - 10h30", activityFr: "Pause café", activityEn: "Coffee break", icon: "coffee" },
        { time: "10h30 - 11h20", activityFr: "Bootcamp 1 : Design Thinking & validation", activityEn: "Bootcamp 1: Design Thinking & validation", icon: "brain" },
        { time: "11h20 - 12h15", activityFr: "Bootcamp 2 : Cursor, Claude, Codex & APIs", activityEn: "Bootcamp 2: Cursor, Claude, Codex & APIs", icon: "code" },
        { time: "12h15 - 12h35", activityFr: "Q&R bootcamp avec intervenants", activityEn: "Bootcamp Q&A with trainers", icon: "help" },
        { time: "12h35 - 13h30", activityFr: "Pause déjeuner & networking", activityEn: "Lunch break & networking", icon: "network" },
        { time: "13h30 - 14h00", activityFr: "Formation des équipes et choix des défis", activityEn: "Team formation & challenge pick", icon: "team" },
        { time: "14h00 - 15h30", activityFr: "Développement intensif", activityEn: "Intensive development", icon: "build" },
        { time: "15h30 - 15h45", activityFr: "Pause café", activityEn: "Coffee break", icon: "coffee" },
        { time: "15h45 - 16h30", activityFr: "Mentorat pendant le build (tech & business)", activityEn: "Mentoring during build (tech & business)", icon: "help" },
        { time: "16h30 - 17h00", activityFr: "Revue d'avancement et briefing Jour 2", activityEn: "Progress check & Day 2 briefing", icon: "clock" },
      ],
    },
    {
      day: 2,
      labelFr: "Samedi 29 Août - Build & Demo Day",
      labelEn: "Saturday, August 29 - Build & Demo Day",
      subtitleFr: "08h00 – 17h00 · Silikin Village",
      subtitleEn: "8:00 AM – 5:00 PM · Silikin Village",
      slots: [
        { time: "08h00 - 08h20", activityFr: "Accueil et rappel des objectifs", activityEn: "Welcome & goals recap", icon: "welcome" },
        { time: "08h20 - 10h30", activityFr: "Développement intensif des prototypes", activityEn: "Intensive prototype development", icon: "build" },
        { time: "10h30 - 10h45", activityFr: "Pause café", activityEn: "Coffee break", icon: "coffee" },
        { time: "10h45 - 12h15", activityFr: "Mentorat tech & business (pendant le build)", activityEn: "Tech & business mentoring (during build)", icon: "help" },
        { time: "12h15 - 12h45", activityFr: "Préparation pitch & démo", activityEn: "Pitch & demo prep", icon: "presentation" },
        { time: "12h45 - 13h45", activityFr: "Pause déjeuner & networking", activityEn: "Lunch break & networking", icon: "network" },
        { time: "13h45 - 14h00", activityFr: "Ouverture Demo Day", activityEn: "Demo Day opening", icon: "mic" },
        { time: "14h00 - 15h40", activityFr: "Pitch + demo + questions jury", activityEn: "Pitch + demo + jury Q&A", icon: "jury" },
        { time: "15h40 - 15h55", activityFr: "Pause courte", activityEn: "Short break", icon: "coffee" },
        { time: "15h55 - 16h20", activityFr: "Délibération du jury", activityEn: "Jury deliberation", icon: "partners" },
        { time: "16h20 - 16h45", activityFr: "Remise des prix et annonce des gagnants", activityEn: "Awards ceremony & winners", icon: "award" },
        { time: "16h45 - 17h00", activityFr: "Certificats, photos et clôture officielle", activityEn: "Certificates, photos & official close", icon: "media" },
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
        a: "Non. Tarif unique : 100 USD pour le programme complet (2 Journées, 08h00–17h00). Des bourses partenaires peuvent être annoncées.",
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
      a: "No. Single price: 100 USD for the full 2-day program (8:00 AM–5:00 PM). Partner scholarships may be announced.",
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
      title: "2 Journées pour apprendre, builder et pitcher",
      body: `Bootcamp Vibe Coding avec Cursor, Claude et Codex, hackathon intensif et Demo Day au ${HACKATHON_VENUE_SHORT} (${HACKATHON_DATES_LABEL_FR}, ${HACKATHON_HOURS_LABEL_FR}). Format professionnel pensé pour la RDC - visibilité partenaires et expérience fluide pour les équipes.`,
    };
  }
  return {
    title: "2 days to learn, build and pitch",
    body: `Vibe Coding bootcamp with Cursor, Claude and Codex, intensive hackathon and Demo Day at ${HACKATHON_VENUE_SHORT} (${HACKATHON_DATES_LABEL_EN}, ${HACKATHON_HOURS_LABEL_EN}). A professional format built for DRC - partner visibility and a smooth experience for teams.`,
  };
}

/** Confirmed date range for UI / tickets (prefer over a single DB startDate). */
export function eventDateLabel(
  _startDate: string | null,
  isFr: boolean,
): string {
  return isFr ? HACKATHON_DATES_LABEL_FR : HACKATHON_DATES_LABEL_EN;
}

/** Pack / access label for tickets, pay UI, emails. */
export function hackathonPackLabel(isFr: boolean, withPrice?: number): string {
  const base = isFr ? "Programme 2 Jours" : "2-day program";
  if (withPrice == null) return base;
  return isFr ? `${base} · ${withPrice} USD` : `${base} · ${withPrice} USD`;
}

/** Schedule lines for partnership emails (FR). */
export function hackathonScheduleLinesFr(): string[] {
  return HACKATHON_SCHEDULE_SUMMARY.map(
    (d) =>
      `- ${d.dateFr} - ${d.weekdayFr} ${d.focusFr} (${d.hoursFr.replace(/\s+/g, "")})`,
  );
}

export function hackathonScheduleHtmlRowsFr(mintBg: string, textColor: string): string {
  return HACKATHON_SCHEDULE_SUMMARY.map(
    (d) =>
      `<tr><td style="padding:8px 12px;background:${mintBg};border-radius:10px;font-size:14px;line-height:1.45;color:${textColor};"><strong>${d.dateFr}</strong> - ${d.weekdayFr} ${d.focusFr} (${d.hoursFr})</td></tr>`,
  ).join("\n                <tr><td style=\"height:8px;font-size:0;line-height:0;\">&nbsp;</td></tr>\n                ");
}

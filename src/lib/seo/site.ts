import type { Locale } from "@/i18n/locale";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/app-url";

export const SEO_KEYWORDS = [
  "McBuleli",
  "USDT",
  "crypto wallet Africa",
  "P2P escrow",
  "mobile money",
  "DR Congo",
  "RDC",
  "Kinshasa",
  "Pi Network",
  "AVEC savings",
  "staking USDT",
  "buy USDT Africa",
  "Orange Money",
  "M-Pesa",
  "Airtel Money",
  "fintech Africa",
] as const;

type HomeSeoCopy = {
  title: string;
  description: string;
  ogTitle: string;
  heading: string;
  intro: string;
  bullets: string[];
  regions: string;
};

const HOME_SEO: Record<Locale, HomeSeoCopy> = {
  en: {
    title: "McBuleli - USDT Wallet, P2P & Mobile Money in DR Congo & Africa",
    description:
      "Buy and sell USDT & Pi with mobile money in DR Congo and across Africa. P2P escrow, custodial wallet, fixed-term staking, AVEC group savings, AI trading bots and Didit KYC on mcbuleli.org.",
    ogTitle: "McBuleli - Africa-first crypto wallet & P2P",
    heading: "Built for DR Congo & Africa",
    intro:
      "McBuleli helps you move between crypto and mobile money with escrow-protected P2P, a secure custodial wallet, and savings tools designed for African communities.",
    bullets: [
      "USDT & Pi wallet with deposit, withdraw and history",
      "P2P marketplace with escrow until mobile money is confirmed",
      "Fixed-term staking, AVEC village savings and liquidity pool",
      "AI trading bots, futures, options and verified KYC (Didit)",
      "Human support - available 24/7 for DR Congo and the wider region",
    ],
    regions:
      "Serving users in DR Congo (RDC), East Africa, West Africa and the diaspora - Orange Money, M-Pesa, Airtel Money and bank transfers where supported.",
  },
  fr: {
    title: "McBuleli - Portefeuille USDT, P2P & Mobile money en RDC et Afrique",
    description:
      "Achetez et vendez USDT & Pi avec le mobile money en RDC et en Afrique. Escrow P2P, portefeuille custodial, staking, épargne AVEC, bots IA et KYC Didit sur mcbuleli.org.",
    ogTitle: "McBuleli - Wallet crypto & P2P pour l'Afrique",
    heading: "Conçu pour la RDC & l'Afrique",
    intro:
      "McBuleli facilite les échanges entre crypto et mobile money avec un P2P protégé par escrow, un portefeuille sécurisé et des outils d'épargne adaptés aux communautés africaines.",
    bullets: [
      "Portefeuille USDT & Pi - dépôt, retrait et historique",
      "Marketplace P2P avec escrow jusqu'à confirmation du mobile money",
      "Staking à terme fixe, épargne AVEC et pool de liquidité",
      "Bots IA, futures, options et KYC vérifié (Didit)",
      "Support humain - disponible 24h/24 pour la RDC et la région",
    ],
    regions:
      "Utilisateurs en RDC, Afrique de l'Est, Afrique de l'Ouest et diaspora - Orange Money, M-Pesa, Airtel Money et virements selon disponibilité.",
  },
};

export function homeSeoCopy(locale: Locale): HomeSeoCopy {
  return HOME_SEO[locale];
}

export function organizationJsonLd(locale: Locale) {
  const copy = homeSeoCopy(locale);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${CANONICAL_PRODUCTION_ORIGIN}/#organization`,
        name: "McBuleli",
        url: CANONICAL_PRODUCTION_ORIGIN,
        logo: `${CANONICAL_PRODUCTION_ORIGIN}/brand/logo-512.png`,
        description: copy.description,
        areaServed: [
          { "@type": "Country", name: "Democratic Republic of the Congo" },
          { "@type": "Place", name: "Africa" },
        ],
        sameAs: ["https://x.com/McBuleli"],
      },
      {
        "@type": "WebSite",
        "@id": `${CANONICAL_PRODUCTION_ORIGIN}/#website`,
        url: CANONICAL_PRODUCTION_ORIGIN,
        name: "McBuleli",
        description: copy.description,
        publisher: { "@id": `${CANONICAL_PRODUCTION_ORIGIN}/#organization` },
        inLanguage: ["en", "fr"],
      },
      {
        "@type": "FinancialService",
        "@id": `${CANONICAL_PRODUCTION_ORIGIN}/#service`,
        name: "McBuleli",
        url: CANONICAL_PRODUCTION_ORIGIN,
        description: copy.description,
        areaServed: [
          { "@type": "Country", name: "Democratic Republic of the Congo" },
          { "@type": "Place", name: "Africa" },
        ],
        serviceType: [
          "Cryptocurrency wallet",
          "P2P trading",
          "Mobile money integration",
          "Group savings",
          "Staking",
        ],
      },
    ],
  };
}

export const PUBLIC_SITEMAP_PATHS = [
  "",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/login",
  "/register",
] as const;

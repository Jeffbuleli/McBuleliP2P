import type { MarketingBroadcastCopy } from "@/lib/email/marketing-layout";
import { appBaseUrl } from "@/lib/email/config";

export type MarketingBroadcastKind =
  | "welcome"
  | "staking"
  | "p2p"
  | "wallet_usdt"
  | "avec"
  | "kyc"
  | "security"
  | "reengage"
  | "changelog";

export type MarketingBroadcastDef = {
  kind: MarketingBroadcastKind;
  locale: "en" | "fr";
  /** Suggested broadcast name in Resend dashboard */
  name: string;
  subject: string;
  copy: MarketingBroadcastCopy;
};

function u(path: string, campaign: string): string {
  const base = appBaseUrl().replace(/\/$/, "");
  const sep = path.includes("?") ? "&" : "?";
  return `${base}${path}${sep}utm_source=email&utm_medium=broadcast&utm_campaign=${campaign}`;
}

const EN: Record<MarketingBroadcastKind, Omit<MarketingBroadcastCopy, "ctaHref"> & { ctaPath: string; campaign: string }> = {
  welcome: {
    preheader: "Your crypto wallet for Africa — fund, trade, earn.",
    headline: "Welcome to McBuleli",
    paragraphs: [
      "One app for USDT, Pi, mobile-money P2P, and group savings — built for speed and clarity.",
      "Verify your email, complete KYC when you're ready, and fund your wallet in minutes.",
    ],
    bullets: ["Wallet · P2P escrow · Staking · AVEC groups"],
    ctaLabel: "Open my wallet",
    ctaPath: "/app/wallet",
    campaign: "welcome",
  },
  staking: {
    preheader: "Put idle USDT & Pi to work — clear rates, flexible terms.",
    headline: "Earn on what you hold",
    paragraphs: [
      "Staking is live on McBuleli. Choose a term, see your rate upfront, and track rewards in the app.",
      "No noise — just yield you can understand.",
    ],
    bullets: ["USDT & Pi supported", "Transparent APR", "Manage from Wallet → Earn"],
    ctaLabel: "Start staking",
    ctaPath: "/app/staking",
    campaign: "staking",
  },
  p2p: {
    preheader: "Buy & sell crypto with escrow — mobile money friendly.",
    headline: "P2P that protects both sides",
    paragraphs: [
      "Trade with real people, not guesswork. Funds stay in escrow until the deal is done.",
      "Payment details appear only inside the active order.",
    ],
    bullets: ["Escrow on every trade", "Dispute support", "Mobile money rails"],
    ctaLabel: "Browse P2P",
    ctaPath: "/app/p2p",
    campaign: "p2p",
  },
  wallet_usdt: {
    preheader: "Deposit USDT on TRC20, BEP20 & more — withdraw when you need.",
    headline: "Your USDT hub",
    paragraphs: [
      "Send USDT to your personal deposit address. We match amounts automatically when auto-detect is on.",
      "Withdraw to whitelisted addresses when you're ready to cash out.",
    ],
    bullets: ["Multi-network deposits", "Clear fees", "Security alerts by email"],
    ctaLabel: "Deposit USDT",
    ctaPath: "/app/deposit?asset=USDT",
    campaign: "wallet_usdt",
  },
  avec: {
    preheader: "Save together — governance, loans, and shared goals.",
    headline: "AVEC groups on McBuleli",
    paragraphs: [
      "Create or join a savings circle with rules everyone can see. Contributions, payouts, and votes — in one place.",
      "Built for communities that already trust each other.",
    ],
    bullets: ["Transparent ledger", "Group governance", "Social aid & loans"],
    ctaLabel: "Explore groups",
    ctaPath: "/app/groups",
    campaign: "avec",
  },
  kyc: {
    preheader: "Unlock higher limits — quick verification with Didit.",
    headline: "Verify once, move freely",
    paragraphs: [
      "KYC takes a few minutes and unlocks higher deposit, withdrawal, and P2P limits.",
      "Your data stays on our secure flow — we never ask for passwords by email.",
    ],
    ctaLabel: "Complete KYC",
    ctaPath: "/app/profile",
    campaign: "kyc",
  },
  security: {
    preheader: "Passkeys & 2FA — protect your balance in two taps.",
    headline: "Lock down your account",
    paragraphs: [
      "Add a passkey or authenticator app. Withdrawals and sensitive changes can require a quick step-up check.",
      "McBuleli will never ask for your seed phrase or password by message.",
    ],
    ctaLabel: "Security settings",
    ctaPath: "/app/profile",
    campaign: "security",
  },
  reengage: {
    preheader: "Your wallet is waiting — check balance & latest rates.",
    headline: "Still with us?",
    paragraphs: [
      "Markets move fast. Log in to see your balance, open orders, and staking rewards.",
      "Need help? Reply to this email or message us on WhatsApp.",
    ],
    ctaLabel: "Log in",
    ctaPath: "/login",
    campaign: "reengage",
  },
  changelog: {
    preheader: "What's new on McBuleli — features & fixes.",
    headline: "Product update",
    paragraphs: [
      "We shipped improvements to wallet, P2P, and earn this month. Faster deposits, clearer statuses, and a smoother mobile experience.",
      "Open the app for full details — this email stays short on purpose.",
    ],
    ctaLabel: "See what's new",
    ctaPath: "/app/wallet",
    campaign: "changelog",
  },
};

const FR: Record<MarketingBroadcastKind, Omit<MarketingBroadcastCopy, "ctaHref"> & { ctaPath: string; campaign: string }> = {
  welcome: {
    preheader: "Votre portefeuille crypto pour l'Afrique — déposer, échanger, gagner.",
    headline: "Bienvenue sur McBuleli",
    paragraphs: [
      "Une app pour l'USDT, le Pi, le P2P mobile money et l'épargne de groupe — simple et rapide.",
      "Confirmez votre email, faites le KYC quand vous voulez, et alimentez votre portefeuille en quelques minutes.",
    ],
    bullets: ["Portefeuille · P2P séquestre · Staking · Groupes AVEC"],
    ctaLabel: "Ouvrir mon portefeuille",
    ctaPath: "/app/wallet",
    campaign: "welcome",
  },
  staking: {
    preheader: "Faites travailler vos USDT & Pi — taux clairs, durées flexibles.",
    headline: "Gagnez sur vos avoirs",
    paragraphs: [
      "Le staking est disponible sur McBuleli. Choisissez une durée, voyez le taux dès le départ, suivez les gains dans l'app.",
      "Pas de bruit — du rendement lisible.",
    ],
    bullets: ["USDT & Pi", "APR transparent", "Wallet → Gagner"],
    ctaLabel: "Commencer le staking",
    ctaPath: "/app/staking",
    campaign: "staking",
  },
  p2p: {
    preheader: "Achetez & vendez avec séquestre — compatible mobile money.",
    headline: "Le P2P qui protège les deux parties",
    paragraphs: [
      "Échangez avec de vrais utilisateurs. Les fonds restent sous séquestre jusqu'à la fin du deal.",
      "Les coordonnées de paiement n'apparaissent que dans l'ordre actif.",
    ],
    bullets: ["Séquestre systématique", "Support litiges", "Rails mobile money"],
    ctaLabel: "Voir le P2P",
    ctaPath: "/app/p2p",
    campaign: "p2p",
  },
  wallet_usdt: {
    preheader: "Dépôt USDT TRC20, BEP20… — retrait quand vous voulez.",
    headline: "Votre hub USDT",
    paragraphs: [
      "Envoyez des USDT sur votre adresse personnelle. Montant détecté automatiquement quand l'auto-detect est actif.",
      "Retirez vers des adresses en liste blanche quand vous encaissez.",
    ],
    bullets: ["Multi-réseaux", "Frais affichés", "Alertes sécurité par email"],
    ctaLabel: "Déposer des USDT",
    ctaPath: "/app/deposit?asset=USDT",
    campaign: "wallet_usdt",
  },
  avec: {
    preheader: "Épargnez ensemble — gouvernance, prêts, objectifs communs.",
    headline: "Les groupes AVEC sur McBuleli",
    paragraphs: [
      "Créez ou rejoignez un cercle d'épargne avec des règles visibles par tous. Cotisations, paiements et votes — au même endroit.",
      "Pensé pour les communautés qui se connaissent déjà.",
    ],
    bullets: ["Registre transparent", "Gouvernance", "Aide sociale & prêts"],
    ctaLabel: "Découvrir les groupes",
    ctaPath: "/app/groups",
    campaign: "avec",
  },
  kyc: {
    preheader: "Plafonds plus hauts — vérification rapide Didit.",
    headline: "Vérifiez une fois, agissez librement",
    paragraphs: [
      "Le KYC prend quelques minutes et débloque dépôts, retraits et P2P à plus fort volume.",
      "Vos données restent dans notre flux sécurisé — jamais de mot de passe par email.",
    ],
    ctaLabel: "Compléter le KYC",
    ctaPath: "/app/profile",
    campaign: "kyc",
  },
  security: {
    preheader: "Passkeys & 2FA — protégez votre solde en deux gestes.",
    headline: "Sécurisez votre compte",
    paragraphs: [
      "Ajoutez une passkey ou une app d'authentification. Retraits et changements sensibles = validation rapide.",
      "McBuleli ne demandera jamais votre seed phrase ou mot de passe par message.",
    ],
    ctaLabel: "Paramètres sécurité",
    ctaPath: "/app/profile",
    campaign: "security",
  },
  reengage: {
    preheader: "Votre portefeuille vous attend — solde & taux à jour.",
    headline: "Toujours avec nous ?",
    paragraphs: [
      "Les marchés bougent vite. Reconnectez-vous pour voir votre solde, ordres et récompenses staking.",
      "Une question ? Répondez à cet email ou WhatsApp.",
    ],
    ctaLabel: "Se connecter",
    ctaPath: "/login",
    campaign: "reengage",
  },
  changelog: {
    preheader: "Nouveautés McBuleli — fonctions & correctifs.",
    headline: "Mise à jour produit",
    paragraphs: [
      "Améliorations portefeuille, P2P et earn ce mois-ci. Dépôts plus fluides, statuts plus clairs, meilleure expérience mobile.",
      "Ouvrez l'app pour le détail — cet email reste volontairement court.",
    ],
    ctaLabel: "Voir les nouveautés",
    ctaPath: "/app/wallet",
    campaign: "changelog",
  },
};

const KINDS: MarketingBroadcastKind[] = [
  "welcome",
  "staking",
  "p2p",
  "wallet_usdt",
  "avec",
  "kyc",
  "security",
  "reengage",
  "changelog",
];

function buildDef(
  kind: MarketingBroadcastKind,
  locale: "en" | "fr",
): MarketingBroadcastDef {
  const src = locale === "fr" ? FR[kind] : EN[kind];
  const subject =
    locale === "fr"
      ? `${src.headline} · McBuleli`
      : `${src.headline} · McBuleli`;
  return {
    kind,
    locale,
    name: `McBuleli · ${kind} (${locale.toUpperCase()})`,
    subject,
    copy: {
      preheader: src.preheader,
      headline: src.headline,
      paragraphs: src.paragraphs,
      bullets: src.bullets,
      ctaLabel: src.ctaLabel,
      ctaHref: u(src.ctaPath, src.campaign),
    },
  };
}

export const MC_BULELI_MARKETING_BROADCASTS: MarketingBroadcastDef[] = KINDS.flatMap(
  (kind) => [buildDef(kind, "fr"), buildDef(kind, "en")],
);

export function findMarketingBroadcast(
  kind: MarketingBroadcastKind,
  locale: "en" | "fr",
): MarketingBroadcastDef | undefined {
  return MC_BULELI_MARKETING_BROADCASTS.find(
    (d) => d.kind === kind && d.locale === locale,
  );
}

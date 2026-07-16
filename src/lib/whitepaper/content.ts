import type { Locale } from "@/i18n/locale";

export type WhitepaperBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "callout"; text: string }
  | { type: "draft"; text: string }
  | { type: "sign"; text: string };

export type WhitepaperSection = {
  id: string;
  title: string;
  blocks: WhitepaperBlock[];
};

export type WhitepaperDoc = {
  version: string;
  revised: string;
  tagline: string;
  disclaimer: string;
  tocLabel: string;
  sections: WhitepaperSection[];
};

const en: WhitepaperDoc = {
  version: "1.1",
  revised: "July 2026",
  tagline: "Building Africa's Intelligent Financial Super App",
  tocLabel: "Contents",
  disclaimer:
    "McB is a utility token. This document is not financial advice, not an offer to sell securities, and not an ICO. No price, yield, or listing promise is made. Figures marked \"proposed\" or \"draft\" may change.",
  sections: [
    {
      id: "founder",
      title: "Letter from the founder",
      blocks: [
        {
          type: "p",
          text: "McBuleli exists because too many people in Africa still juggle fragmented mobile money, low financial inclusion, and opaque paths into digital finance - while education and trust remain scarce.",
        },
        {
          type: "p",
          text: "We are building a practical super app: custody wallet, P2P with escrow, group savings (AVEC), learning (Academy), community, trading tools, and a utility layer (Buleli Points → McB) that rewards real usage - not speculation.",
        },
        {
          type: "p",
          text: "This Constitution Lite is our north star. Future product decisions - including new services such as credit or insurance if they ever come - must stay compatible with these principles.",
        },
        {
          type: "sign",
          text: "Jeff Buleli - CEO",
        },
      ],
    },
    {
      id: "summary",
      title: "1. Executive summary",
      blocks: [
        {
          type: "p",
          text: "The problem: fragmented payments, weak inclusion, hard access to learning and fair markets, and informal group finance still run on paper and chats.",
        },
        {
          type: "p",
          text: "The solution (live on mcbuleli.org): USDT/PI wallet, mobile-money P2P with escrow, staking, AVEC, Academy, Community Hub (utility tags, quality score, BP boost & tips), AI trading tools, KYC (Didit), McBuleli AI (product-scoped), Buleli Points, McB claim path with pool tracking, and Builders Program tiers paid in McB.",
        },
        {
          type: "p",
          text: "The vision: an intelligent financial super app for Africa - product-first, compliance-aware, utility-token only.",
        },
      ],
    },
    {
      id: "principles",
      title: "2. Founding principles (the Constitution)",
      blocks: [
        {
          type: "p",
          text: "Any future feature should pass this checklist:",
        },
        {
          type: "ol",
          items: [
            "Africa-first - design for mobile money, low bandwidth, and local realities (starting with DR Congo).",
            "Utility only - McB never promises price appreciation or token yield.",
            "No ICO - issuance is tied to real use (BP → McB claims), not a speculative public sale.",
            "KYC for sensitive crypto flows - withdrawals and McB claims require verification.",
            "Financial architecture order - Capital → Liquidity → Community → Token → Governance → Compliance.",
            "Transparency - published numbers match code, or are labeled draft / proposed.",
            "Economic sustainability - discounts and Builder perks must remain viable for McBuleli.",
            "Fund safety - escrow, auditable ledgers, and operational security come before growth hacks.",
          ],
        },
        {
          type: "callout",
          text: "Governance question for every roadmap item: \"Is this compatible with the McBuleli Constitution?\"",
        },
      ],
    },
    {
      id: "ecosystem",
      title: "3. McBuleli ecosystem",
      blocks: [
        {
          type: "p",
          text: "Live today:",
        },
        {
          type: "ul",
          items: [
            "Wallet - USDT, PI, fiat rails where enabled",
            "P2P - escrow marketplace with mobile money settlement",
            "Staking - fixed USDT/PI terms",
            "AVEC - group savings cycles",
            "Academy - cohorts, live sessions, quizzes, credentials",
            "Community - feed, blogs, Q&A, signals (educational), utility tags, quality score, creator profiles",
            "Community BP sinks - post boost (80 BP / 24h), creator tips (20 / 50 / 100 BP)",
            "Trade - bots, futures, options (product tools; not investment advice)",
            "McBuleli AI - in-app assistant scoped to McBuleli products only",
            "Buleli Points (BP) - off-chain reputation & perks (monthly cap 4,000 BP)",
            "McB - BEP-20 on BNB Smart Chain; KYC claim path BP → McB with claim-pool counters (public BSC launch story: v1.2)",
            "Builders Program (M1) - Bronze→Platinum badges paid in McB; page /app/community/builders",
          ],
        },
        {
          type: "draft",
          text: "Planned for Constitution v1.2 (McB launch on BSC): public McB brand ads, fee payment in McB with partial burn, deeper DEX liquidity, claim ops at scale. Builder perk tables and ambassador tracks after economic + legal review.",
        },
      ],
    },
    {
      id: "architecture",
      title: "4. Financial architecture",
      blocks: [
        {
          type: "p",
          text: "We grow the company in this order - not the other way around:",
        },
        {
          type: "ol",
          items: [
            "Capital - build and fund the platform responsibly",
            "Liquidity - wallets, markets, escrow, savings products that work",
            "Community - users who learn, trade fairly, and help each other (Social Utility Graph)",
            "Token - McB as utility that follows real activity (via BP claims + McB sinks)",
            "Governance - clear roles; Builder ≠ Ambassador ≠ Official Representative",
            "Compliance - KYC/AML posture, audits, data protection",
          ],
        },
      ],
    },
    {
      id: "economy",
      title: "5. McBuleli economy (BP · McB · stable value)",
      blocks: [
        {
          type: "ul",
          items: [
            "Buleli Points (BP) - off-chain engagement: earn from verified actions (KYC, Academy, Community, P2P, staking, etc.), monthly earn cap 4,000 BP, daily anti-farming caps on community actions.",
            "Spend BP (live) - P2P fee -15% (80 BP / 30d), bot renewal -10% (200 BP / 14d), community post boost 80 BP / 24h, creator tips 20 / 50 / 100 BP.",
            "McB (BEP-20, BSC) - utility token; claim ratio 100 BP = 1 McB for KYC-approved users when claims are enabled.",
            "Claim pool - community emission tracked (default 40% of proposed max supply); admin/user stock bars show minted / pending / remaining.",
            "USDT / PI - stable value for payments, P2P, staking, trading margin - separate from BP/McB speculation narratives.",
          ],
        },
        {
          type: "p",
          text: "Proposed max supply: 100,000,000 McB. Proposed allocation (v1 - may be adjusted before full claim scale-up):",
        },
        {
          type: "ul",
          items: [
            "40% - emission via BP → McB claims (utility-linked; claim pool)",
            "35% - ecosystem reserve (LP, rewards, ops treasury)",
            "15% - team / ops (target 4-year vesting)",
            "10% - partnerships",
          ],
        },
        {
          type: "draft",
          text: "Constitution v1.2 (McB on BSC): pay selected platform fees in McB with a partial burn; optional McB staking; light votes on parameters; public brand ads spent in McB.",
        },
        {
          type: "callout",
          text: "Game credits labeled \"McB\" inside the educational game are a separate silo and are not the on-chain utility token.",
        },
      ],
    },
    {
      id: "builders",
      title: "6. McBuleli Builders Program",
      blocks: [
        {
          type: "p",
          text: "In v1.1: purchase flow, admin review, badge on profile, and /app/community/builders. Slogan: Build. Grow. Belong. Published fee-discount / Academy Premium perk tables come with later reviews - not in this version.",
        },
        {
          type: "p",
          text: "MBP is a community status program. It complements staking and McB; it does not replace them. Builder tiers are paid in McB (not BP) - claim from the community pool or buy on DEX. Holding McB alone does not grant Ambassador or Official Representative roles.",
        },
        {
          type: "ul",
          items: [
            "Levels (config live): Bronze 100 · Silver 300 · Gold 800 · Diamond 2,000 · Platinum 5,000 McB",
            "Badge validity: 24 months - then renew, upgrade, or exit; perks expire with the badge",
            "BP = free engagement (likes, posts, tips, boost, light fee perks); McB = paid Builder status",
            "Kept after expiry: history, reputation, McB already received",
            "Roles: Builder (McB-paid badge) ≠ Ambassador (application) ≠ Official Representative (appointed by McBuleli)",
            "Investment or high badge never guarantees an official company role",
          ],
        },
        {
          type: "draft",
          text: "For v1.2+: burn vs lock on purchase, soft activity gates, ambassador charter, and published perk economics after finance + legal review.",
        },
      ],
    },
    {
      id: "security",
      title: "7. Security & compliance",
      blocks: [
        {
          type: "ul",
          items: [
            "KYC (Didit) gated where required for crypto risk features; identity-correction ops path for approved name fixes",
            "P2P escrow until settlement rules are met; dispute flows available",
            "Custodial wallet ledger with operational controls; continuous hardening",
            "Data protection aligned with our Privacy policy",
            "Utility-token policy - no price promises in product or marketing",
            "McBuleli AI - refuses politics and off-product topics; redirects to McBuleli services",
          ],
        },
      ],
    },
    {
      id: "roadmap",
      title: "8. Roadmap",
      blocks: [
        {
          type: "p",
          text: "v1.1 (this document) - what is done: Constitution Lite public page; Community Horizon A (utility tags, quality score, post boost, creator stats); BP tips; McB claim-pool counters; Builders Program M1 (McB-paid tiers Bronze→Platinum); McBuleli AI scoped to product; full wallet / P2P / staking / AVEC / Academy / trade stack.",
        },
        {
          type: "p",
          text: "v1.2 - McB launch on BSC: public claim ops at scale, DEX liquidity, public McB brand ads, and the on-chain utility story for users and partners.",
        },
        {
          type: "p",
          text: "After v1.2: McB fee payment + burn, optional staking/governance parameters, deeper BP earn/spend (AVEC, referral, withdraw), Builder perk tables, broader African rails - only where Constitution-compatible.",
        },
      ],
    },
    {
      id: "faq",
      title: "9. FAQ",
      blocks: [
        {
          type: "ul",
          items: [
            "Is McB an investment? No. It is a utility token for ecosystem use. No yield or price promise.",
            "What are Buleli Points? Off-chain utility rewards for verified activity; not cash. Cap: 4,000 BP / month.",
            "How do I get McB? KYC + convert BP at 100 BP = 1 McB to a BEP-20 wallet when claims are open (subject to claim-pool stock). Public BSC launch details: Constitution v1.2.",
            "Is there an ICO? No.",
            "What is the Builders Program? Status track in v1.1 (Build. Grow. Belong.) - tiers paid in McB (100-5,000), not BP. Extra perks beyond the badge: later versions after review.",
            "Can I tip or boost in Community? Yes - tips 20/50/100 BP; post boost 80 BP for 24h.",
            "Where is technical tokenomics detail? In repo docs (mcb-tokenomics-reference, builders-program-spec, social-utility-*) - v1.1 states what is done; v1.2 covers the BSC launch.",
          ],
        },
      ],
    },
    {
      id: "conclusion",
      title: "10. Conclusion",
      blocks: [
        {
          type: "p",
          text: "McBuleli's edge is shipping real tools for African users first - then layering an honest utility economy. Constitution Lite v1.1 defines what is done today. v1.2 will document the McB launch on BNB Smart Chain.",
        },
        {
          type: "p",
          text: "Build with us. Grow with discipline. Belong to a community that puts utility before hype.",
        },
      ],
    },
  ],
};

const fr: WhitepaperDoc = {
  version: "1.1",
  revised: "juillet 2026",
  tagline: "Building Africa's Intelligent Financial Super App",
  tocLabel: "Sommaire",
  disclaimer:
    "McB est un jeton utilitaire. Ce document n'est pas un conseil financier, pas une offre de titres, et pas une ICO. Aucune promesse de prix, de rendement ou de listing n'est faite. Les chiffres marqués « proposition » ou « draft » peuvent évoluer.",
  sections: [
    {
      id: "founder",
      title: "Lettre du fondateur",
      blocks: [
        {
          type: "p",
          text: "McBuleli existe parce que trop de personnes en Afrique jonglent encore avec un mobile money fragmenté, une inclusion financière trop faible, et des chemins opaques vers la finance numérique - tandis que l'éducation et la confiance restent rares.",
        },
        {
          type: "p",
          text: "Nous construisons une super app concrète : portefeuille custodial, P2P avec escrow, épargne de groupe (AVEC), formation (Academy), communauté, outils de trading, et une couche utilitaire (Buleli Points → McB) qui récompense l'usage réel - pas la spéculation.",
        },
        {
          type: "p",
          text: "Cette Constitution Lite est notre boussole. Les décisions produit futures - y compris banque, crédit ou assurance si un jour elles arrivent - devront rester compatibles avec ces principes.",
        },
        {
          type: "sign",
          text: "Jeff Buleli - CEO",
        },
      ],
    },
    {
      id: "summary",
      title: "1. Executive summary",
      blocks: [
        {
          type: "p",
          text: "Le problème : paiements fragmentés, faible inclusion, accès difficile à l'apprentissage et à des marchés équitables, AVEC encore trop souvent manuelles.",
        },
        {
          type: "p",
          text: "La solution (live sur mcbuleli.org) : wallet USDT/PI, P2P mobile money avec escrow, staking, AVEC, Academy, Community Hub (tags utilité, score qualité, boost & tips BP), outils de trading IA, KYC (Didit), McBuleli AI (scope produit), Buleli Points, claims McB avec suivi du pool, et Builders Program (paliers payés en McB).",
        },
        {
          type: "p",
          text: "La vision : une super app financière intelligente pour l'Afrique - produit d'abord, conformité en tête, jeton utilitaire uniquement.",
        },
      ],
    },
    {
      id: "principles",
      title: "2. Principes fondateurs (la Constitution)",
      blocks: [
        {
          type: "p",
          text: "Toute fonctionnalité future doit passer cette checklist :",
        },
        {
          type: "ol",
          items: [
            "Afrique d'abord - mobile money, faible bande passante, réalités locales (à commencer par la RDC).",
            "Utility only - McB ne promet jamais de hausse de prix ni de rendement du jeton.",
            "Pas d'ICO - l'émission est liée à l'usage (BP → McB), pas à une vente spéculative.",
            "KYC pour les flux crypto sensibles - retraits et claims McB.",
            "Ordre d'architecture financière - Capital → Liquidité → Communauté → Token → Gouvernance → Conformité.",
            "Transparence - un chiffre publié correspond au code, ou est marqué draft / proposition.",
            "Soutenabilité - remises et avantages Builders doivent rester viables pour McBuleli.",
            "Sécurité des fonds - escrow, ledgers auditables, hardening ops avant les coups marketing.",
          ],
        },
        {
          type: "callout",
          text: "Question de gouvernance pour chaque item roadmap : « Est-ce conforme à la Constitution McBuleli ? »",
        },
      ],
    },
    {
      id: "ecosystem",
      title: "3. Écosystème McBuleli",
      blocks: [
        {
          type: "p",
          text: "Live aujourd'hui :",
        },
        {
          type: "ul",
          items: [
            "Wallet - USDT, PI, rails fiat selon activation",
            "P2P - marketplace escrow + règlement mobile money",
            "Staking - termes fixes USDT/PI",
            "AVEC - cycles d'épargne collective",
            "Academy - cohortes, lives, quiz, badges",
            "Community - fil, blogs, Q&R, signaux (éducatifs), tags utilité, score qualité, profils créateurs",
            "Sinks BP community - boost de post (80 BP / 24h), tips créateur (20 / 50 / 100 BP)",
            "Trade - bots, futures, options (outils produit ; pas de conseil d'investissement)",
            "McBuleli AI - assistant in-app limité aux produits McBuleli",
            "Buleli Points (BP) - réputation & avantages off-chain (plafond mensuel 4 000 BP)",
            "McB - BEP-20 sur BNB Smart Chain ; chemin de claim KYC BP → McB avec compteurs de pool (récit lancement BSC public : v1.2)",
            "Builders Program (M1) - badges Bronze→Platinum payés en McB ; page /app/community/builders",
          ],
        },
        {
          type: "draft",
          text: "Prévu pour la Constitution v1.2 (lancement McB sur BSC) : ads marques en McB, paiement de frais en McB avec brûlage partiel, liquidité DEX plus profonde, claims à l'échelle. Tables de perks Builders et filière ambassadeurs après revue éco + juridique.",
        },
      ],
    },
    {
      id: "architecture",
      title: "4. Architecture financière",
      blocks: [
        {
          type: "p",
          text: "Nous faisons croître l'entreprise dans cet ordre - pas l'inverse :",
        },
        {
          type: "ol",
          items: [
            "Capital - construire et financer la plateforme de façon responsable",
            "Liquidité - wallets, marchés, escrow, épargne qui fonctionnent",
            "Communauté - utilisateurs qui apprennent, échangent équitablement, s'entraident (Social Utility Graph)",
            "Token - McB comme utilité qui suit l'activité réelle (claims BP + sinks McB)",
            "Gouvernance - rôles clairs ; Builder ≠ Ambassadeur ≠ Représentant officiel",
            "Conformité - posture KYC/AML, audits, protection des données",
          ],
        },
      ],
    },
    {
      id: "economy",
      title: "5. Économie McBuleli (BP · McB · valeur stable)",
      blocks: [
        {
          type: "ul",
          items: [
            "Buleli Points (BP) - engagement off-chain : gains liés à des actions vérifiées (KYC, Academy, Community, P2P, staking, etc.), plafond mensuel 4 000 BP, plafonds journaliers anti-farming en communauté.",
            "Dépenser des BP (live) - frais P2P -15 % (80 BP / 30 j), renouvellement bot -10 % (200 BP / 14 j), boost de post 80 BP / 24h, tips créateur 20 / 50 / 100 BP.",
            "McB (BEP-20, BSC) - jeton utilitaire ; ratio de claim 100 BP = 1 McB pour utilisateurs KYC quand les claims sont activés.",
            "Pool de claim - émission communautaire suivie (défaut 40 % de la supply max proposée) ; barres admin/utilisateur : mintés / en attente / restantes.",
            "USDT / PI - valeur stable pour paiements, P2P, staking, marge trading - séparée des narratifs spéculatifs BP/McB.",
          ],
        },
        {
          type: "p",
          text: "Supply max proposée : 100 000 000 McB. Allocation proposée (v1 - peut être ajustée avant montée en charge des claims) :",
        },
        {
          type: "ul",
          items: [
            "40 % - émission via claims BP → McB (liée à l'utilité ; pool de claim)",
            "35 % - réserve écosystème (LP, rewards, trésorerie ops)",
            "15 % - équipe / ops (cible vesting 4 ans)",
            "10 % - partenariats",
          ],
        },
        {
          type: "draft",
          text: "Constitution v1.2 (McB sur BSC) : payer certains frais plateforme en McB avec brûlage partiel ; staking McB optionnel ; votes légers ; ads marques en McB.",
        },
        {
          type: "callout",
          text: "Les crédits « McB » du jeu éducatif sont un silo séparé et ne sont pas le jeton utilitaire on-chain.",
        },
      ],
    },
    {
      id: "builders",
      title: "6. McBuleli Builders Program",
      blocks: [
        {
          type: "p",
          text: "En v1.1 : achat, revue admin, badge profil et /app/community/builders. Slogan : Build. Grow. Belong. Les tables de perks (frais / Academy Premium) viendront après revue - pas dans cette version.",
        },
        {
          type: "p",
          text: "Le MBP est un programme de statut communautaire. Il complète le staking et le McB ; il ne les remplace pas. Les paliers Builder se paient en McB (pas en BP) - claim depuis le pool ou achat DEX. Détenir du McB n'accorde pas automatiquement un rôle d'Ambassadeur ou de Représentant officiel.",
        },
        {
          type: "ul",
          items: [
            "Niveaux (config live) : Bronze 100 · Silver 300 · Gold 800 · Diamond 2 000 · Platinum 5 000 McB",
            "Validité du badge : 24 mois - puis renouvellement, upgrade, ou sortie ; les avantages expirent avec le badge",
            "BP = engagement gratuit (likes, posts, tips, boost, perks légers) ; McB = statut Builder payant",
            "Conservé après expiration : historique, réputation, McB déjà reçus",
            "Rôles : Builder (badge payé en McB) ≠ Ambassadeur (candidature) ≠ Représentant officiel (nommé par McBuleli)",
            "Un investissement ou un badge élevé ne garantit jamais un rôle officiel",
          ],
        },
        {
          type: "draft",
          text: "Pour v1.2+ : burn vs lock à l'achat, soft gates d'activité, charte ambassadeurs, et économie des perks après revue finance + juridique.",
        },
      ],
    },
    {
      id: "security",
      title: "7. Sécurité & conformité",
      blocks: [
        {
          type: "ul",
          items: [
            "KYC (Didit) là où le risque crypto l'exige ; correction d'identité via OPS pour les noms approuvés",
            "Escrow P2P jusqu'au règlement ; litiges possibles",
            "Ledger wallet custodial avec contrôles ops ; hardening continu",
            "Protection des données selon notre politique de confidentialité",
            "Politique utility token - aucune promesse de prix dans le produit ou le marketing",
            "McBuleli AI - refuse politique et hors-produit ; redirige vers les services McBuleli",
          ],
        },
      ],
    },
    {
      id: "roadmap",
      title: "8. Roadmap",
      blocks: [
        {
          type: "p",
          text: "v1.1 (ce document) - ce qui est fait : Constitution Lite publique ; Community Horizon A (tags utilité, score qualité, boost de post, stats créateur) ; tips BP ; compteurs pool claim McB ; Builders Program M1 (paliers McB Bronze→Platinum) ; McBuleli AI limité au produit ; stack wallet / P2P / staking / AVEC / Academy / trade.",
        },
        {
          type: "p",
          text: "v1.2 - lancement McB sur BSC : claims publics à l'échelle, liquidité DEX, ads marques en McB, et le récit utilitaire on-chain pour utilisateurs et partenaires.",
        },
        {
          type: "p",
          text: "Après v1.2 : frais en McB + burn, staking/gouvernance de paramètres optionnels, earn/spend BP plus profond (AVEC, parrainage, retraits), tables de perks Builders, rails africains élargis - seulement si conforme à la Constitution.",
        },
      ],
    },
    {
      id: "faq",
      title: "9. FAQ",
      blocks: [
        {
          type: "ul",
          items: [
            "McB est-il un investissement ? Non. C'est un jeton utilitaire. Pas de rendement ni de promesse de prix.",
            "Que sont les Buleli Points ? Des récompenses utilitaires off-chain pour l'activité vérifiée ; pas de l'argent liquide. Plafond : 4 000 BP / mois.",
            "Comment obtenir du McB ? KYC + conversion BP au ratio 100 BP = 1 McB vers un wallet BEP-20 quand les claims sont ouverts (sous réserve du stock du pool). Détail du lancement BSC : Constitution v1.2.",
            "Y a-t-il une ICO ? Non.",
            "Qu'est-ce que le Builders Program ? Piste de statut en v1.1 (Build. Grow. Belong.) - paliers payés en McB (100-5 000), pas en BP. Perks au-delà du badge : versions suivantes après revue.",
            "Puis-je tipper ou booster en Community ? Oui - tips 20/50/100 BP ; boost de post 80 BP pour 24h.",
            "Où est le détail technique tokenomics ? Dans les docs du repo (mcb-tokenomics-reference, builders-program-spec, social-utility-*) - la v1.1 dit ce qui est fait ; la v1.2 couvrira le lancement BSC.",
          ],
        },
      ],
    },
    {
      id: "conclusion",
      title: "10. Conclusion",
      blocks: [
        {
          type: "p",
          text: "La force de McBuleli, c'est de livrer d'abord des outils réels pour les utilisateurs africains - puis une économie utilitaire honnête. La Constitution Lite v1.1 définit ce qui est fait aujourd'hui. La v1.2 documentera le lancement McB sur BNB Smart Chain.",
        },
        {
          type: "p",
          text: "Build with us. Grow with discipline. Belong to a community that puts utility before hype.",
        },
      ],
    },
  ],
};

export function getWhitepaper(locale: Locale): WhitepaperDoc {
  return locale === "fr" ? fr : en;
}

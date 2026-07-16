import type { Locale } from "@/i18n/locale";

export type WhitepaperBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "callout"; text: string }
  | { type: "draft"; text: string };

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
  version: "1.0",
  revised: "July 2026",
  tagline: "Building Africa's Intelligent Financial Super App",
  tocLabel: "Contents",
  disclaimer:
    "McB is a utility token. This document is not financial advice, not an offer to sell securities, and not an ICO. No price, yield, or listing promise is made. Figures marked “proposed” or “draft” may change.",
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
          text: "The solution (live today): McBuleli on mcbuleli.org - USDT/PI wallet, mobile-money P2P with escrow, staking, AVEC groups, Academy, Community Hub, AI trading bots and futures/options tools, KYC, and Buleli Points with an optional on-chain McB claim path.",
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
          text: "Governance question for every roadmap item: “Is this compatible with the McBuleli Constitution?”",
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
            "Community - feed, blogs, Q&A, signals (educational), Buleli Points",
            "Trade - bots, futures, options (product tools; not investment advice)",
            "Buleli Points (BP) - off-chain reputation & perks",
            "McB - BEP-20 utility token on BNB Smart Chain (claim path KYC-gated)",
          ],
        },
        {
          type: "draft",
          text: "In construction / roadmap: expanded Mobile Money rails, Builders Program productization, fee payment in McB, McB staking, light parameter governance, deeper DEX liquidity.",
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
            "Community - users who learn, trade fairly, and help each other",
            "Token - McB as utility that follows real activity (via BP)",
            "Governance - clear roles; community voice over time, without fake “buy power = official title”",
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
            "Buleli Points (BP) - off-chain engagement layer: earn from verified actions (KYC, Academy, Community, P2P, staking, etc.), monthly earn cap 4,000 BP, daily anti-farming caps on community actions.",
            "Spend BP - e.g. P2P fee −15% (80 BP / 30d), bot renewal −10% (200 BP / 14d); more sinks on the roadmap.",
            "McB (BEP-20, BSC) - utility token; claim ratio 100 BP = 1 McB for KYC-approved users when claims are enabled.",
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
            "40% - emission via BP → McB claims (utility-linked)",
            "35% - ecosystem reserve (LP, rewards, ops treasury)",
            "15% - team / ops (target 4-year vesting)",
            "10% - partnerships",
          ],
        },
        {
          type: "draft",
          text: "Longer-term (roadmap): pay selected platform fees in McB with a partial burn; optional McB staking; light votes on parameters. Not live yet.",
        },
        {
          type: "callout",
          text: "Game credits labeled “McB” inside the educational game are a separate silo and are not the on-chain utility token.",
        },
      ],
    },
    {
      id: "builders",
      title: "6. McBuleli Builders Program (draft)",
      blocks: [
        {
          type: "draft",
          text: "Draft program - not launched as a product with thresholds yet. Slogan: Build. Grow. Belong.",
        },
        {
          type: "p",
          text: "MBP is a community engagement program. It complements staking and McB; it does not replace them. Builder tiers are designed to be paid in McB (not BP) - claim or buy on DEX. Holding McB alone does not grant Ambassador or Official Representative roles.",
        },
        {
          type: "ul",
          items: [
            "Levels (named): Bronze · Silver · Gold · Diamond · Platinum - McB prices TBD",
            "Badge validity: 24 months - then renew, change level, or exit; perks expire with the badge",
            "BP = free engagement (likes, posts, light perks); McB = nobility / paid Builder status",
            "Kept after expiry: history, reputation, McB already received",
            "Roles: Builder (McB-paid badge) ≠ Ambassador (application) ≠ Official Representative (appointed by McBuleli)",
            "Investment or high badge never guarantees an official company role",
          ],
        },
        {
          type: "p",
          text: "Perks (fee discounts, priority support, early access, Academy Premium, events) will only be published when economically sustainable and legally reviewed.",
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
            "KYC (Didit) gated where required for crypto risk features",
            "P2P escrow until settlement rules are met; dispute flows available",
            "Custodial wallet ledger with operational controls; continuous hardening",
            "Data protection aligned with our Privacy policy",
            "Utility-token policy - no price promises in product or marketing",
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
          text: "Short term - deepen BP sinks, fix remaining earn gaps, pilot McB claims with treasury controls, ship Constitution v1.0 publicly.",
        },
        {
          type: "p",
          text: "Medium term - more BP earn/spend across AVEC/referral/withdraw, modest DEX liquidity, claim ops maturity, Builders Program specs → product after legal review.",
        },
        {
          type: "p",
          text: "Long term - McB fee payment + burn mechanics, optional staking/governance parameters, broader African rails; explore adjacent regulated services only if Constitution-compatible.",
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
            "What are Buleli Points? Off-chain utility rewards for verified activity; not cash.",
            "How do I get McB? When claims are enabled: KYC + convert BP at 100 BP = 1 McB to a BEP-20 wallet.",
            "Is there an ICO? No.",
            "What is the Builders Program? A draft community track (Build. Grow. Belong.) - tiers paid in McB (prices TBD), not BP.",
            "Where is the technical tokenomics detail? Maintained internally and reflected here as it ships to production.",
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
          text: "McBuleli’s edge is shipping real tools for African users first - then layering a honest utility economy. This Constitution Lite (v1.0) is the public reference we will revisit as the product earns the next version.",
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
  version: "1.0",
  revised: "juillet 2026",
  tagline: "Building Africa's Intelligent Financial Super App",
  tocLabel: "Sommaire",
  disclaimer:
    "McB est un jeton utilitaire. Ce document n’est pas un conseil financier, pas une offre de titres, et pas une ICO. Aucune promesse de prix, de rendement ou de listing n’est faite. Les chiffres marqués « proposition » ou « draft » peuvent évoluer.",
  sections: [
    {
      id: "founder",
      title: "Lettre du fondateur",
      blocks: [
        {
          type: "p",
          text: "McBuleli existe parce que trop de personnes en Afrique jonglent encore avec un mobile money fragmenté, une inclusion financière trop faible, et des chemins opaques vers la finance numérique - tandis que l’éducation et la confiance restent rares.",
        },
        {
          type: "p",
          text: "Nous construisons une super app concrète : portefeuille custodial, P2P avec escrow, épargne de groupe (AVEC), formation (Academy), communauté, outils de trading, et une couche utilitaire (Buleli Points → McB) qui récompense l’usage réel - pas la spéculation.",
        },
        {
          type: "p",
          text: "Cette Constitution Lite est notre boussole. Les décisions produit futures - y compris banque, crédit ou assurance si un jour elles arrivent - devront rester compatibles avec ces principes.",
        },
      ],
    },
    {
      id: "summary",
      title: "1. Executive summary",
      blocks: [
        {
          type: "p",
          text: "Le problème : paiements fragmentés, faible inclusion, accès difficile à l’apprentissage et à des marchés équitables, AVEC encore trop souvent manuelles.",
        },
        {
          type: "p",
          text: "La solution (déjà live) : McBuleli sur mcbuleli.org - wallet USDT/PI, P2P mobile money avec escrow, staking, groupes AVEC, Academy, Community Hub, bots IA et outils futures/options, KYC, et Buleli Points avec un chemin de claim McB on-chain.",
        },
        {
          type: "p",
          text: "La vision : une super app financière intelligente pour l’Afrique - produit d’abord, conformité en tête, jeton utilitaire uniquement.",
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
            "Afrique d’abord - mobile money, faible bande passante, réalités locales (à commencer par la RDC).",
            "Utility only - McB ne promet jamais de hausse de prix ni de rendement du jeton.",
            "Pas d’ICO - l’émission est liée à l’usage (BP → McB), pas à une vente spéculative.",
            "KYC pour les flux crypto sensibles - retraits et claims McB.",
            "Ordre d’architecture financière - Capital → Liquidité → Communauté → Token → Gouvernance → Conformité.",
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
          text: "Live aujourd’hui :",
        },
        {
          type: "ul",
          items: [
            "Wallet - USDT, PI, rails fiat selon activation",
            "P2P - marketplace escrow + règlement mobile money",
            "Staking - termes fixes USDT/PI",
            "AVEC - cycles d’épargne collective",
            "Academy - cohortes, lives, quiz, badges",
            "Community - fil, blogs, Q&R, signaux (éducatifs), Buleli Points",
            "Trade - bots, futures, options (outils produit ; pas de conseil d’investissement)",
            "Buleli Points (BP) - réputation & avantages off-chain",
            "McB - jeton utilitaire BEP-20 sur BNB Smart Chain (claim KYC)",
          ],
        },
        {
          type: "draft",
          text: "En construction / roadmap : rails Mobile Money étendus, productisation du Builders Program, paiement de frais en McB, staking McB, gouvernance légère des paramètres, liquidité DEX plus profonde.",
        },
      ],
    },
    {
      id: "architecture",
      title: "4. Architecture financière",
      blocks: [
        {
          type: "p",
          text: "Nous faisons croître l’entreprise dans cet ordre - pas l’inverse :",
        },
        {
          type: "ol",
          items: [
            "Capital - construire et financer la plateforme de façon responsable",
            "Liquidité - wallets, marchés, escrow, épargne qui fonctionnent",
            "Communauté - utilisateurs qui apprennent, échangent équitablement, s’entraident",
            "Token - McB comme utilité qui suit l’activité réelle (via BP)",
            "Gouvernance - rôles clairs ; voix communautaire dans le temps, sans « acheter = titre officiel »",
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
            "Buleli Points (BP) - couche d’engagement off-chain : gains liés à des actions vérifiées (KYC, Academy, Community, P2P, staking, etc.), plafond mensuel 4 000 BP, plafonds journaliers anti-farming en communauté.",
            "Dépenser des BP - ex. frais P2P −15 % (80 BP / 30 j), renouvellement bot −10 % (200 BP / 14 j) ; d’autres sinks en roadmap.",
            "McB (BEP-20, BSC) - jeton utilitaire ; ratio de claim 100 BP = 1 McB pour utilisateurs KYC quand les claims sont activés.",
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
            "40 % - émission via claims BP → McB (liée à l’utilité)",
            "35 % - réserve écosystème (LP, rewards, trésorerie ops)",
            "15 % - équipe / ops (cible vesting 4 ans)",
            "10 % - partenariats",
          ],
        },
        {
          type: "draft",
          text: "Plus long terme (roadmap) : payer certains frais plateforme en McB avec brûlage partiel ; staking McB optionnel ; votes légers sur paramètres. Pas encore live.",
        },
        {
          type: "callout",
          text: "Les crédits « McB » du jeu éducatif sont un silo séparé et ne sont pas le jeton utilitaire on-chain.",
        },
      ],
    },
    {
      id: "builders",
      title: "6. McBuleli Builders Program (draft)",
      blocks: [
        {
          type: "draft",
          text: "Programme en draft - pas encore lancé produit avec seuils. Slogan : Build. Grow. Belong.",
        },
        {
          type: "p",
          text: "Le MBP est un programme d’engagement communautaire. Il complète le staking et le McB ; il ne les remplace pas. Les paliers Builder sont conçus pour être payés en McB (pas en BP) - claim ou achat DEX. Détenir du McB n’accorde pas automatiquement un rôle d’Ambassadeur ou de Représentant officiel.",
        },
        {
          type: "ul",
          items: [
            "Niveaux (noms) : Bronze · Silver · Gold · Diamond · Platinum - prix McB à définir",
            "Validité du badge : 24 mois - puis renouvellement, changement de niveau, ou sortie ; les avantages expirent avec le badge",
            "BP = engagement gratuit (likes, posts, perks légers) ; McB = noblesse / statut Builder payant",
            "Conservé après expiration : historique, réputation, McB déjà reçus",
            "Rôles : Builder (badge payé en McB) ≠ Ambassadeur (candidature) ≠ Représentant officiel (nommé par McBuleli)",
            "Un investissement ou un badge élevé ne garantit jamais un rôle officiel",
          ],
        },
        {
          type: "p",
          text: "Les avantages (réductions de frais, support prioritaire, early access, Academy Premium, événements) ne seront publiés chiffrés qu’une fois économiquement soutenables et revus juridiquement.",
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
            "KYC (Didit) là où le risque crypto l’exige",
            "Escrow P2P jusqu’au règlement ; litiges possibles",
            "Ledger wallet custodial avec contrôles ops ; hardening continu",
            "Protection des données selon notre politique de confidentialité",
            "Politique utility token - aucune promesse de prix dans le produit ou le marketing",
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
          text: "Court terme - renforcer les sinks BP, combler les trous d’earn restants, piloter les claims McB avec contrôles trésorerie, publier la Constitution v1.0.",
        },
        {
          type: "p",
          text: "Moyen terme - plus d’earn/spend BP (AVEC, parrainage, retraits), liquidité DEX modeste, maturité ops claim, spéc Builders → produit après revue juridique.",
        },
        {
          type: "p",
          text: "Long terme - frais en McB + burn, staking/gouvernance de paramètres, rails africains élargis ; services régulés adjacents seulement s’ils sont conformes à la Constitution.",
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
            "McB est-il un investissement ? Non. C’est un jeton utilitaire. Pas de rendement ni de promesse de prix.",
            "Que sont les Buleli Points ? Des récompenses utilitaires off-chain pour l’activité vérifiée ; pas de l’argent liquide.",
            "Comment obtenir du McB ? Quand les claims sont actifs : KYC + conversion BP au ratio 100 BP = 1 McB vers un wallet BEP-20.",
            "Y a-t-il une ICO ? Non.",
            "Qu’est-ce que le Builders Program ? Une piste communautaire en draft (Build. Grow. Belong.) - paliers payés en McB (prix à définir), pas en BP.",
            "Où est le détail technique tokenomics ? Maintenu en interne et reflété ici au fur et à mesure qu’il passe en production.",
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
          text: "La force de McBuleli, c’est de livrer d’abord des outils réels pour les utilisateurs africains - puis une économie utilitaire honnête. Cette Constitution Lite (v1.0) est la référence publique que nous ferons évoluer quand le produit aura mérité la version suivante.",
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

import type { EmailDetailRow } from "@/lib/email/wallet-email-details";
import type { PartnershipTemplate } from "@/lib/email/partnership/partnership-types";
import { PARTNERSHIP_PLACEHOLDERS } from "@/lib/email/partnership/partnership-placeholders";

export type SilikinTemplateId = "silikin_initial_fr";

function companyDetailRows(): EmailDetailRow[] {
  const p = PARTNERSHIP_PLACEHOLDERS;
  return [
    { label: "Société", value: p.companyLegalName },
    { label: "RCCM", value: p.registrationId },
    { label: "Signataire", value: `${p.contactName} - ${p.contactRole}` },
    { label: "E-mail", value: p.contactEmail },
    { label: "Téléphone", value: p.contactPhone },
    { label: "Site web", value: p.website },
    { label: "Marché", value: p.countryFocus },
  ];
}

const INITIAL_FR: PartnershipTemplate = {
  id: "silikin_initial_fr",
  locale: "fr",
  fromAddress: "ceo",
  subject:
    "Demande de partenariat & candidature programme - McBuleli (fintech RDC)",
  preheader:
    "Fintech wallet, P2P escrow, Academy - candidature Grandir & Faire Grandir.",
  title: "Partenariat Silikin Village - McBuleli",
  paragraphs: [
    "Monsieur Kanda,",
    "Je me permets de vous écrire en ma qualité de **CEO** de **McBuleli** (mcbuleli.org), plateforme fintech congolaise dédiée à l’inclusion financière numérique en RDC et en Afrique.",
    "Nous suivons avec intérêt le rôle de **Silikin Village** comme catalyseur de l’innovation à Kinshasa - notamment vos programmes d’accompagnement, vos Community Talks autour de la finance et vos initiatives tech. Nous souhaiterions **présenter McBuleli** et explorer comment notre projet pourrait s’intégrer à votre écosystème, en particulier via le programme **Grandir & Faire Grandir**.",
    "**McBuleli en bref** - une application tout-en-un qui combine : **wallet** USDT & Pi avec dépôts/retraits ; **marché P2P** avec séquestre (escrow) et mobile money ; **épargne collective (AVEC)** et staking ; **McBuleli Academy** (formations live crypto, trading, P2P, IA) ; et **identité vérifiée (KYC)** pour sécuriser les usages sensibles.",
    "Notre ambition : rendre l’accès aux actifs numériques **simple, sécurisé et pédagogique** pour les communautés africaines, en commençant par la RDC.",
    "**Pourquoi Silikin Village** - alignement **fintech** et dimension **edtech** (Academy) ; mission commune d’**inclusion financière** ; complémentarité possible via ateliers pratiques, co-animation d’événements ou masterclasses sur votre site.",
    "**Ce que nous proposons** : (1) candidature au parcours **Grandir & Faire Grandir** ; (2) **partenariat de contenu** (sessions Academy / ateliers finance numérique) ; (3) échange sur des synergies avec vos entrepreneurs (outillage P2P, mobile money, formation).",
    "McBuleli dispose de **documents légaux** (RCCM, identification nationale) que nous joignons à ce message. Nous pouvons transmettre un pitch deck sur demande.",
    "Seriez-vous disponible pour un **échange de 30 minutes** (en présentiel à Silikin Village ou en visio) afin que je vous présente McBuleli plus en détail ?",
    "Cordialement,",
  ],
  cta: "Découvrir McBuleli",
  detailRows: companyDetailRows(),
};

const TEMPLATES: Record<SilikinTemplateId, PartnershipTemplate> = {
  silikin_initial_fr: INITIAL_FR,
};

export function getSilikinTemplate(id: SilikinTemplateId): PartnershipTemplate {
  const t = TEMPLATES[id];
  if (!t) throw new Error(`Unknown Silikin template: ${id}`);
  return t;
}

export function listSilikinTemplateIds(): SilikinTemplateId[] {
  return Object.keys(TEMPLATES) as SilikinTemplateId[];
}

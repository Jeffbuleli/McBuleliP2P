import type { EmailDetailRow } from "@/lib/email/wallet-email-details";

export type PartnershipTemplateId =
  | "avadapay_initial_fr"
  | "avadapay_initial_en"
  | "avadapay_followup_fr"
  | "avadapay_followup_en";

export type PartnershipTemplate = {
  id: PartnershipTemplateId;
  locale: "fr" | "en";
  subject: string;
  preheader: string;
  title: string;
  paragraphs: string[];
  cta: string;
  detailRows: EmailDetailRow[];
};

/** Replace before send — company legal details. */
export const PARTNERSHIP_PLACEHOLDERS = {
  companyLegalName: "Ets McBuleli",
  registrationId: "CD/KNG/RCCM/26-A-00382",
  contactName: "Jeff Buleli",
  contactRole: "CEO",
  contactEmail: "ceo@mcbuleli.org",
  contactPhone: "+243 997 366 736",
  website: "https://mcbuleli.org",
  countryFocus: "République Démocratique du Congo (RDC)",
  monthlyVolumeHint: "500–2 000 retraits/mois au lancement",
} as const;

function companyDetailRows(locale: "fr" | "en"): EmailDetailRow[] {
  const p = PARTNERSHIP_PLACEHOLDERS;
  if (locale === "fr") {
    return [
      { label: "Société", value: p.companyLegalName },
      { label: "RCCM", value: p.registrationId },
      { label: "Signataire", value: `${p.contactName} — ${p.contactRole}` },
      { label: "E-mail", value: p.contactEmail },
      { label: "Téléphone", value: p.contactPhone },
      { label: "Site web", value: p.website },
      { label: "Marché", value: p.countryFocus },
      { label: "Volume estimé", value: p.monthlyVolumeHint },
    ];
  }
  return [
    { label: "Company", value: p.companyLegalName },
    { label: "Registration", value: p.registrationId },
    { label: "Signatory", value: `${p.contactName} — ${p.contactRole}` },
    { label: "Email", value: p.contactEmail },
    { label: "Phone", value: p.contactPhone },
    { label: "Website", value: p.website },
    { label: "Market", value: "Democratic Republic of Congo (DRC)" },
    { label: "Est. volume", value: p.monthlyVolumeHint },
  ];
}

const INITIAL_FR: PartnershipTemplate = {
  id: "avadapay_initial_fr",
  locale: "fr",
  subject: "Demande API AvadaPay — McBuleli, payouts mobile money RDC",
  preheader:
    "Fintech wallet & P2P — besoin API payouts RDC (Orange, Airtel, M-Pesa).",
  title: "Demande d’accès API — partenariat mobile money",
  paragraphs: [
    "Bonjour,",
    "Je me permets de vous écrire suite à notre échange téléphonique. Nous souhaitons formaliser notre demande d’intégration **AvadaPay** pour les corridors **mobile money en RDC**, en complément de notre stack paiements existante.",
    "**McBuleli** (mcbuleli.org) est une plateforme fintech orientée Afrique : portefeuille custodial, marketplace **P2P** avec séquestre (escrow) pour l’achat/vente d’actifs numériques, et **épargne collective AVEC** (trésorerie de groupe en USDT, gouvernance et cycles). Nos utilisateurs sont vérifiés (KYC) ; les flux fiat passent par des partenaires agréés type mobile money.",
    "Aujourd’hui nous explorons plusieurs PSP. Nous avons besoin, comme pour d’autres intégrations, d’un flux **payouts** fiable vers les portefeuilles mobile money (Orange Money, Airtel Money, M-Pesa, etc.) pour les **retraits fiat** de nos utilisateurs en RDC. Les **dépôts** et la réconciliation doivent rester couverts de façon symétrique si votre API le permet.",
    "Dans le contexte RDC, nous positionnons McBuleli comme **infrastructure fintech et mobile money** au service d’utilisateurs identifiés — et non comme une plateforme de promotion crypto. Nos produits visibles (P2P, AVEC, wallet) sont compréhensibles par les équipes compliance : transferts encadrés, KYC, journalisation et support humain.",
    "**Besoins techniques :** accès API (sandbox puis production), documentation payouts & deposits, webhooks de statut, idempotence des références, devises **USD/CDF** selon corridor, et accompagnement à l’onboarding marchand.",
    "Nous restons à votre disposition pour un call, une due diligence et la signature d’un accord de service. Merci de nous indiquer la procédure, les délais et les prérequis KYC/compliance côté marchand.",
    "Cordialement,",
  ],
  cta: "Découvrir McBuleli",
  detailRows: companyDetailRows("fr"),
};

const INITIAL_EN: PartnershipTemplate = {
  id: "avadapay_initial_en",
  locale: "en",
  subject: "AvadaPay API request — McBuleli, DRC mobile money payouts",
  preheader:
    "Fintech wallet & P2P — DRC payout API for Orange, Airtel, M-Pesa corridors.",
  title: "API access request — mobile money partnership",
  paragraphs: [
    "Hello,",
    "Following our recent phone call, we would like to formalize our request to integrate **AvadaPay** for **mobile money corridors in the DRC**, as part of our payments stack.",
    "**McBuleli** (mcbuleli.org) is an Africa-focused fintech platform: custodial wallet, **P2P marketplace** with escrow for digital asset trades, and **AVEC** community savings (group treasury in USDT with governance and cycles). Users complete identity verification (KYC); fiat flows are processed through licensed mobile-money partners.",
    "We are evaluating PSPs for DRC. We require reliable **payout** APIs to mobile wallets (Orange Money, Airtel Money, M-Pesa, etc.) for user **fiat withdrawals**, alongside deposits and reconciliation where available.",
    "In the DRC context, we present McBuleli as **fintech and mobile-money infrastructure** for verified users — not as a crypto marketing platform. Our live products (P2P, AVEC, wallet) are straightforward for compliance review: controlled transfers, KYC, audit trails, and human support.",
    "**Technical needs:** sandbox and production API access, payout/deposit documentation, status webhooks, idempotent references, **USD/CDF** support per corridor, and merchant onboarding guidance.",
    "We are happy to schedule a call, complete due diligence, and sign a service agreement. Please advise on your process, timelines, and merchant KYC requirements.",
    "Best regards,",
  ],
  cta: "Visit McBuleli",
  detailRows: companyDetailRows("en"),
};

const FOLLOWUP_FR: PartnershipTemplate = {
  id: "avadapay_followup_fr",
  locale: "fr",
  subject: "Relance — intégration API AvadaPay (McBuleli, payouts RDC)",
  preheader: "Suite à notre appel — documents et besoins payouts.",
  title: "Relance — dossier d’intégration",
  paragraphs: [
    "Bonjour,",
    "Suite à notre conversation, vous trouverez ci-dessous le résumé de notre activité et de notre besoin **payouts mobile money RDC**.",
    "McBuleli opère un portefeuille, un marché P2P sous séquestre et des groupes d’épargne AVEC. Nous cherchons un partenaire capable de **sorties** vers Orange / Airtel / M-Pesa avec webhooks et sandbox, sur le même modèle que nos intégrations PSP actuelles.",
    "Merci de nous transmettre la marche à suivre (formulaire, NDA, checklist compliance) et un contact technique pour l’API.",
    "Cordialement,",
  ],
  cta: "mcbuleli.org",
  detailRows: companyDetailRows("fr"),
};

const FOLLOWUP_EN: PartnershipTemplate = {
  id: "avadapay_followup_en",
  locale: "en",
  subject: "Follow-up — AvadaPay API integration (McBuleli, DRC payouts)",
  preheader: "After our call — summary and payout API requirements.",
  title: "Follow-up — integration dossier",
  paragraphs: [
    "Hello,",
    "Further to our call, please find a short summary of our activity and our **DRC mobile-money payout** requirement.",
    "McBuleli runs a wallet, escrow P2P marketplace, and AVEC savings groups. We need a partner for reliable **payouts** to Orange / Airtel / M-Pesa with webhooks and sandbox access, consistent with our existing PSP integrations.",
    "Please share next steps (forms, NDA, compliance checklist) and a technical contact for the API.",
    "Best regards,",
  ],
  cta: "mcbuleli.org",
  detailRows: companyDetailRows("en"),
};

const TEMPLATES: Record<PartnershipTemplateId, PartnershipTemplate> = {
  avadapay_initial_fr: INITIAL_FR,
  avadapay_initial_en: INITIAL_EN,
  avadapay_followup_fr: FOLLOWUP_FR,
  avadapay_followup_en: FOLLOWUP_EN,
};

export function getPartnershipTemplate(
  id: PartnershipTemplateId,
): PartnershipTemplate {
  const t = TEMPLATES[id];
  if (!t) throw new Error(`Unknown partnership template: ${id}`);
  return t;
}

export function listPartnershipTemplateIds(): PartnershipTemplateId[] {
  return Object.keys(TEMPLATES) as PartnershipTemplateId[];
}

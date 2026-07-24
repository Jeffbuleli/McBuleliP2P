/**
 * Marketing copy for the public /hackathon landing (FR/EN).
 * Separated from DB seed so messaging can evolve without migrations.
 */

export type BenefitItem = { title: string; body: string };
export type ChallengeItem = { id: string; label: string; blurb: string };
export type JourneyStep = { step: number; title: string; body: string };
export type CriteriaItem = { label: string; weight?: string; body: string };
export type RewardItem = { title: string; body: string };

export function whyParticipate(isFr: boolean): BenefitItem[] {
  if (isFr) {
    return [
      {
        title: "Apprendre",
        body: "Maîtrisez le Vibe Coding avec Cursor, Claude, Codex et les outils IA modernes - du prototype au déploiement.",
      },
      {
        title: "Créer",
        body: "Construisez une application réelle en équipe, sur un défi concret pour la RDC et l’Afrique.",
      },
      {
        title: "Mentors",
        body: "Bénéficiez du coaching de mentors produit, tech et business tout au long du hackathon.",
      },
      {
        title: "Réseau",
        body: "Rencontrez builders, universités, entreprises et décideurs de l’écosystème Kinshasa.",
      },
      {
        title: "Prix & reconnaissance",
        body: "Compétition officielle, certificat McBuleli et mise en avant des meilleures équipes.",
      },
      {
        title: "Incubation",
        body: "Les projets prometteurs peuvent rejoindre un parcours d’accompagnement post-événement.",
      },
      {
        title: "Emploi",
        body: "Connectez-vous à des opportunités de recrutement auprès de partenaires et sponsors.",
      },
      {
        title: "Investisseurs",
        body: "Pitchtez devant un jury et ouvrez la porte à des conversations d’investissement.",
      },
    ];
  }
  return [
    {
      title: "Learn",
      body: "Master Vibe Coding with Cursor, Claude, Codex and modern AI tools - from prototype to deploy.",
    },
    {
      title: "Build",
      body: "Ship a real application with your team on a challenge that matters for DRC and Africa.",
    },
    {
      title: "Mentors",
      body: "Get coached by product, tech and business mentors throughout the hackathon.",
    },
    {
      title: "Network",
      body: "Meet builders, universities, companies and decision-makers in Kinshasa’s ecosystem.",
    },
    {
      title: "Awards",
      body: "Official competition, McBuleli certificate and spotlight for top teams.",
    },
    {
      title: "Incubation",
      body: "Promising projects may join a post-event support track.",
    },
    {
      title: "Careers",
      body: "Connect with hiring opportunities from partners and sponsors.",
    },
    {
      title: "Investors",
      body: "Pitch before a jury and open conversations with investors.",
    },
  ];
}

export function challengeCategories(isFr: boolean): ChallengeItem[] {
  if (isFr) {
    return [
      { id: "ai", label: "Intelligence artificielle", blurb: "Agents, LLM, automation et produits IA utiles." },
      { id: "fintech", label: "FinTech", blurb: "Paiements, inclusion financière, crypto & mobile money." },
      { id: "govtech", label: "GovTech", blurb: "Services publics numériques et transparence." },
      { id: "health", label: "Santé", blurb: "Accès aux soins, diagnostic, santé communautaire." },
      {
        id: "agriculture",
        label: "AgroTech",
        blurb:
          "Moderniser la chaîne de production agricole en RDC, avec ILOKWE GROUP comme référence terrain (production, rentabilité, valorisation du terroir).",
      },
      { id: "education", label: "Éducation", blurb: "Apprentissage, compétences et accessibilité." },
      { id: "media", label: "Médias", blurb: "Information, création de contenu et confiance." },
      { id: "cyber", label: "Cybersécurité", blurb: "Protection des données, identité et résilience." },
    ];
  }
  return [
    { id: "ai", label: "Artificial intelligence", blurb: "Agents, LLMs, automation and useful AI products." },
    { id: "fintech", label: "FinTech", blurb: "Payments, inclusion, crypto & mobile money." },
    { id: "govtech", label: "GovTech", blurb: "Digital public services and transparency." },
    { id: "health", label: "Health", blurb: "Access to care, diagnostics, community health." },
    {
      id: "agriculture",
      label: "AgroTech",
      blurb:
        "Modernize the agricultural production chain in DRC, using ILOKWE GROUP as a field reference (production, profitability, terroir value).",
    },
    { id: "education", label: "Education", blurb: "Learning, skills and accessibility." },
    { id: "media", label: "Media", blurb: "Information, content and trust." },
    { id: "cyber", label: "Cybersecurity", blurb: "Data protection, identity and resilience." },
  ];
}

export function journeySteps(isFr: boolean): JourneyStep[] {
  if (isFr) {
    return [
      { step: 1, title: "Inscription", body: "Confirmez votre e-mail, puis réservez votre place (rappels 24 h)." },
      { step: 2, title: "Validation", body: "Paiement confirmé - ticket QR envoyé par e-mail." },
      { step: 3, title: "Formation", body: "Bootcamp Vibe Coding (outils IA & ship)." },
      { step: 4, title: "Hackathon", body: "Build intensif en équipe sur votre défi." },
      { step: 5, title: "Présentation", body: "Pitch devant le jury et les partenaires." },
      { step: 6, title: "Délibération", body: "Évaluation selon la grille officielle." },
      { step: 7, title: "Remise des prix", body: "Récompenses, visibilité et certificats." },
      { step: 8, title: "Incubation", body: "Accompagnement des projets sélectionnés." },
    ];
  }
  return [
    { step: 1, title: "Registration", body: "Confirm your email, then hold your seat (24 h reminders)." },
    { step: 2, title: "Validation", body: "Payment confirmed - QR ticket by email." },
    { step: 3, title: "Training", body: "Vibe Coding bootcamp (AI tools & ship)." },
    { step: 4, title: "Hackathon", body: "Intensive team build on your challenge." },
    { step: 5, title: "Demo day", body: "Pitch before the jury and partners." },
    { step: 6, title: "Deliberation", body: "Scoring against the official rubric." },
    { step: 7, title: "Awards", body: "Prizes, visibility and certificates." },
    { step: 8, title: "Incubation", body: "Support for selected projects." },
  ];
}

export function evaluationCriteria(isFr: boolean): CriteriaItem[] {
  if (isFr) {
    return [
      { label: "Innovation", weight: "25%", body: "Originalité de l’idée et usage pertinent de l’IA." },
      { label: "Impact", weight: "25%", body: "Valeur pour les utilisateurs et la société en RDC." },
      { label: "Qualité technique", weight: "20%", body: "Robustesse, UX et faisabilité du prototype." },
      { label: "Business model", weight: "15%", body: "Clarté du modèle et potentiel de croissance." },
      { label: "Présentation", weight: "15%", body: "Clarté du pitch, storytelling et démonstration." },
    ];
  }
  return [
    { label: "Innovation", weight: "25%", body: "Originality and meaningful use of AI." },
    { label: "Impact", weight: "25%", body: "Value for users and society in DRC." },
    { label: "Technical quality", weight: "20%", body: "Robustness, UX and prototype feasibility." },
    { label: "Business model", weight: "15%", body: "Clarity of model and growth potential." },
    { label: "Presentation", weight: "15%", body: "Pitch clarity, storytelling and demo." },
  ];
}

export function rewardHighlights(isFr: boolean): RewardItem[] {
  if (isFr) {
    return [
      { title: "Prix à annoncer", body: "Dotations et distinctions officiellement communiquées avant l’événement." },
      { title: "Incubation", body: "Accompagnement pour faire passer le prototype à l’étape suivante." },
      { title: "Mentorat", body: "Accès à des mentors tech, produit et business." },
      { title: "Opportunités d’investissement", body: "Visibilité auprès d’investisseurs et partenaires stratégiques." },
      { title: "Visibilité médiatique", body: "Couverture et mise en avant des projets lauréats." },
      { title: "Certificat officiel", body: "Attestation McBuleli de participation / distinction." },
    ];
  }
  return [
    { title: "Prizes TBA", body: "Awards and prizes announced officially before the event." },
    { title: "Incubation", body: "Support to take the prototype to the next stage." },
    { title: "Mentorship", body: "Access to tech, product and business mentors." },
    { title: "Investment opportunities", body: "Visibility with investors and strategic partners." },
    { title: "Media visibility", body: "Coverage and spotlight for winning projects." },
    { title: "Official certificate", body: "McBuleli certificate of participation / distinction." },
  ];
}

export function expandedFaq(isFr: boolean): { q: string; a: string }[] {
  if (isFr) {
    return [
      {
        q: "Qui peut participer ?",
        a: "Étudiants, développeurs, designers, entrepreneurs et profils pluridisciplinaires. Les débutants sont les bienvenus : le bootcamp pose les bases.",
      },
      {
        q: "Faut-il déjà avoir une équipe ?",
        a: "Non. Vous pouvez vous inscrire en solo et former une équipe sur place, ou arriver déjà constitué.",
      },
      {
        q: "Est-ce gratuit ?",
        a: "Non. Tarif unique : 100 USD pour le programme complet (2 Jours). Des places partenaires / bourses peuvent être annoncées séparément.",
      },
      {
        q: "Quels sont les critères d’évaluation ?",
        a: "Innovation, impact, qualité technique, business model et présentation - voir la grille détaillée ci-dessus.",
      },
      {
        q: "À qui appartient la propriété intellectuelle ?",
        a: "Les participants conservent la propriété intellectuelle de leurs projets, sauf accord écrit différent avec un partenaire. McBuleli peut communiquer sur l’événement et les projets présentés (nom, description, démo) à des fins de promotion.",
      },
      {
        q: "Comment se passe le paiement ?",
        a: "Pré-inscription : confirmez d'abord votre e-mail (lien de vérification). Ensuite place réservée sans expiration automatique, avec rappels toutes les 24 h et lien de paiement Orange Money, M-Pesa ou Airtel Money. Vous pouvez aussi payer immédiatement après confirmation. Ticket QR par e-mail après paiement.",
      },
      {
        q: "Où et quand a lieu l’événement ?",
        a: "À Kinshasa - Silikin Village, 63, Ave Colonel Mondjiba. Dates : bientôt annoncées (communiquées aux inscrits).",
      },
      {
        q: "Puis-je venir en tant qu’entreprise ou université ?",
        a: "Oui. Utilisez les formulaires Partenaire ou Sponsor, ou contactez-nous directement.",
      },
    ];
  }
  return [
    {
      q: "Who can participate?",
      a: "Students, developers, designers, founders and multidisciplinary profiles. Beginners are welcome - the bootcamp covers the basics.",
    },
    {
      q: "Do I need a team already?",
      a: "No. Register solo and form a team on site, or arrive with a team.",
    },
    {
      q: "Is it free?",
      a: "No. Single price: 100 USD for the full 2-day program. Partner seats / scholarships may be announced separately.",
    },
    {
      q: "What are the judging criteria?",
      a: "Innovation, impact, technical quality, business model and presentation - see the rubric above.",
    },
    {
      q: "Who owns the intellectual property?",
      a: "Participants retain IP on their projects unless otherwise agreed in writing with a partner. McBuleli may communicate about the event and presented projects (name, description, demo) for promotional purposes.",
    },
    {
      q: "How does payment work?",
      a: "Pre-registration: confirm your email first (verification link). Then your seat is held with no automatic expiry, with reminders every 24 h and a pay link for Orange Money, M-Pesa or Airtel Money. You can also pay immediately after confirmation. QR ticket by email after payment.",
    },
    {
      q: "Where and when is it?",
      a: "In Kinshasa - Silikin Village, 63 Ave Colonel Mondjiba. Dates: coming soon (shared with registered participants).",
    },
    {
      q: "Can companies or universities join?",
      a: "Yes. Use the Partner or Sponsor forms, or contact us directly.",
    },
  ];
}

/** Corporate registry - McBuleli (RDC). */
export const HACKATHON_LEGAL = {
  legalName: "McBuleli",
  rccm: "CD/KNG/RCCM/26-A-00382",
  idNat: "01-G4701-N91309X",
  taxId: "G2660507E",
  address: "Kinshasa, République Démocratique du Congo",
} as const;

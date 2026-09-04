/** Contenus statiques pilote - FR prioritaire ; autres langues en Phase 2. */

export type StaticSection = { title: string; body: string[] };

export const EMERGENCY_NUMBERS: StaticSection = {
  title: "Numéros d'urgence (RDC)",
  body: [
    "Police : 112 ou commissariat le plus proche",
    "Pompiers : selon votre ville (renseignez-vous localement)",
    "Urgence médicale : hôpital ou centre de santé le plus proche",
    "En danger immédiat : appelez d'abord les services d'urgence, puis NGEMBA si vous le pouvez.",
  ],
};

export const RESOURCES_SECTIONS: StaticSection[] = [
  EMERGENCY_NUMBERS,
  {
    title: "Orientation NGEMBA",
    body: [
      "NGEMBA oriente vers un opérateur humain partenaire - ce n'est pas un remplacement de la police ni des urgences médicales.",
      "Heures pilote : une réponse humaine est visée en quelques minutes pendant les heures d'ouverture du partenaire.",
      "Hors horaires : votre alerte est enregistrée ; les numéros d'urgence restent disponibles.",
    ],
  },
  {
    title: "Violences basées sur le genre (VBG)",
    body: [
      "Si vous êtes en sécurité pour parler, utilisez SOS.",
      "Mode discret : écrivez peu de mots ; un opérateur vous répondra par message si disponible.",
      "Ne restez pas seul·e si vous pouvez vous rendre dans un lieu sûr (famille, voisin·e de confiance).",
    ],
  },
];

export const PREVENT_SECTIONS: StaticSection[] = [
  {
    title: "Avant une situation",
    body: [
      "Identifiez un contact de confiance et partagez-lui NGEMBA si utile.",
      "Repérez les lieux sûrs près de chez vous (commerces, poste, école).",
      "En zone à risque, privilégiez les déplacements accompagnés quand c'est possible.",
    ],
  },
  {
    title: "Si vous êtes témoin",
    body: [
      "Ne vous mettez jamais en danger pour filmer ou intervenir.",
      "Signalez via Témoin avec des mots simples : lieu, type de situation, heure approximative.",
      "Appelez les urgences si une vie est en danger immédiat.",
    ],
  },
  {
    title: "Fausses alertes",
    body: [
      "NGEMBA est un service de confiance. Les fausses alertes répétées peuvent limiter l'accès.",
      "Une nouvelle urgence réelle ne sera jamais bloquée automatiquement.",
    ],
  },
];

export const PRIVACY_SECTIONS: StaticSection[] = [
  {
    title: "Nature du service",
    body: [
      "NGEMBA est une plateforme d'alerte et d'orientation citoyenne opérée par McBuleli.",
      "Elle ne remplace pas la police, les pompiers, les services médicaux ni la justice.",
    ],
  },
  {
    title: "Données collectées",
    body: [
      "Message ou voix que vous choisissez d'envoyer.",
      "Position GPS uniquement si vous acceptez explicitement.",
      "Province et ville si vous les sélectionnez.",
      "Pas de compte obligatoire en phase pilote.",
    ],
  },
  {
    title: "Utilisation",
    body: [
      "Triage automatique (IA locale ou hybride) pour orienter l'urgence.",
      "Transmission à un opérateur humain partenaire accrédité.",
      "L'IA ne certifie pas une preuve judiciaire.",
    ],
  },
  {
    title: "Conservation",
    body: [
      "Alertes : durée limitée (objectif pilote 24 mois, à confirmer juridiquement).",
      "Accès opérateurs journalisés.",
      "Contact : info@ngemba-rdc.org",
    ],
  },
];

export const CGU_SECTIONS: StaticSection[] = [
  {
    title: "Qui opère NGEMBA",
    body: [
      "NGEMBA est une plateforme citoyenne d'alerte et d'orientation, opérée par McBuleli.",
      "Elle est conçue pour toute personne en RDC, sans appartenance à une organisation particulière.",
      "Des opérateurs humains partenaires accrédités peuvent vous orienter ; le label public reste McBuleli / NGEMBA.",
    ],
  },
  {
    title: "Acceptation",
    body: [
      "En utilisant NGEMBA, vous acceptez ces conditions d'utilisation.",
      "Si vous n'acceptez pas, n'envoyez pas d'alerte via la plateforme.",
    ],
  },
  {
    title: "Usage autorisé",
    body: [
      "Signaler une situation réelle ou un besoin d'orientation.",
      "Utiliser le parcours Témoin, École ou Jeunesse sans vous mettre en danger.",
      "Consulter les ressources d'aide et de prévention.",
    ],
  },
  {
    title: "Usage interdit",
    body: [
      "Fausses alertes malveillantes ou répétées.",
      "Harcèlement d'opérateurs, de citoyens ou de partenaires.",
      "Tentative d'accès non autorisé aux outils opérateurs.",
    ],
  },
  {
    title: "Limites du service",
    body: [
      "NGEMBA n'est pas un service d'urgence directe (police, pompiers, SAMU).",
      "En danger immédiat, appelez d'abord les numéros d'urgence locaux, puis NGEMBA si vous le pouvez.",
      "McBuleli peut limiter un usage abusif, sans jamais bloquer automatiquement une urgence critique.",
    ],
  },
  {
    title: "Contact",
    body: [
      "Questions sur le service : info@ngemba-rdc.org",
      "McBuleli : https://mcbuleli.com",
    ],
  },
];

export const CHARTE_ONG_SECTIONS: StaticSection[] = [
  {
    title: "Mission de l'opérateur partenaire",
    body: [
      "Accueillir chaque personne avec respect et sans jugement.",
      "Prioriser la sécurité immédiate de la personne.",
      "Orienter vers les ressources et partenaires compétents du réseau McBuleli / NGEMBA.",
    ],
  },
  {
    title: "Confidentialité",
    body: [
      "Ne pas divulguer le contenu des dossiers hors du cadre NGEMBA et des partenaires accrédités.",
      "Ne pas partager le code ou les accès opérateur.",
      "Ne pas contacter la personne par téléphone sans son accord si un risque d'agresseur existe.",
    ],
  },
  {
    title: "Qualité de service",
    body: [
      "Urgence critique : prise en charge visée sous 5 minutes (heures d'ouverture).",
      "Urgence élevée : sous 30 minutes.",
      "Documenter chaque action dans les notes opérateur.",
    ],
  },
  {
    title: "Signalement d'incident",
    body: [
      "Toute faille de sécurité ou fuite de données : info@ngemba-rdc.org sous 24 h.",
      "Escalade : McBuleli (équipe plateforme) via info@ngemba-rdc.org ou ceo@mcbuleli.org.",
    ],
  },
];

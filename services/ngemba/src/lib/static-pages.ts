/** Contenus statiques pilote — FR prioritaire ; autres langues en Phase 2. */

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
      "NGEMBA oriente vers un opérateur humain partenaire — ce n'est pas un remplacement de la police ni des urgences médicales.",
      "Heures pilote : une réponse humaine est visée en quelques minutes pendant les heures d'ouverture du partenaire.",
      "Hors horaires : votre alerte est enregistrée ; les numéros d'urgence restent disponibles.",
    ],
  },
  {
    title: "Violences basées sur le genre (VBG)",
    body: [
      "Si vous êtes en sécurité pour parler, utilisez SOS ou Parler.",
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
      "Contact : hi@mcbuleli.org",
    ],
  },
];

export const CGU_SECTIONS: StaticSection[] = [
  {
    title: "Acceptation",
    body: [
      "En utilisant NGEMBA, vous acceptez ces conditions d'utilisation (brouillon pilote).",
      "Si vous n'acceptez pas, n'envoyez pas d'alerte via la plateforme.",
    ],
  },
  {
    title: "Usage autorisé",
    body: [
      "Signaler une situation réelle ou un besoin d'orientation.",
      "Utiliser le parcours Témoin sans vous mettre en danger.",
      "Consulter les ressources d'aide et de prévention.",
    ],
  },
  {
    title: "Usage interdit",
    body: [
      "Fausses alertes malveillantes ou répétées.",
      "Harcèlement d'opérateurs ou de citoyens.",
      "Tentative d'accès non autorisé au dashboard ops.",
    ],
  },
  {
    title: "Limites",
    body: [
      "NGEMBA n'est pas un service d'urgence directe type police ou SAMU.",
      "En danger immédiat, appelez d'abord les numéros d'urgence locaux.",
      "McBuleli peut suspendre un accès abusif sans bloquer une urgence critical.",
    ],
  },
];

export const CHARTE_ONG_SECTIONS: StaticSection[] = [
  {
    title: "Mission opérateur ONG",
    body: [
      "Accueillir la personne avec respect et sans jugement.",
      "Prioriser la sécurité immédiate de la personne.",
      "Orienter vers les ressources JGL ou partenaires compétents.",
    ],
  },
  {
    title: "Confidentialité",
    body: [
      "Ne pas divulguer le contenu des dossiers hors NGEMBA et JGL.",
      "Ne pas partager le code opérateur.",
      "Ne pas contacter la personne par téléphone sans son accord si risque d'agresseur.",
    ],
  },
  {
    title: "Qualité de service (pilote)",
    body: [
      "Critical : prise en charge visée sous 5 minutes (heures ouverture).",
      "High : sous 30 minutes.",
      "Documenter chaque action dans les notes opérateur.",
    ],
  },
  {
    title: "Signalement incident",
    body: [
      "Toute faille de sécurité ou fuite de données : hi@mcbuleli.org sous 24 h.",
      "Escalade juridique : Me Arjoule Karinda / McBuleli ceo@mcbuleli.org.",
    ],
  },
];

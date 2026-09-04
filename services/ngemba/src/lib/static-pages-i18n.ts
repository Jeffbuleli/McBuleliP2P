import type { Locale } from "@/lib/i18n";
import {
  CGU_SECTIONS,
  CHARTE_ONG_SECTIONS,
  PRIVACY_SECTIONS,
  type StaticSection,
} from "@/lib/static-pages";

export type PageKey = "resources" | "prevent" | "privacy" | "cgu" | "charter";

type PageCopy = { title: string; sections: StaticSection[] };

const RESOURCES: Record<Locale, PageCopy> = {
  fr: {
    title: "Aide et ressources",
    sections: [
      {
        title: "Numéros d'urgence (RDC)",
        body: [
          "Police : 112 ou commissariat le plus proche",
          "Pompiers : selon votre ville",
          "Urgence médicale : hôpital ou centre de santé le plus proche",
          "En danger immédiat : appelez d'abord les secours, puis NGEMBA si possible.",
        ],
      },
      {
        title: "Orientation NGEMBA",
        body: [
          "NGEMBA oriente vers un opérateur humain - ce n'est pas un remplacement de la police ni des urgences médicales.",
          "Heures pilote : réponse humaine visée en quelques minutes.",
          "Hors horaires : alerte enregistrée ; numéros d'urgence disponibles.",
        ],
      },
      {
        title: "Violences basées sur le genre (VBG)",
        body: [
          "Si vous êtes en sécurité pour parler, utilisez SOS.",
          "Mode discret : écrivez peu de mots ; un opérateur répondra par message.",
          "Ne restez pas seul si vous pouvez aller dans un lieu sûr.",
        ],
      },
      {
        title: "École et mineurs (Safe School)",
        body: [
          "Signalement protégé via le module École - identité protégée.",
          "Le référent école reçoit la file dédiée, séparée des dossiers adultes.",
          "Danger immédiat : appelez aussi les secours locaux.",
        ],
      },
      {
        title: "Jeunes - apprendre à se protéger",
        body: [
          "Module Ngemba Jeunesse : 10 situations pour réfléchir (consentement, cyber, corruption...).",
          "Ce n'est pas un classement ni un jugement - un guide éducatif.",
          "Situation réelle grave : utilisez SOS NGEMBA tout de suite.",
        ],
      },
    ],
  },
  en: {
    title: "Help and Resources",
    sections: [
      {
        title: "Emergency Numbers (DRC)",
        body: [
          "Police: 112 or nearest police station",
          "Firefighters: depending on your city",
          "Medical emergency: nearest hospital or health center",
          "In immediate danger: call for help first, then NGEMBA if possible.",
        ],
      },
      {
        title: "NGEMBA Guidance",
        body: [
          "NGEMBA directs you to a human operator - it is not a replacement for police or medical emergencies.",
          "Pilot hours: human response aimed within minutes.",
          "Outside hours: recorded alert; emergency numbers available.",
        ],
      },
      {
        title: "Gender-Based Violence (GBV)",
        body: [
          "If you are safe to talk, use SOS or Talk.",
          "Discreet mode: write few words; an operator will respond via message.",
          "Do not stay alone if you can go to a safe place.",
        ],
      },
      {
        title: "School and minors (Safe School)",
        body: [
          "Protected report via the School module - your identity is protected.",
          "The school referent receives a dedicated queue, separate from adult cases.",
          "Immediate danger: also call local emergency services.",
        ],
      },
      {
        title: "Youth - learn to stay safe",
        body: [
          "Ngemba Youth: 10 situations to reflect (consent, cyber, corruption...).",
          "Not a ranking or judgment - an educational guide.",
          "Real serious danger: use NGEMBA SOS immediately.",
        ],
      },
    ],
  },
  ln: {
    title: "Mokano mpe biloko",
    sections: [
      {
        title: "Mokolo ya nzela (RDC)",
        body: [
          "Polis : 112 to komisi ya liboso",
          "Bompoko : ndenge na yo",
          "Nzela ya bokoko : hopital to centre ya santé ya liboso",
          "Na esengo ya mbala : yebisa liboso ba secours, na nsima NGEMBA soki ezali na possibilité.",
        ],
      },
      {
        title: "Orientation NGEMBA",
        body: [
          "NGEMBA ezali na oryantasyon na opérateur humain - ezali te remplacement ya police to urgences médicales.",
          "Heures pilote : réponse humaine ezali na nzela ya miniti mingi.",
          "Hors horaires : alerte ezali enregistrée ; numéros d'urgence ezali na disponibilité.",
        ],
      },
      {
        title: "Mibeko etali na nzela ya ngenge (VBG)",
        body: [
          "Soki ozali na esengo ya kolobela, tinda SOS.",
          "Mokolo ya kokanga : yemba makambo moke ; mokonzi akokutana na yo na nzela ya message.",
          "Oyo osengeli te kozala moko soki okoki kokende na esika ya malamu.",
        ],
      },
      {
        title: "Ékole na ba mineurs (Safe School)",
        body: [
          "Kokoma na nzela ya module Ékole - identité ezali na protection.",
          "Referent ya Ékole azwa file ya sika, eza na séparation na ba dosye ya mibali.",
          "Danger ya ntango moko : yebisa mpe ba secours ya libanda.",
        ],
      },
      {
        title: "Bato ya mbala - koyekola ndenge ya kokokisa",
        body: [
          "Module Ngemba IA ya Bato ya mbala : 10 makambo mpo na kolimbola (koyebisa, cyber, corruption...).",
          "Oyo ezali te classement to jugement - ezali guide ya koyekola.",
          "Makambo ya solo ya mabe : salela SOS NGEMBA ntango moko.",
        ],
      },
    ],

  },
  sw: {
    title: "Msaada na rasilimali",
    sections: [
      {
        title: "Nambari za dharura (RDC)",
        body: [
          "Polisi : 112 au kituo cha polisi kilicho karibu",
          "Zimamoto : kulingana na jiji lako",
          "Dharura ya matibabu : hospitali au kituo cha afya kilicho karibu",
          "Katika hatari ya papo hapo : piga simu kwanza kwa msaada, kisha NGEMBA ikiwa inawezekana.",
        ],
      },
      {
        title: "Mwelekeo wa NGEMBA",
        body: [
          "NGEMBA inaelekeza kwa opereta wa kibinadamu - si mbadala wa polisi wala huduma za dharura za matibabu.",
          "Saa za majaribio: jibu la kibinadamu linatarajiwa ndani ya dakika chache.",
          "Nje ya saa: tahadhari imeandikwa; nambari za dharura zinapatikana.",
        ],
      },
      {
        title: "Vikosi vinavyotokana na jinsia (VBG)",
        body: [
          "Ikiwa uko salama kuzungumza, tumia SOS.",
          "Njia ya siri: andika maneno machache; opereta atajibu kwa ujumbe.",
          "Usibaki peke yako ikiwa unaweza kwenda mahali salama.",
        ],
      },
      {
        title: "Shule na watoto wadogo (Shule Salama)",
        body: [
          "Ripoti iliyohifadhiwa kupitia moduli ya Shule - utambulisho umehifadhiwa.",
          "Mwakilishi wa shule anapokea faili maalum, tofauti na faili za watu wazima.",
          "Hatari ya papo hapo: piga simu pia kwa huduma za dharura za eneo hilo.",
        ],
      },
      {
        title: "Vijana - jifunze kujilinda",
        body: [
          "Moduli ya Ngemba Vijana: hali 10 za kufikiri (idhini, mtandao, ufisadi...).",
          "Hii si orodha wala hukumu - mwongozo wa elimu.",
          "Hali halisi mbaya: tumia SOS NGEMBA mara moja.",
        ],
      },
    ],

  },
  lua: {
    title: "Bikala ne bisalu",
    sections: [
      {
        title: "Mibulu ya nganga (RDC)",
        body: [
          "Polisi : 112 to komisi ya mobali ya nsuka",
          "Bompanga : malamu na mboka na yo",
          "Nganga ya mpasi : boloko to centre ya nganga ya nsuka",
          "Na likama ya mbala : yebisa liboso ba nganga, na nsuka NGEMBA soki ezali na mposa.",
        ],
      },
      {
        title: "Orientation NGEMBA",
        body: [
          "NGEMBA ebandaka ku mukonzi wa bantu - te ezali kokanga police to ba urgences médicales.",
          "Mokolo ya pilote : réponse ya muntu ebandaka na miniti mingi.",
          "Na nsima ya mikolo : alerte ebandaki ; ba numéros ya urgence ezali na disponibilité.",
        ],
      },
      {
        title: "Violences basées sur le genre (VBG)",
        body: [
          "Soki o zali na bokasi ya koloba, salela SOS.",
          "Mode discret : yebisa moke ; opérateur akopesa na message.",
          "Okozala te na moko soki okoki kokende na esika ya bokasi.",
        ],
      },
      {
        title: "Ékole na bana (Safe School)",
        body: [
          "Kusanga kwikala mu mposo ya Ékole - ntu ya kusanga ikala mu mposo.",
          "Mokambi ya ékole akokuta file ya mposo, eza na mposo ya bana.",
          "Kizanga ya ntete: yebisa mpe ba secours ya mabele.",
        ],
      },
      {
        title: "Bana - kumona kudi kudi",
        body: [
          "Module Ngemba IA ya Bana : 10 bintu bikalaka ku kudi (kudiyangisa, cyber, corruption...).",
          "Kasi te, ezali te kudi to kudi - ezali muku ya koyekola.",
          "Situasiya ya solo ya mabe : salela SOS NGEMBA ntango nyonso.",
        ],
      },
    ],

  },
  kg: {
    title: "Mibeko na bisika",
    sections: [
      {
        title: "Mibeko ya ntango ya mpasi (RDC)",
        body: [
          "Polisi : 112 to komisi ya mabe ya sika",
          "Bompanga : ndenge ya mboka na yo",
          "Mokolo ya mpasi : boloko to ndako ya nzoto ya sika",
          "Na mpasi ya ntango ya mabe : yebisa liboso ba ndako ya mpasi, na nsima NGEMBA soki ekoki.",
        ],
      },
      {
        title: "Nganga NGEMBA",
        body: [
          "NGEMBA ebandaka na mosi ya muntu - te ezali kokanga na polisi to na ba urgences médicales.",
          "Mokolo ya mabele : nzela ya mosi ya muntu ebandaka na miniti mingi.",
          "Na ntango ya moke : alerte eza na nzela ; ba numéros ya urgence ezali na esika.",
        ],
      },
      {
        title: "Viyangani vingi ku zinga (VBG)",
        body: [
          "Soki o zali na ntina ya koloba, tinda SOS.",
          "Mokolo ya kokanga : yemba makambo moke ; mokonzi akotanga na message.",
          "Keba te o zala moko soki okoki kokende na esika ya nsuka.",
        ],
      },
      {
        title: "Sukulu na bana (Safe School)",
        body: [
          "Kukangisa na nzela ya module Sukulu - ntina ya kukangisa eza na nzela ya nzela.",
          "Mokambi ya sukulu akokisi file ya sika, eza na esika ya ba dossier ya mibali.",
          "Bango ya mpasi ya ntango ya sika : yebisa mpe ba secours ya lokasa.",
        ],
      },
      {
        title: "Bana - koyangela ndenge ya kokokisa",
        body: [
          "Module McBuleli Bana : 10 makambo mpo na kotala (koyokela, cyber, corruption...).",
          "Ezali te classement to jugement - ezali guide ya koyekola.",
          "Makambo ya solo ya ntango : salela SOS NGEMBA ntango moko.",
        ],
      },
    ],

  },
};

const PREVENT: Record<Locale, PageCopy> = {
  fr: {
    title: "Prévenir",
    sections: [
      {
        title: "Avant qu'il soit trop tard",
        body: [
          "Identifiez un contact de confiance à prévenir en cas de danger.",
          "Mémorisez les numéros d'urgence locaux.",
          "Parlez des situations inquiétantes tôt - ne restez pas isolé.",
        ],
      },
      {
        title: "En ligne et hors ligne",
        body: [
          "Ne partagez pas de photos intimes sous la pression.",
          "Bloquez et signalez le harcèlement en ligne.",
          "À l'école ou au travail : parlez à un référent de confiance.",
        ],
      },
      {
        title: "À l'école",
        body: [
          "Harcèlement, violence ou abus : utilisez Safe School sans donner votre nom complet.",
          "Un référent formé lit la file école - ce n'est pas un chat public.",
          "Si un ami est en danger ce soir, orientez-le vers SOS ou un adulte sûr.",
        ],
      },
      {
        title: "Pour les jeunes",
        body: [
          "Explorez les scénarios Ngemba Jeunesse pour vous entraîner à dire non.",
          "Consentement = choix libre, sans pression ni chantage.",
          "Corruption scolaire : refusez et parlez à un adulte de confiance ou signalez.",
        ],
      },
    ],
  },
  en: {
    title: "Prevent",
    sections: [
      {
        title: "Before It's Too Late",
        body: [
          "Identify a trusted contact to alert in case of danger.",
          "Memorize local emergency numbers.",
          "Talk about concerning situations early - do not stay isolated.",
        ],
      },
      {
        title: "Online and Offline",
        body: [
          "Do not share intimate photos under pressure.",
          "Block and report online harassment.",
          "At school or work: talk to a trusted reference.",
        ],
      },
      {
        title: "At school",
        body: [
          "Harassment, violence or abuse: use Safe School without giving your full name.",
          "A trained referent reads the school queue - it is not a public chat.",
          "If a friend is in danger tonight, guide them to SOS or a safe adult.",
        ],
      },
      {
        title: "For young people",
        body: [
          "Explore Ngemba Youth scenarios to practice saying no.",
          "Consent means a free choice - no pressure or blackmail.",
          "School corruption: refuse and talk to a trusted adult or report.",
        ],
      },
    ],
  },
  ln: {
    title: "Kobatela",
    sections: [
      {
        title: "Liboso ya likambo",
        body: [
          "Identifiez un contact ya confiance mpe zala na ye NGEMBA soki ezali na ntina.",
          "Tala bisika ya esengo oyo ezali na mboko na yo (nganga, ekolo, centre ya santé, mosali ya confiance).",
          "Zala na n° ya urgence oyo oza na yango na téléphone na yo.",
        ],
      },
      {
        title: "Soki ozali témoin",
        body: [
          "Te komitisa nzela mpo na kolanda to koyanola.",
          "Tindela na Témoin to SOS na makambo moke ya mposa.",
          "Lendisa moto na koluka esika ya malamu soki ezali na bokono te.",
        ],
      },
      {
        title: "Ba alarme ya lokuta",
        body: [
          "NGEMBA ezali service ya kondima. Mokanda ya mabe oyo ebimisami na ntango nyonso ekoki kokitisa nzela ya kokota.",
          "Soki ozali na mposa ya koyeba, yebisa na maloba ya solo ete ezali test to likambo.",
        ],
      },
    ],

  },
  sw: {
    title: "Kuzuia",
    sections: [
      {
        title: "Kabla ya hali",
        body: [
          "Tambua mtu wa kuaminika na mshirikishe NGEMBA ikiwa ni muhimu.",
          "Tambua maeneo salama karibu na nyumbani kwako (kanisa, shule, kituo cha afya, jirani wa kuaminika).",
          "Hifadhi nambari za dharura kwenye simu yako.",
        ],
      },
      {
        title: "Ikiwa wewe ni shahidi",
        body: [
          "Usijitumbukize katika hatari ili kupiga picha au kuingilia kati.",
          "Ripoti kupitia Témoin au SOS kwa maelezo machache ya msaada.",
          "Msaidie mtu huyo kupata mahali salama ikiwa inawezekana bila hatari.",
        ],
      },
      {
        title: "Tahadhari za uongo",
        body: [
          "NGEMBA ni huduma ya kuaminika. Tahadhari za uongo zinazojirudia zinaweza kupunguza upatikanaji.",
          "Ikiwa una shaka, andika wazi kwamba ni jaribio au swali.",
        ],
      },
    ],

  },
  lua: {
    title: "Kukangama",
    sections: [
      {
        title: "Kudi bantu bionso",
        body: [
          "Kangila mukanda wa ntu wa kinsala mpe banga NGEMBA soki ekokani.",
          "Tanga bisika ya bolamu banzela ya ndaku na yo (nganga, ekolo, centre ya bokoko, ntu ya kinsala).",
          "Zala na namba ya banga ebandaka na telefone na yo.",
        ],
      },
      {
        title: "Soki o zali na mposa",
        body: [
          "Te salaka na mposa mpo na kokanga to koluka.",
          "Tindika na Témoin to SOS na makambo moke ya mabe.",
          "Lendisa moto na kokanga esika ya malamu soki ezali na bokono te.",
        ],
      },
      {
        title: "Mikanda ya mabe",
        body: [
          "NGEMBA ke sevis ya kwikala na ntete. Mikanda ya mabe ya kanyokanyoko eza na makasi ya kutika nzela.",
          "Soki oza na mposa, yebisa na ntete ete ke test to nsango.",
        ],
      },
    ],

  },
  kg: {
    title: "Kukanga",
    sections: [
      {
        title: "Liboso ya mambu",
        body: [
          "Kanga mosi ya ntina ya kimpwanza mpe zola na ye NGEMBA soki ezali na ntina.",
          "Tanga bisika ya nsuka ya malamu na nse ya yo (nganga, ekolo, centre ya nzoto, mobali ya zola).",
          "Zala na nambala ya nzoto ya mbala na yo na telefone.",
        ],
      },
      {
        title: "Soki o zali na mposa",
        body: [
          "Tezola na mposa mpo na kokoma to koluka.",
          "Tanga na Témoin to SOS na makambo moke ya ntina.",
          "Lendisa moto na kokoma na esika ya nsuka soki ezali na mposa te.",
        ],
      },
      {
        title: "Mikanda ya mabe",
        body: [
          "NGEMBA ezali mosala ya kondima. Mikanda ya mabe oyo ebimaka na ntango nyonso ekoki kokitisa nzela ya kokota.",
          "Soki ozali na mposa ya koyeba, yebisa na ntango ya solo ete ezali test to likambo.",
        ],
      },
    ],

  },
};

const PRIVACY: Record<Locale, PageCopy> = {
  fr: {
    title: "Confidentialité",
    sections: PRIVACY_SECTIONS,
  },
  en: {
    title: "Privacy",
    sections: [
      {
        title: "Nature of the service",
        body: [
          "NGEMBA is a citizen alert and guidance platform operated by McBuleli.",
          "It does not replace the police, fire services, medical services, or the justice system.",
        ],
      },
      {
        title: "Data collected",
        body: [
          "Message or voice you choose to send.",
          "GPS location only if you explicitly accept.",
          "Province and city if you select them.",
          "No mandatory account in the pilot phase.",
        ],
      },
      {
        title: "Use",
        body: [
          "Automatic triage (local or hybrid AI) to guide urgency.",
          "Handoff to an accredited human partner operator.",
          "AI does not certify judicial evidence.",
        ],
      },
      {
        title: "Retention",
        body: [
          "Alerts: limited duration (pilot target 24 months, to be confirmed legally).",
          "Operator access is logged.",
          "Contact: info@ngemba-rdc.org",
        ],
      },
    ],
  },
  ln: {
    title: "Libomba ya makambo",
    sections: [
      {
        title: "Nini ezali NGEMBA",
        body: [
          "NGEMBA ezali esika ya kosala alerte mpe koyangela bato, oyo McBuleli ezali kosala.",
          "Ezali te kobongisa police, pompiers, biloko ya nganga to justice.",
        ],
      },
      {
        title: "Makambo oyo bakamata",
        body: [
          "Message to mongongo oyo opesaka.",
          "Esika GPS kaka soki ondimi na ntina.",
          "Province mpe engumba soki opomoni yango.",
          "Compte ezali te obligatoire na ntango ya pilote.",
        ],
      },
      {
        title: "Ndengé bakosalela",
        body: [
          "Triage automatique (IA locale to hybride) mpo na koyeba urgence.",
          "Kopesa makambo na opérateur humain partenaire oyo azali na ndingisa.",
          "IA ezali te koyeba preuve ya tribunal.",
        ],
      },
      {
        title: "Bokanga makambo",
        body: [
          "Ba alerte : ntango ya limitye (pilote : 24 mois, bakokufa na mibeko).",
          "Ba opérateurs bakokota na journal.",
          "Contact : info@ngemba-rdc.org",
        ],
      },
    ],
  },
  sw: {
    title: "Faragha",
    sections: [
      {
        title: "Asili ya huduma",
        body: [
          "NGEMBA ni jukwaa la tahadhari na mwongozo wa raia linaloendeshwa na McBuleli.",
          "Hailipi polisi, zimamoto, huduma za matibabu wala mahakama.",
        ],
      },
      {
        title: "Data zinazokusanywa",
        body: [
          "Ujumbe au sauti unayochagua kutuma.",
          "Mahali pa GPS tu ukikubali wazi.",
          "Mkoa na jiji ukichagua.",
          "Hakuna akaunti ya lazima katika awamu ya majaribio.",
        ],
      },
      {
        title: "Matumizi",
        body: [
          "Upangaji wa haraka (AI ya ndani au mchanganyiko) kuongoza dharura.",
          "Uhamishaji kwa opereta binadamu mshirika aliyeidhinishwa.",
          "AI haithibitishi ushahidi wa mahakama.",
        ],
      },
      {
        title: "Uhifadhi",
        body: [
          "Tahadhari: muda mdogo (lengo la majaribio miezi 24, kuthibitishwa kisheria).",
          "Ufikiaji wa waendeshaji unaandikwa.",
          "Mawasiliano: info@ngemba-rdc.org",
        ],
      },
    ],
  },
  lua: {
    title: "Kubomba makambo",
    sections: [
      {
        title: "Ninyi NGEMBA",
        body: [
          "NGEMBA i di esika ya alerte ne koyangela bantu, McBuleli udi kusala.",
          "Ke di te kubadika police, pompiers, biloko ya nganga to justice.",
        ],
      },
      {
        title: "Makambo bakamata",
        body: [
          "Message to mongongo wewe usonga.",
          "Esika GPS kaka soki undima na ntina.",
          "Province ne engumba soki usonga.",
          "Compte ke di te obligatoire mu pilote.",
        ],
      },
      {
        title: "Ndenge bakusalela",
        body: [
          "Triage automatique (IA) kudi koyeba urgence.",
          "Kupesa makambo ku opérateur humain partenaire.",
          "IA ke di te koyeba preuve ya tribunal.",
        ],
      },
      {
        title: "Kubomba",
        body: [
          "Ba alerte : ntango ya limitye (pilote 24 mois).",
          "Ba opérateurs bakokota na journal.",
          "Contact : info@ngemba-rdc.org",
        ],
      },
    ],
  },
  kg: {
    title: "Kubomba mambu",
    sections: [
      {
        title: "Nki i NGEMBA",
        body: [
          "NGEMBA i esika ya alerte ye koyangela bantu, McBuleli udi kusala.",
          "Ke di te kubadika police, pompiers, biloko ya nganga to justice.",
        ],
      },
      {
        title: "Mambu bakamata",
        body: [
          "Message to mongongo nge usonga.",
          "Esika GPS kaka soki undima na ntina.",
          "Province ye engumba soki usonga.",
          "Compte ke di te obligatoire mu pilote.",
        ],
      },
      {
        title: "Ndenge bakusalela",
        body: [
          "Triage automatique (IA) kudi koyeba urgence.",
          "Kupesa mambu ku opérateur humain partenaire.",
          "IA ke di te koyeba preuve ya tribunal.",
        ],
      },
      {
        title: "Kubomba",
        body: [
          "Ba alerte : ntango ya limitye (pilote 24 mois).",
          "Ba opérateurs bakokota na journal.",
          "Contact : info@ngemba-rdc.org",
        ],
      },
    ],
  },
};

const CGU: Record<Locale, PageCopy> = {
  fr: {
    title: "Conditions d'utilisation",
    sections: CGU_SECTIONS,
  },
  en: {
    title: "Terms of use",
    sections: [
      {
        title: "Who operates NGEMBA",
        body: [
          "NGEMBA is a citizen alert and guidance platform operated by McBuleli.",
          "It is designed for anyone in the DRC, without belonging to any particular organisation.",
          "Accredited human partner operators may guide you; the public label remains McBuleli / NGEMBA.",
        ],
      },
      {
        title: "Acceptance",
        body: [
          "By using NGEMBA, you accept these terms of use.",
          "If you do not accept them, do not send an alert through the platform.",
        ],
      },
      {
        title: "Allowed use",
        body: [
          "Report a real situation or a need for guidance.",
          "Use Witness, School or Youth paths without putting yourself in danger.",
          "Consult help and prevention resources.",
        ],
      },
      {
        title: "Forbidden use",
        body: [
          "Malicious or repeated false alerts.",
          "Harassment of operators, citizens or partners.",
          "Unauthorised attempts to access operator tools.",
        ],
      },
      {
        title: "Service limits",
        body: [
          "NGEMBA is not a direct emergency service (police, firefighters, ambulance).",
          "In immediate danger, call local emergency numbers first, then NGEMBA if you can.",
          "McBuleli may limit abusive use, without ever automatically blocking a critical emergency.",
        ],
      },
      {
        title: "Contact",
        body: [
          "Questions about the service: info@ngemba-rdc.org",
          "McBuleli: https://mcbuleli.com",
        ],
      },
    ],
  },
  ln: {
    title: "Mibeko ya kosalela",
    sections: [
      {
        title: "Nani azali kosala NGEMBA",
        body: [
          "NGEMBA ezali plateforme ya alerte mpe orientation ya bato, McBuleli ezali kosala yango.",
          "Ezali mpo na moto nyonso na RDC, ezali te ya organisation moko kaka.",
          "Ba opérateurs partenaires bakoki koyangela yo ; nkombo public ezali McBuleli / NGEMBA.",
        ],
      },
      {
        title: "Kondima",
        body: [
          "Soki osalelaka NGEMBA, ondimi mibeko oyo.",
          "Soki ondimi te, tinda te alerte na plateforme.",
        ],
      },
      {
        title: "Ndenge ya malamu",
        body: [
          "Yebisa makambo ya solo to mposa ya koyangela.",
          "Salela nzela ya Momonisi, Ekele to Bato ya moke, kasi tikala na kimia.",
          "Tala biloko ya lisalisi mpe ya kobatela.",
        ],
      },
      {
        title: "Ndenge oyo ezali te",
        body: [
          "Ba alerte ya lokuta to oyo ezali mingi.",
          "Kokanga ba opérateurs, bato to ba partenaires.",
          "Kokota na biloko ya opérateurs soki ezali te na ndingisa.",
        ],
      },
      {
        title: "Nini NGEMBA ekoki te",
        body: [
          "NGEMBA ezali te service ya urgence directe (police, pompiers, SAMU).",
          "Soki ozali na danger mbala moko, yebisa liboso numéros ya urgence, na nsima NGEMBA soki okoki.",
          "McBuleli ekoki kolimita usage ya mabe, kasi ekanga te urgence critique automatique.",
        ],
      },
      {
        title: "Contact",
        body: [
          "Mituna ya service : info@ngemba-rdc.org",
          "McBuleli : https://mcbuleli.com",
        ],
      },
    ],
  },
  sw: {
    title: "Masharti ya matumizi",
    sections: [
      {
        title: "Nani anaendesha NGEMBA",
        body: [
          "NGEMBA ni jukwaa la tahadhari na mwongozo wa raia linaloendeshwa na McBuleli.",
          "Imeundwa kwa mtu yeyote nchini DRC, bila kuwa wa shirika lolote maalum.",
          "Waendeshaji washirika walioidhinishwa wanaweza kukuongoza; jina la umma linabaki McBuleli / NGEMBA.",
        ],
      },
      {
        title: "Ukubali",
        body: [
          "Kwa kutumia NGEMBA, unakubali masharti haya ya matumizi.",
          "Ikiwa hukubali, usitume tahadhari kupitia jukwaa.",
        ],
      },
      {
        title: "Matumizi yanayoruhusiwa",
        body: [
          "Ripoti hali halisi au hitaji la mwongozo.",
          "Tumia njia za Shahidi, Shule au Vijana bila kujitia hatarini.",
          "Soma rasilimali za msaada na kuzuia.",
        ],
      },
      {
        title: "Matumizi yaliyokatazwa",
        body: [
          "Tahadhari za uwongo zenye nia mbaya au za kurudiwa.",
          "Unyanyasaji wa waendeshaji, raia au washirika.",
          "Jaribio la kuingia bila ruhusa kwenye zana za waendeshaji.",
        ],
      },
      {
        title: "Mipaka ya huduma",
        body: [
          "NGEMBA si huduma ya dharura moja kwa moja (polisi, zimamoto, ambulansi).",
          "Katika hatari ya papo hapo, piga nambari za dharura kwanza, kisha NGEMBA ikiwezekana.",
          "McBuleli inaweza kupunguza matumizi mabaya, bila kuzuia kiotomatiki dharura muhimu.",
        ],
      },
      {
        title: "Mawasiliano",
        body: [
          "Maswali kuhusu huduma: info@ngemba-rdc.org",
          "McBuleli: https://mcbuleli.com",
        ],
      },
    ],
  },
  lua: {
    title: "Mibeko ya kusadila",
    sections: [
      {
        title: "Nani udi kusala NGEMBA",
        body: [
          "NGEMBA i plateforme ya alerte ne orientation ya bantu, McBuleli udi kusala.",
          "I di mpo na muntu onso mu RDC, ke di te ya organisation moko kaka.",
          "Ba opérateurs partenaires bakoki kukuyangela ; nkombo public i McBuleli / NGEMBA.",
        ],
      },
      {
        title: "Kundima",
        body: [
          "Soki usadilaka NGEMBA, undima mibeko eyi.",
          "Soki undima te, tinda te alerte ku plateforme.",
        ],
      },
      {
        title: "Ndenge ya malamu",
        body: [
          "Yebisha makambo ya solo to mposa ya koyangela.",
          "Sadila nzela ya Momonisi, Ekole to Bantu ya moke, kadi tikala na kimia.",
          "Tala biloko ya lisalisi ne ya kukanga.",
        ],
      },
      {
        title: "Ndenge ke di te",
        body: [
          "Ba alerte ya lokuta to eyi mingi.",
          "Kokanga ba opérateurs, bantu to ba partenaires.",
          "Kokota ku biloko ya opérateurs soki ke di te na ndingisa.",
        ],
      },
      {
        title: "Nini NGEMBA ikoki te",
        body: [
          "NGEMBA ke di te service ya urgence directe (police, pompiers, SAMU).",
          "Soki udi na danger mbala moko, yebisha liboso numéros ya urgence, ne nsima NGEMBA soki ukoki.",
          "McBuleli ikoki kulimita usage ya mabe, kadi ikanga te urgence critique automatique.",
        ],
      },
      {
        title: "Contact",
        body: [
          "Mituna ya service : info@ngemba-rdc.org",
          "McBuleli : https://mcbuleli.com",
        ],
      },
    ],
  },
  kg: {
    title: "Mibeko ya kusadila",
    sections: [
      {
        title: "Nani udi kusala NGEMBA",
        body: [
          "NGEMBA i plateforme ya alerte ye orientation ya bantu, McBuleli udi kusala.",
          "I di mpo na muntu onso mu RDC, ke di te ya organisation moko kaka.",
          "Ba opérateurs partenaires bakoki kukuyangela ; nkombo public i McBuleli / NGEMBA.",
        ],
      },
      {
        title: "Kundima",
        body: [
          "Soki usadilaka NGEMBA, undima mibeko yiyi.",
          "Soki undima te, tinda te alerte ku plateforme.",
        ],
      },
      {
        title: "Ndenge ya mbote",
        body: [
          "Yebisha mambu ya solo to mposa ya koyangela.",
          "Sadila nzila ya Momonisi, Ekole to Bantu ya moke, kadi tikala na kimia.",
          "Tala biloko ya lisalisi ye ya kukanga.",
        ],
      },
      {
        title: "Ndenge ke di te",
        body: [
          "Ba alerte ya lokuta to yiyi mingi.",
          "Kokanga ba opérateurs, bantu to ba partenaires.",
          "Kokota ku biloko ya opérateurs soki ke di te na ndingisa.",
        ],
      },
      {
        title: "Nki NGEMBA ikoki te",
        body: [
          "NGEMBA ke di te service ya urgence directe (police, pompiers, SAMU).",
          "Soki udi na danger mbala moko, yebisha liboso numéros ya urgence, ye nsima NGEMBA soki ukoki.",
          "McBuleli ikoki kulimita usage ya mabe, kadi ikanga te urgence critique automatique.",
        ],
      },
      {
        title: "Contact",
        body: [
          "Mituna ya service : info@ngemba-rdc.org",
          "McBuleli : https://mcbuleli.com",
        ],
      },
    ],
  },
};

const CHARTER: Record<Locale, PageCopy> = {
  fr: {
    title: "Charte des opérateurs partenaires",
    sections: CHARTE_ONG_SECTIONS,
  },
  en: {
    title: "Partner operator charter",
    sections: [
      {
        title: "Partner operator mission",
        body: [
          "Welcome every person with respect and without judgment.",
          "Prioritise the person's immediate safety.",
          "Guide them toward competent resources and partners in the McBuleli / NGEMBA network.",
        ],
      },
      {
        title: "Confidentiality",
        body: [
          "Do not disclose case content outside NGEMBA and accredited partners.",
          "Do not share operator codes or access.",
          "Do not phone the person without their consent if an aggressor risk exists.",
        ],
      },
      {
        title: "Service quality",
        body: [
          "Critical urgency: response aimed within 5 minutes (opening hours).",
          "High urgency: within 30 minutes.",
          "Document every action in operator notes.",
        ],
      },
      {
        title: "Incident reporting",
        body: [
          "Any security breach or data leak: info@ngemba-rdc.org within 24 hours.",
          "Escalation: McBuleli (platform team) via info@ngemba-rdc.org or ceo@mcbuleli.org.",
        ],
      },
    ],
  },
  ln: {
    title: "Charte ya ba opérateurs partenaires",
    sections: [
      {
        title: "Mosala ya opérateur partenaire",
        body: [
          "Ndima moto nyonso na respect, te na jugement.",
          "Tia liboso kimia ya moto ntango moko.",
          "Yangela ye na biloko mpe ba partenaires ya réseau McBuleli / NGEMBA.",
        ],
      },
      {
        title: "Libomba",
        body: [
          "Tanga te makambo ya dossier libanda ya NGEMBA mpe ba partenaires oyo bazali na ndingisa.",
          "Kabaka te code to accès ya opérateur.",
          "Benga te na téléphone soki moto andimi te, soki ezali na risque ya agresseur.",
        ],
      },
      {
        title: "Qualité ya service",
        body: [
          "Urgence critique : prise en charge sous 5 minutes (heures ya ouverture).",
          "Urgence élevée : sous 30 minutes.",
          "Andika action nyonso na notes ya opérateur.",
        ],
      },
      {
        title: "Yebisa incident",
        body: [
          "Faille ya sécurité to fuite ya données : info@ngemba-rdc.org na nse ya 24 h.",
          "Escalade : McBuleli (équipe plateforme) na info@ngemba-rdc.org to ceo@mcbuleli.org.",
        ],
      },
    ],
  },
  sw: {
    title: "Katiba ya waendeshaji washirika",
    sections: [
      {
        title: "Dhamira ya opereta mshirika",
        body: [
          "Karibisha kila mtu kwa heshima bila hukumu.",
          "Weka usalama wa mtu kwanza.",
          "Mwelekeze kwa rasilimali na washirika wa mtandao wa McBuleli / NGEMBA.",
        ],
      },
      {
        title: "Faragha",
        body: [
          "Usitoe maudhui ya faili nje ya NGEMBA na washirika walioidhinishwa.",
          "Usishiriki msimbo au ufikiaji wa opereta.",
          "Usipige simu bila idhini yake ikiwa kuna hatari ya mshambuliaji.",
        ],
      },
      {
        title: "Ubora wa huduma",
        body: [
          "Dharura muhimu: majibu ndani ya dakika 5 (saa za kazi).",
          "Dharura ya juu: ndani ya dakika 30.",
          "Andika kila hatua katika maezo ya opereta.",
        ],
      },
      {
        title: "Ripoti ya tukio",
        body: [
          "Uvunjaji wowote wa usalama au uvujaji wa data: info@ngemba-rdc.org ndani ya saa 24.",
          "Kuongeza: McBuleli (timu ya jukwaa) kupitia info@ngemba-rdc.org au ceo@mcbuleli.org.",
        ],
      },
    ],
  },
  lua: {
    title: "Charte ya ba opérateurs partenaires",
    sections: [
      {
        title: "Mosala ya opérateur partenaire",
        body: [
          "Ndima muntu onso na respect, te na jugement.",
          "Tia liboso kimia ya muntu ntango moko.",
          "Kuyangela ye ku biloko ne ba partenaires ya réseau McBuleli / NGEMBA.",
        ],
      },
      {
        title: "Kubomba",
        body: [
          "Tanga te makambo ya dossier libanda ya NGEMBA ne ba partenaires na ndingisa.",
          "Kabaka te code to accès ya opérateur.",
          "Benga te na téléphone soki muntu andima te, soki i di na risque ya agresseur.",
        ],
      },
      {
        title: "Qualité ya service",
        body: [
          "Urgence critique : prise en charge sous 5 minutes (heures ya ouverture).",
          "Urgence élevée : sous 30 minutes.",
          "Andika action onso na notes ya opérateur.",
        ],
      },
      {
        title: "Yebisha incident",
        body: [
          "Faille ya sécurité to fuite ya données : info@ngemba-rdc.org na nse ya 24 h.",
          "Escalade : McBuleli (équipe plateforme) na info@ngemba-rdc.org to ceo@mcbuleli.org.",
        ],
      },
    ],
  },
  kg: {
    title: "Charte ya ba opérateurs partenaires",
    sections: [
      {
        title: "Mosala ya opérateur partenaire",
        body: [
          "Ndima muntu onso na respect, te na jugement.",
          "Tia liboso kimia ya muntu ntango moko.",
          "Kuyangela ye ku biloko ye ba partenaires ya réseau McBuleli / NGEMBA.",
        ],
      },
      {
        title: "Kubomba",
        body: [
          "Tanga te mambu ya dossier libanda ya NGEMBA ye ba partenaires na ndingisa.",
          "Kabaka te code to accès ya opérateur.",
          "Benga te na téléphone soki muntu andima te, soki i di na risque ya agresseur.",
        ],
      },
      {
        title: "Qualité ya service",
        body: [
          "Urgence critique : prise en charge sous 5 minutes (heures ya ouverture).",
          "Urgence élevée : sous 30 minutes.",
          "Andika action onso na notes ya opérateur.",
        ],
      },
      {
        title: "Yebisha incident",
        body: [
          "Faille ya sécurité to fuite ya données : info@ngemba-rdc.org na nse ya 24 h.",
          "Escalade : McBuleli (équipe plateforme) na info@ngemba-rdc.org to ceo@mcbuleli.org.",
        ],
      },
    ],
  },
};

const PAGES: Record<PageKey, Record<Locale, PageCopy>> = {
  resources: RESOURCES,
  prevent: PREVENT,
  privacy: PRIVACY,
  cgu: CGU,
  charter: CHARTER,
};

export function getStaticPage(page: PageKey, locale: Locale): PageCopy {
  const bucket = PAGES[page];
  return bucket[locale] ?? bucket.fr;
}

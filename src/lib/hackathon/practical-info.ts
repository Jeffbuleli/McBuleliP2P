/**
 * Infos pratiques participants - McBuleli Hackathon 2026 (1 jour).
 */
import {
  HACKATHON_DATES_LABEL_FR,
  HACKATHON_HOURS_LABEL_FR,
  HACKATHON_VENUE_SHORT,
} from "@/lib/hackathon/event-content";
import { HACKATHON_VENUE_SILIKIN } from "@/lib/hackathon/constants";
import { SUPPORT_EMAIL } from "@/lib/support-contact";

export type PracticalSection = {
  id: string;
  titleFr: string;
  titleEn: string;
  itemsFr: string[];
  itemsEn: string[];
};

export const HACKATHON_PRACTICAL_SECTIONS: PracticalSection[] = [
  {
    id: "when-where",
    titleFr: "Quand et où",
    titleEn: "When and where",
    itemsFr: [
      `${HACKATHON_DATES_LABEL_FR} · ${HACKATHON_HOURS_LABEL_FR}`,
      `${HACKATHON_VENUE_SILIKIN}`,
      `${HACKATHON_VENUE_SHORT} - hub d'innovation, Gombe, Kinshasa`,
      "Arrivée recommandée : 08h15 pour badges et networking",
    ],
    itemsEn: [
      `${HACKATHON_DATES_LABEL_FR} · ${HACKATHON_HOURS_LABEL_FR}`,
      `${HACKATHON_VENUE_SILIKIN}`,
      `${HACKATHON_VENUE_SHORT} - innovation hub, Gombe, Kinshasa`,
      "Recommended arrival: 8:15 AM for badges and networking",
    ],
  },
  {
    id: "bring",
    titleFr: "À apporter",
    titleEn: "What to bring",
    itemsFr: [
      "Laptop + chargeur (obligatoire pour le build)",
      "Agent IA installé - cursor.com recommandé",
      "Compte GitHub connecté",
      "Hotspot de secours si possible",
      "Badge QR (e-mail ou Mon espace) visible en permanence",
    ],
    itemsEn: [
      "Laptop + charger (required for the build)",
      "AI agent installed - cursor.com recommended",
      "GitHub account signed in",
      "Backup hotspot if possible",
      "QR badge (email or My hub) visible at all times",
    ],
  },
  {
    id: "wifi",
    titleFr: "WiFi et connectivité",
    titleEn: "WiFi and connectivity",
    itemsFr: [
      "WiFi Silikin Village - identifiants affichés sur place le jour J",
      "Prévoir un hotspot mobile en secours (build intensif)",
      "APIs sandbox : pawaPay, demo Binance - voir Mon espace et le bootcamp",
    ],
    itemsEn: [
      "Silikin Village WiFi - credentials posted on site on event day",
      "Bring mobile hotspot as backup (intensive build)",
      "Sandbox APIs: pawaPay, Binance demo - see My hub and bootcamp",
    ],
  },
  {
    id: "day-flow",
    titleFr: "Déroulé de la journée",
    titleEn: "Day flow",
    itemsFr: [
      "08h30 - Accueil et badges",
      "09h-10h20 - Talks partenaires modérés par McBuleli IA",
      "10h30 - Bootcamp Vibe Coding (Jeff Buleli)",
      "11h30 - Formation équipes et choix des défis (Mon espace)",
      "12h45-15h30 - Build intensif + mentorat partenaires",
      "16h00 - Mini Demo Day (pitches courts)",
      "16h40 - Délibération jury",
      "16h50 - Remise des prix et clôture",
    ],
    itemsEn: [
      "8:30 AM - Welcome and badges",
      "9:00-10:20 AM - Partner talks moderated by McBuleli IA",
      "10:30 AM - Vibe Coding bootcamp (Jeff Buleli)",
      "11:30 AM - Team formation and challenges (My hub)",
      "12:45-3:30 PM - Intensive build + partner mentoring",
      "4:00 PM - Mini Demo Day (short pitches)",
      "4:40 PM - Jury deliberation",
      "4:50 PM - Awards and closing",
    ],
  },
  {
    id: "tools",
    titleFr: "Outils participants",
    titleEn: "Participant tools",
    itemsFr: [
      "Mon espace : /hackathon/espace - équipe, livrables, mentorat",
      "Pass QR : /hackathon/pass/[code] - présentez à l'entrée",
      "Demande mentorat : depuis Mon espace (phase Build)",
      "Live salle : /hackathon/live - mur défis · prix · équipes · mentorat",
    ],
    itemsEn: [
      "My hub: /hackathon/espace - team, deliverables, mentoring",
      "QR pass: /hackathon/pass/[code] - show at the door",
      "Mentor request: from My hub (Build phase)",
      "Room live: /hackathon/live - wall: challenges · prizes · teams · mentoring",
    ],
  },
  {
    id: "rules",
    titleFr: "Règles et respect",
    titleEn: "Rules and respect",
    itemsFr: [
      "Respect du chrono et des autres équipes",
      "Badges visibles - contrôle entrée QR",
      "Propriété intellectuelle conservée par les équipes",
      "McBuleli peut communiquer sur les projets présentés (nom, démo)",
      "Comportement professionnel - exclusion en cas d'abus",
    ],
    itemsEn: [
      "Respect the schedule and other teams",
      "Badges visible - QR door check",
      "Teams retain intellectual property",
      "McBuleli may communicate about presented projects (name, demo)",
      "Professional conduct - exclusion in case of abuse",
    ],
  },
  {
    id: "contact",
    titleFr: "Contacts",
    titleEn: "Contacts",
    itemsFr: [
      `Support McBuleli : ${SUPPORT_EMAIL}`,
      "Équipe salle sur place pour badges, orientation mentors et ordre",
      "Urgence : signalez à l'équipe McBuleli ou Silikin Village",
    ],
    itemsEn: [
      `McBuleli support: ${SUPPORT_EMAIL}`,
      "Floor team on site for badges, mentor routing and order",
      "Emergency: notify McBuleli team or Silikin Village staff",
    ],
  },
];

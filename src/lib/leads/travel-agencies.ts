/**
 * Agences de voyage — première vague Kinshasa.
 * Contacts repris uniquement de sources publiques (annuaire FEC 2025,
 * sites des agences, annuaire moncongo.com). Aucun numéro inventé.
 * Commune déduite de l'adresse publiée. NVIDIA NIM (Mistral Large)
 * a servi à proposer le classement ; la commune finale suit l'adresse.
 */

export type LeadTier = "A" | "B" | "C";

export type TravelAgency = {
  id: string;
  name: string;
  province: "Kinshasa";
  commune: string;
  activity: string;
  address: string;
  phones: string[];
  emails: string[];
  website?: string;
  representative?: string;
  sources: { label: string; href: string }[];
  note?: string;
  tier: LeadTier;
};

export const DRC_PROVINCES = [
  "Kinshasa",
  "Kongo-Central",
  "Kwango",
  "Kwilu",
  "Mai-Ndombe",
  "Kasaï",
  "Kasaï-Central",
  "Kasaï-Oriental",
  "Lomami",
  "Sankuru",
  "Maniema",
  "Sud-Kivu",
  "Nord-Kivu",
  "Ituri",
  "Haut-Uele",
  "Bas-Uele",
  "Tshopo",
  "Mongala",
  "Équateur",
  "Tshuapa",
  "Tanganyika",
  "Haut-Lomami",
  "Lualaba",
  "Haut-Katanga",
] as const;

export const SCAN = {
  province: "Kinshasa" as const,
  scannedOn: "21 novembre 2026",
  fec: "Annuaire FEC 2025 (PDF public, fec-rdc.com)",
  model: "NVIDIA NIM · mistral-large",
};

export const TRAVEL_AGENCIES: TravelAgency[] = [
  {
    id: "acrep",
    name: "ACREP",
    province: "Kinshasa",
    commune: "Gombe",
    activity: "Agence de voyages",
    address: "Immeuble Rwindi, local 33A, 1287 boulevard du 30 Juin (face SONAS), Gombe",
    phones: ["+243 818 103 588", "+243 998 865 500"],
    emails: ["kkallo@yahoo.fr"],
    representative: "Guillaume Kabasele",
    sources: [
      { label: "Annuaire FEC 2025", href: "https://fec-rdc.com/download/annuaire-fec-2025/" },
      {
        label: "Fiche publique",
        href: "https://www.culturecongolaise.com/index.php/k2/item/4107-acrep-agence-de-voyage-et-tourisme",
      },
    ],
    note: "Le second numéro vient d'une fiche publique de 2023. L'annuaire FEC donne le premier.",
    tier: "A",
  },
  {
    id: "africa-travel",
    name: "Africa Travel",
    province: "Kinshasa",
    commune: "Gombe",
    activity: "Agence de voyages",
    address: "9, avenue du Port, Gombe",
    phones: ["+243 815 555 601"],
    emails: [],
    sources: [
      {
        label: "Moncongo",
        href: "https://www.moncongo.com/directory/tourisme-amp-voyages-29/agences-de-voyage-29-326",
      },
    ],
    tier: "B",
  },
  {
    id: "airtime",
    name: "Airtime Travels",
    province: "Kinshasa",
    commune: "Gombe",
    activity: "Agence de voyages",
    address: "Avenue Kasavubu n°3371, local 4, immeuble Le Bon Coin, Gombe",
    phones: ["+243 819 800 044"],
    emails: [],
    sources: [
      {
        label: "Moncongo",
        href: "https://www.moncongo.com/directory/tourisme-amp-voyages-29/agences-de-voyage-29-326",
      },
    ],
    tier: "B",
  },
  {
    id: "anavco",
    name: "ANAVCO",
    province: "Kinshasa",
    commune: "Kinshasa",
    activity: "Association (agences IATA)",
    address: "Siège indiqué à Kinshasa, adresse de bureau non publiée dans l'annuaire",
    phones: ["+243 818 103 588"],
    emails: ["kkallo@yahoo.fr"],
    representative: "Guillaume Kabasele",
    sources: [
      { label: "Annuaire FEC 2025", href: "https://fec-rdc.com/download/annuaire-fec-2025/" },
    ],
    note: "Association nationale des agences agréées IATA. L'annuaire republie le même contact qu'ACREP.",
    tier: "C",
  },
  {
    id: "asem",
    name: "ASEM",
    province: "Kinshasa",
    commune: "Gombe",
    activity: "Assistance au sol et agence de voyage",
    address: "6147, avenue Ngongo Lutete, Gombe",
    phones: ["+243 999 918 670"],
    emails: ["info1@asemrdc.com"],
    website: "https://www.asemrdc.com",
    representative: "Rashid Patel",
    sources: [
      { label: "Annuaire FEC 2025", href: "https://fec-rdc.com/download/annuaire-fec-2025/" },
    ],
    note: "Activité FEC : assistance au sol, transport aérien et agence de voyage.",
    tier: "A",
  },
  {
    id: "ats",
    name: "ATS",
    province: "Kinshasa",
    commune: "Gombe",
    activity: "Assistance aéroportuaire",
    address: "Local 19, hôtel Memling, Gombe — et aéroport de N'Djili",
    phones: ["+243 819 929 881"],
    emails: ["contact@ats-handling-rdc.com"],
    website: "https://www.ats-handling-rdc.com",
    representative: "Michel Tshefu Longanga",
    sources: [
      { label: "Annuaire FEC 2025", href: "https://fec-rdc.com/download/annuaire-fec-2025/" },
      {
        label: "Moncongo",
        href: "https://www.moncongo.com/directory/tourisme-amp-voyages-29/agences-de-voyage-29-326",
      },
    ],
    note: "Handling, pas un comptoir de billets. Gardé parce que l'annuaire tourisme le cite avec le Memling et N'Djili.",
    tier: "C",
  },
  {
    id: "btravel",
    name: "Btravel",
    province: "Kinshasa",
    commune: "Gombe",
    activity: "Agence de voyages et visas",
    address: "169, avenue Kasavubu, immeuble Triangle Davier, 2e niveau, local B5, Gombe",
    phones: ["+243 825 424 659", "+243 829 834 891"],
    emails: ["filsbak1@gmail.com"],
    sources: [
      {
        label: "contact.cd",
        href: "https://www.contact.cd/annuaires/agence-de-voyage-et-facilitation/btravel",
      },
    ],
    tier: "B",
  },
  {
    id: "cheta",
    name: "Cheta Travel",
    province: "Kinshasa",
    commune: "Gombe",
    activity: "Agence de voyages",
    address: "11, avenue Dracena et Haut Commandement, quartier Batetela, Gombe",
    phones: ["+243 858 550 081"],
    emails: [],
    sources: [
      {
        label: "Moncongo",
        href: "https://www.moncongo.com/directory/tourisme-amp-voyages-29/agences-de-voyage-29-326",
      },
    ],
    note: "L'annuaire l'écrit aussi Cheta Print - Cheta Travel.",
    tier: "B",
  },
  {
    id: "city-bond",
    name: "City Bond (Pavan) Travel & Tours",
    province: "Kinshasa",
    commune: "Gombe",
    activity: "Agence de voyages",
    address: "12, avenue Tombalbaye, à côté de l'hôtel New Belle Vie, Gombe",
    phones: ["+243 810 884 624"],
    emails: [],
    sources: [
      {
        label: "Moncongo",
        href: "https://www.moncongo.com/directory/tourisme-amp-voyages-29/agences-de-voyage-29-326",
      },
    ],
    note: "Même enseigne aussi à Lubumbashi et Goma. Ici, seulement le bureau de Kinshasa.",
    tier: "B",
  },
  {
    id: "concept-conciergerie",
    name: "Concept Conciergerie",
    province: "Kinshasa",
    commune: "Non publiée",
    activity: "Agence de voyage et immobilier",
    address: "Kinshasa — rue non publiée dans l'annuaire FEC",
    phones: ["+243 998 088 002"],
    emails: ["conciergeriecongo@outlook.fr"],
    representative: "Huguette Banza Malengo",
    sources: [
      { label: "Annuaire FEC 2025", href: "https://fec-rdc.com/download/annuaire-fec-2025/" },
    ],
    tier: "C",
  },
  {
    id: "congo-travel",
    name: "Congo Travel Service",
    province: "Kinshasa",
    commune: "Gombe",
    activity: "Agence IATA, affaires et hôtels",
    address: "Avenue du Plateau n°1, coin boulevard du 30 Juin, Gombe",
    phones: ["+243 815 000 422", "+243 825 555 426", "+243 999 998 404"],
    emails: ["accueil@congotravel.biz", "congotravelserv@micronet.cd"],
    website: "https://congotravel.biz/",
    representative: "Jean Marie Dernelle",
    sources: [
      { label: "Site", href: "https://congotravel.biz/" },
      { label: "Annuaire FEC 2025", href: "https://fec-rdc.com/download/annuaire-fec-2025/" },
      {
        label: "Moncongo",
        href: "https://www.moncongo.com/directory/tourisme-amp-voyages-29/agences-de-voyage-29-326",
      },
    ],
    note: "Site : +243 815 000 422 (international et protocole) et +243 825 555 426 (national). L'annuaire FEC 2025 donne encore +243 999 998 404 et congotravelserv@micronet.cd, 11 boulevard du 30 Juin. Bureau aussi à Lubumbashi.",
    tier: "A",
  },
  {
    id: "dream-holiday",
    name: "Dream Holiday",
    province: "Kinshasa",
    commune: "Gombe",
    activity: "Billets nationaux et internationaux",
    address: "Boulevard du 30 Juin, galerie Moulaert, Gombe",
    phones: ["+243 819 948 390"],
    emails: ["reservations@dreamholidays.cd"],
    website: "https://www.dreamholidays.cd/",
    representative: "Akbar Mulla",
    sources: [
      { label: "Annuaire FEC 2025", href: "https://fec-rdc.com/download/annuaire-fec-2025/" },
      { label: "Site", href: "https://www.dreamholidays.cd/" },
    ],
    tier: "A",
  },
  {
    id: "easyway",
    name: "EasyWay",
    province: "Kinshasa",
    commune: "Gombe",
    activity: "Agence de voyages",
    address: "Immeuble Kin Mazière, 1er étage, 1 avenue Tombalbaye, Gombe",
    phones: ["+243 820 000 930", "+243 845 002 104"],
    emails: ["info@easywayservice.cd", "easywayrdc@gmail.com"],
    sources: [
      {
        label: "Moncongo",
        href: "https://www.moncongo.com/directory/tourisme-amp-voyages-29/agences-de-voyage-29-326",
      },
    ],
    tier: "A",
  },
  {
    id: "excel",
    name: "Excel Voyage",
    province: "Kinshasa",
    commune: "Gombe",
    activity: "Agence de voyages",
    address: "Immeuble du 30 Juin, Gombe",
    phones: ["+243 851 332 200"],
    emails: [],
    sources: [
      {
        label: "Moncongo",
        href: "https://www.moncongo.com/directory/tourisme-amp-voyages-29/agences-de-voyage-29-326",
      },
    ],
    tier: "B",
  },
  {
    id: "first-travel",
    name: "First Travel & Tourisme",
    province: "Kinshasa",
    commune: "Gombe",
    activity: "Agence de voyages",
    address:
      "Deux bureaux : 100 avenue Tchad, galerie Pacha (face Memling) · boulevard du 30 Juin, immeuble Interfina (côté Rawbank)",
    phones: ["+243 843 921 327", "+243 849 915 555", "+243 999 319 901", "+243 820 329 594"],
    emails: ["galeb@firstravel.org", "tarek@firstravel.org"],
    sources: [
      {
        label: "Moncongo",
        href: "https://www.moncongo.com/directory/tourisme-amp-voyages-29/agences-de-voyage-29-326",
      },
    ],
    note: "Les deux adresses partagent les mêmes numéros et e-mails dans l'annuaire.",
    tier: "A",
  },
  {
    id: "gotech",
    name: "GOTECH Travels Service",
    province: "Kinshasa",
    commune: "Gombe",
    activity: "Billets, visas et assurance voyage",
    address: "47, avenue Roi Baudouin, quartier Lemera, Gombe",
    phones: ["+243 830 444 411", "+243 830 999 911"],
    emails: ["gotech@groupe-oxygene.cd", "contact@groupe-oxygene.cd", "congo.oxygene@gmail.com"],
    website: "https://groupe-oxygene.cd/gotech-travels-service/",
    sources: [
      { label: "Page GOTECH", href: "https://groupe-oxygene.cd/gotech-travels-service/" },
    ],
    tier: "A",
  },
  {
    id: "gts",
    name: "G.T.S. Express",
    province: "Kinshasa",
    commune: "Gombe",
    activity: "Agence de voyages",
    address: "89, croisement des avenues Wagenia et de l'Équateur, Gombe",
    phones: ["+243 999 945 074"],
    emails: [],
    sources: [
      {
        label: "Moncongo",
        href: "https://www.moncongo.com/directory/tourisme-amp-voyages-29/agences-de-voyage-29-326",
      },
    ],
    tier: "B",
  },
  {
    id: "jeffery",
    name: "Jeffery Travels",
    province: "Kinshasa",
    commune: "Gombe",
    activity: "Billets, groupes et voyages d'affaires",
    address: "Immeuble Mayumbe, 60 boulevard du 30 Juin, Gombe",
    phones: ["+243 818 887 777"],
    emails: ["jeffery@jefferytravels.com"],
    website: "https://jefferytravels.com/",
    representative: "Faid Vazir",
    sources: [
      { label: "Annuaire FEC 2025", href: "https://fec-rdc.com/download/annuaire-fec-2025/" },
      { label: "Site", href: "https://jefferytravels.com/" },
      {
        label: "Moncongo",
        href: "https://www.moncongo.com/directory/tourisme-amp-voyages-29/agences-de-voyage-29-326",
      },
    ],
    tier: "A",
  },
  {
    id: "kembo",
    name: "Kembo",
    province: "Kinshasa",
    commune: "Limete",
    activity: "Agence de voyage et agro",
    address: "101, 12e rue, Limete",
    phones: ["+243 892 793 266"],
    emails: ["bernisvirgelio@gmail.com"],
    representative: "Bernis Virgelio Mayamona",
    sources: [
      { label: "Annuaire FEC 2025", href: "https://fec-rdc.com/download/annuaire-fec-2025/" },
    ],
    note: "L'annuaire mélange agence de voyage et transformation de produits agricoles.",
    tier: "B",
  },
  {
    id: "sky",
    name: "Sky Agency",
    province: "Kinshasa",
    commune: "Gombe",
    activity: "Agence IATA",
    address: "56, avenue de la Justice, Gombe",
    phones: ["+243 900 008 883"],
    emails: ["contact@skyagency.cd"],
    website: "https://skyagency.cd/",
    sources: [
      { label: "Site", href: "https://skyagency.cd/contact" },
    ],
    note: "Absente du relevé voyage de l'annuaire FEC 2025. Contact repris du site.",
    tier: "A",
  },
  {
    id: "tamtam",
    name: "Tam Tam Guide RDC (Saraeli)",
    province: "Kinshasa",
    commune: "Kintambo",
    activity: "Tourisme",
    address: "3233, Likems, Kintambo",
    phones: ["+243 817 687 689"],
    emails: ["cecile.sombo@gmail.com"],
    representative: "Cécile Marie France Sombo Dibele",
    sources: [
      { label: "Annuaire FEC 2025", href: "https://fec-rdc.com/download/annuaire-fec-2025/" },
    ],
    tier: "B",
  },
  {
    id: "the-best",
    name: "The Best SARL",
    province: "Kinshasa",
    commune: "Gombe",
    activity: "Multi-services, volet voyage",
    address: "Vlisco, avenue Tombalbaye n°1165/1175, local 2, Gombe",
    phones: ["+243 816 927 972", "+243 988 076 118"],
    emails: ["thebestsarl2@gmail.com"],
    website: "https://thebest.cd/",
    sources: [{ label: "Site", href: "https://thebest.cd/" }],
    note: "Société de services (2022) qui vend aussi des billets, visas et circuits. Ce n'est pas une agence spécialisée.",
    tier: "C",
  },
];

export function agenciesForProvince(province: string): TravelAgency[] {
  return TRAVEL_AGENCIES.filter((row) => row.province === province);
}

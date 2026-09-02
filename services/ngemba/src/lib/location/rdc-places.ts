/**
 * Geographie nationale RDC - provinces + villes principales.
 * Pas limite a Kinshasa.
 */

export type PlaceNode = {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  /** Sous-lieux (communes / territoires / villes) */
  children?: PlaceNode[];
};

export const RDC_PROVINCES: PlaceNode[] = [
  {
    id: "kinshasa",
    name: "Kinshasa",
    lat: -4.325,
    lng: 15.312,
    children: [
      { id: "gombe", name: "Gombe", lat: -4.305, lng: 15.313 },
      { id: "ngaliema", name: "Ngaliema", lat: -4.327, lng: 15.266 },
      { id: "limete", name: "Limete", lat: -4.35, lng: 15.35 },
      { id: "lingwala", name: "Lingwala", lat: -4.32, lng: 15.3 },
      { id: "kalamu", name: "Kalamu", lat: -4.34, lng: 15.31 },
      { id: "lemba", name: "Lemba", lat: -4.39, lng: 15.32 },
      { id: "masina", name: "Masina", lat: -4.37, lng: 15.4 },
      { id: "ndjili", name: "Ndjili", lat: -4.4, lng: 15.38 },
      { id: "matete", name: "Matete", lat: -4.38, lng: 15.34 },
      { id: "bandalungwa", name: "Bandalungwa", lat: -4.345, lng: 15.29 },
      { id: "barumbu", name: "Barumbu", lat: -4.31, lng: 15.325 },
      { id: "bumbu", name: "Bumbu", lat: -4.36, lng: 15.3 },
      { id: "kasa-vubu", name: "Kasa-Vubu", lat: -4.33, lng: 15.3 },
      { id: "kimbanseke", name: "Kimbanseke", lat: -4.42, lng: 15.42 },
      { id: "kintambo", name: "Kintambo", lat: -4.32, lng: 15.27 },
      { id: "kisenso", name: "Kisenso", lat: -4.41, lng: 15.33 },
      { id: "makala", name: "Makala", lat: -4.36, lng: 15.31 },
      { id: "maluku", name: "Maluku", lat: -4.2, lng: 15.55 },
      { id: "mont-ngafula", name: "Mont-Ngafula", lat: -4.42, lng: 15.27 },
      { id: "ngaba", name: "Ngaba", lat: -4.37, lng: 15.33 },
      { id: "ngiri-ngiri", name: "Ngiri-Ngiri", lat: -4.34, lng: 15.3 },
      { id: "nsele", name: "Nsele", lat: -4.35, lng: 15.5 },
      { id: "selembao", name: "Selembao", lat: -4.37, lng: 15.28 },
    ],
  },
  {
    id: "haut-katanga",
    name: "Haut-Katanga",
    lat: -11.66,
    lng: 27.48,
    children: [
      { id: "lubumbashi", name: "Lubumbashi", lat: -11.66, lng: 27.48 },
      { id: "likasi", name: "Likasi", lat: -10.98, lng: 26.73 },
      { id: "kipushi", name: "Kipushi", lat: -11.76, lng: 27.25 },
      { id: "kambove", name: "Kambove", lat: -10.87, lng: 26.6 },
    ],
  },
  {
    id: "lualaba",
    name: "Lualaba",
    lat: -10.72,
    lng: 25.47,
    children: [
      { id: "kolwezi", name: "Kolwezi", lat: -10.72, lng: 25.47 },
      { id: "fungurume", name: "Fungurume", lat: -10.62, lng: 26.32 },
    ],
  },
  {
    id: "haut-lomami",
    name: "Haut-Lomami",
    lat: -8.74,
    lng: 24.99,
    children: [
      { id: "kamina", name: "Kamina", lat: -8.74, lng: 24.99 },
      { id: "bukama", name: "Bukama", lat: -9.2, lng: 25.85 },
    ],
  },
  {
    id: "tanganyika",
    name: "Tanganyika",
    lat: -5.95,
    lng: 29.2,
    children: [
      { id: "kalemie", name: "Kalemie", lat: -5.95, lng: 29.2 },
      { id: "kongolo", name: "Kongolo", lat: -5.35, lng: 27.0 },
    ],
  },
  {
    id: "kongo-central",
    name: "Kongo-Central",
    lat: -5.84,
    lng: 13.05,
    children: [
      { id: "matadi", name: "Matadi", lat: -5.84, lng: 13.05 },
      { id: "boma", name: "Boma", lat: -5.85, lng: 13.05 },
      { id: "muanda", name: "Muanda", lat: -5.93, lng: 12.35 },
      { id: "kisantu", name: "Kisantu", lat: -5.13, lng: 15.1 },
    ],
  },
  {
    id: "kwango",
    name: "Kwango",
    lat: -4.83,
    lng: 17.05,
    children: [{ id: "kenge", name: "Kenge", lat: -4.83, lng: 17.05 }],
  },
  {
    id: "kwilu",
    name: "Kwilu",
    lat: -5.03,
    lng: 18.82,
    children: [
      { id: "bandundu", name: "Bandundu", lat: -3.32, lng: 17.38 },
      { id: "kikwit", name: "Kikwit", lat: -5.04, lng: 18.82 },
    ],
  },
  {
    id: "mai-ndombe",
    name: "Mai-Ndombe",
    lat: -1.95,
    lng: 18.27,
    children: [
      { id: "inongo", name: "Inongo", lat: -1.95, lng: 18.27 },
      { id: "kiri", name: "Kiri", lat: -1.5, lng: 19.0 },
    ],
  },
  {
    id: "equateur",
    name: "Equateur",
    lat: 0.05,
    lng: 18.26,
    children: [
      { id: "mbandaka", name: "Mbandaka", lat: 0.05, lng: 18.26 },
      { id: "basankusu", name: "Basankusu", lat: 1.22, lng: 19.8 },
    ],
  },
  {
    id: "sud-ubangi",
    name: "Sud-Ubangi",
    lat: 3.25,
    lng: 19.77,
    children: [
      { id: "gemena", name: "Gemena", lat: 3.25, lng: 19.77 },
      { id: "libenge", name: "Libenge", lat: 3.65, lng: 18.63 },
    ],
  },
  {
    id: "nord-ubangi",
    name: "Nord-Ubangi",
    lat: 4.3,
    lng: 21.18,
    children: [{ id: "gbadolite", name: "Gbadolite", lat: 4.28, lng: 21.0 }],
  },
  {
    id: "mongala",
    name: "Mongala",
    lat: 2.15,
    lng: 21.52,
    children: [{ id: "lisala", name: "Lisala", lat: 2.15, lng: 21.52 }],
  },
  {
    id: "tshuapa",
    name: "Tshuapa",
    lat: -0.73,
    lng: 22.4,
    children: [{ id: "boende", name: "Boende", lat: -0.22, lng: 20.86 }],
  },
  {
    id: "tshopo",
    name: "Tshopo",
    lat: 0.52,
    lng: 25.2,
    children: [
      { id: "kisangani", name: "Kisangani", lat: 0.52, lng: 25.2 },
      { id: "isangi", name: "Isangi", lat: 0.78, lng: 24.27 },
    ],
  },
  {
    id: "bas-uele",
    name: "Bas-Uele",
    lat: 2.78,
    lng: 24.73,
    children: [{ id: "buta", name: "Buta", lat: 2.8, lng: 24.74 }],
  },
  {
    id: "haut-uele",
    name: "Haut-Uele",
    lat: 2.78,
    lng: 27.62,
    children: [
      { id: "isiro", name: "Isiro", lat: 2.77, lng: 27.62 },
      { id: "watsa", name: "Watsa", lat: 3.04, lng: 29.53 },
    ],
  },
  {
    id: "ituri",
    name: "Ituri",
    lat: 1.68,
    lng: 30.25,
    children: [
      { id: "bunia", name: "Bunia", lat: 1.56, lng: 30.25 },
      { id: "aru", name: "Aru", lat: 3.0, lng: 30.85 },
    ],
  },
  {
    id: "nord-kivu",
    name: "Nord-Kivu",
    lat: -1.68,
    lng: 29.23,
    children: [
      { id: "goma", name: "Goma", lat: -1.68, lng: 29.23 },
      { id: "beni", name: "Beni", lat: 0.49, lng: 29.47 },
      { id: "butembo", name: "Butembo", lat: 0.14, lng: 29.29 },
    ],
  },
  {
    id: "sud-kivu",
    name: "Sud-Kivu",
    lat: -2.5,
    lng: 28.87,
    children: [
      { id: "bukavu", name: "Bukavu", lat: -2.5, lng: 28.87 },
      { id: "uvira", name: "Uvira", lat: -3.4, lng: 29.14 },
      { id: "baraka", name: "Baraka", lat: -4.1, lng: 29.1 },
    ],
  },
  {
    id: "maniema",
    name: "Maniema",
    lat: -2.95,
    lng: 25.92,
    children: [
      { id: "kindu", name: "Kindu", lat: -2.95, lng: 25.92 },
      { id: "kalima", name: "Kalima", lat: -2.57, lng: 26.62 },
    ],
  },
  {
    id: "sankuru",
    name: "Sankuru",
    lat: -3.53,
    lng: 23.6,
    children: [{ id: "lodja", name: "Lodja", lat: -3.52, lng: 23.6 }],
  },
  {
    id: "kasai",
    name: "Kasai",
    lat: -5.9,
    lng: 22.42,
    children: [
      { id: "tshikapa", name: "Tshikapa", lat: -6.42, lng: 20.8 },
      { id: "ilebo", name: "Ilebo", lat: -4.33, lng: 20.58 },
    ],
  },
  {
    id: "kasai-central",
    name: "Kasai-Central",
    lat: -5.9,
    lng: 22.42,
    children: [
      { id: "kananga", name: "Kananga", lat: -5.9, lng: 22.42 },
      { id: "dibaya", name: "Dibaya", lat: -6.5, lng: 22.9 },
    ],
  },
  {
    id: "kasai-oriental",
    name: "Kasai-Oriental",
    lat: -6.15,
    lng: 23.6,
    children: [
      { id: "mbuji-mayi", name: "Mbuji-Mayi", lat: -6.15, lng: 23.6 },
      { id: "miabi", name: "Miabi", lat: -6.1, lng: 23.45 },
    ],
  },
  {
    id: "lomami",
    name: "Lomami",
    lat: -6.13,
    lng: 24.48,
    children: [
      { id: "kabinda", name: "Kabinda", lat: -6.13, lng: 24.48 },
      { id: "mwene-ditu", name: "Mwene-Ditu", lat: -7.0, lng: 23.45 },
    ],
  },
];

function distKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function findProvince(id: string): PlaceNode | undefined {
  return RDC_PROVINCES.find((p) => p.id === id);
}

export function resolvePlaceIds(provinceId: string, cityId?: string): {
  label: string;
  province: string;
  city: string | null;
  lat: number | null;
  lng: number | null;
} {
  const province = findProvince(provinceId);
  if (!province) {
    return {
      label: provinceId,
      province: provinceId,
      city: null,
      lat: null,
      lng: null,
    };
  }
  if (!cityId) {
    return {
      label: `${province.name}, RDC`,
      province: province.name,
      city: null,
      lat: province.lat ?? null,
      lng: province.lng ?? null,
    };
  }
  const city = province.children?.find((c) => c.id === cityId);
  if (!city) {
    return {
      label: `${province.name}, RDC`,
      province: province.name,
      city: null,
      lat: province.lat ?? null,
      lng: province.lng ?? null,
    };
  }
  return {
    label: `${city.name}, ${province.name}`,
    province: province.name,
    city: city.name,
    lat: city.lat ?? province.lat ?? null,
    lng: city.lng ?? province.lng ?? null,
  };
}

/** Plus proche ville/province pour GPS offline national. */
export function nearestPlace(lat: number, lng: number): {
  label: string;
  province: string;
  city: string | null;
  distanceKm: number;
} {
  let best = {
    label: "RDC",
    province: "RDC",
    city: null as string | null,
    distanceKm: Number.POSITIVE_INFINITY,
  };

  for (const p of RDC_PROVINCES) {
    if (p.lat != null && p.lng != null) {
      const d = distKm({ lat, lng }, { lat: p.lat, lng: p.lng });
      if (d < best.distanceKm) {
        best = {
          label: `${p.name}, RDC`,
          province: p.name,
          city: null,
          distanceKm: d,
        };
      }
    }
    for (const c of p.children ?? []) {
      if (c.lat == null || c.lng == null) continue;
      const d = distKm({ lat, lng }, { lat: c.lat, lng: c.lng });
      if (d < best.distanceKm) {
        best = {
          label: `${c.name}, ${p.name}`,
          province: p.name,
          city: c.name,
          distanceKm: d,
        };
      }
    }
  }
  return best;
}

/** @deprecated use RDC_PROVINCES - kept for older imports */
export const KINSHASA_COMMUNES =
  RDC_PROVINCES.find((p) => p.id === "kinshasa")?.children?.map((c) => c.name) ??
  [];

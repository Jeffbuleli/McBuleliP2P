/** Communes Kinshasa - meme base que SafeFind (CyberAlert). */
export const KINSHASA_COMMUNES = [
  "Bandalungwa",
  "Barumbu",
  "Bumbu",
  "Gombe",
  "Kalamu",
  "Kasa-Vubu",
  "Kimbanseke",
  "Kinshasa",
  "Kintambo",
  "Kisenso",
  "Lemba",
  "Limete",
  "Lingwala",
  "Makala",
  "Maluku",
  "Masina",
  "Matete",
  "Mont-Ngafula",
  "Ndjili",
  "Ngaba",
  "Ngaliema",
  "Ngiri-Ngiri",
  "Nsele",
  "Selembao",
] as const;

export type KinshasaCommune = (typeof KINSHASA_COMMUNES)[number];

/** Centroides approx pour fallback offline. */
export const KINSHASA_COMMUNE_CENTROIDS: Record<
  string,
  { lat: number; lng: number }
> = {
  Gombe: { lat: -4.305, lng: 15.313 },
  Ngaliema: { lat: -4.327, lng: 15.266 },
  Selembao: { lat: -4.37, lng: 15.28 },
  Limete: { lat: -4.35, lng: 15.35 },
  Lingwala: { lat: -4.32, lng: 15.3 },
  Kalamu: { lat: -4.34, lng: 15.31 },
  Lemba: { lat: -4.39, lng: 15.32 },
  Masina: { lat: -4.37, lng: 15.4 },
  Ndjili: { lat: -4.4, lng: 15.38 },
  Matete: { lat: -4.38, lng: 15.34 },
  Bandalungwa: { lat: -4.345, lng: 15.29 },
  Barumbu: { lat: -4.31, lng: 15.325 },
  Bumbu: { lat: -4.36, lng: 15.3 },
  "Kasa-Vubu": { lat: -4.33, lng: 15.3 },
  Kimbanseke: { lat: -4.42, lng: 15.42 },
  Kinshasa: { lat: -4.33, lng: 15.32 },
  Kintambo: { lat: -4.32, lng: 15.27 },
  Kisenso: { lat: -4.41, lng: 15.33 },
  Makala: { lat: -4.36, lng: 15.31 },
  Maluku: { lat: -4.2, lng: 15.55 },
  "Mont-Ngafula": { lat: -4.42, lng: 15.27 },
  Ngaba: { lat: -4.37, lng: 15.33 },
  "Ngiri-Ngiri": { lat: -4.34, lng: 15.3 },
  Nsele: { lat: -4.35, lng: 15.5 },
};

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

export function nearestCommune(lat: number, lng: number): {
  commune: string;
  distanceKm: number;
} {
  let best = { commune: "Kinshasa", distanceKm: Number.POSITIVE_INFINITY };
  for (const [name, c] of Object.entries(KINSHASA_COMMUNE_CENTROIDS)) {
    const d = distKm({ lat, lng }, c);
    if (d < best.distanceKm) best = { commune: name, distanceKm: d };
  }
  return best;
}

import { readEnvKey } from "@/lib/env";
import { nearestPlace, resolvePlaceIds } from "@/lib/location/rdc-places";

export type ResolvedLocation = {
  label: string;
  province: string | null;
  commune: string | null;
  quartier: string | null;
  lat: number | null;
  lng: number | null;
  precision: "exact" | "commune" | "approx" | "province";
  source: "geoapify" | "place" | "gps_offline";
};

export function geoapifyConfigured(): boolean {
  return Boolean(readEnvKey("GEOAPIFY_API_KEY"));
}

/** Reverse geocode GPS - Geoapify (SafeFind) ou fallback national offline. */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ResolvedLocation> {
  const key = readEnvKey("GEOAPIFY_API_KEY");
  if (key) {
    try {
      const url = new URL("https://api.geoapify.com/v1/geocode/reverse");
      url.searchParams.set("lat", String(lat));
      url.searchParams.set("lon", String(lng));
      url.searchParams.set("lang", "fr");
      url.searchParams.set("format", "json");
      url.searchParams.set("apiKey", key);
      const res = await fetch(url.toString(), { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as {
          results?: Array<{
            formatted?: string;
            suburb?: string;
            district?: string;
            county?: string;
            state?: string;
            city?: string;
            name?: string;
          }>;
        };
        const r = json.results?.[0];
        if (r) {
          const near = nearestPlace(lat, lng);
          const province = r.state || near.province;
          const city =
            r.city ||
            r.county ||
            r.suburb ||
            r.district ||
            near.city ||
            null;
          return {
            label: r.formatted || r.name || `${city ?? province}, RDC`,
            province,
            commune: city,
            quartier: r.suburb || r.district || null,
            lat,
            lng,
            precision: "exact",
            source: "geoapify",
          };
        }
      }
    } catch {
      // offline
    }
  }

  const near = nearestPlace(lat, lng);
  return {
    label: near.label,
    province: near.province,
    commune: near.city,
    quartier: null,
    lat,
    lng,
    precision: "approx",
    source: "gps_offline",
  };
}

export function resolveManualPlace(
  provinceId: string,
  cityId?: string,
): ResolvedLocation {
  const resolved = resolvePlaceIds(provinceId, cityId);
  return {
    label: resolved.label,
    province: resolved.province,
    commune: resolved.city,
    quartier: null,
    lat: resolved.lat,
    lng: resolved.lng,
    precision: resolved.city ? "commune" : "province",
    source: "place",
  };
}

/** @deprecated */
export function resolveCommuneOnly(commune: string): ResolvedLocation {
  return {
    label: `${commune}, RDC`,
    province: null,
    commune,
    quartier: null,
    lat: null,
    lng: null,
    precision: "commune",
    source: "place",
  };
}

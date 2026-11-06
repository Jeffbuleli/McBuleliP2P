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

function placeLabel(
  parts: Array<string | null | undefined>,
  fallback: string,
): string {
  const uniq: string[] = [];
  for (const part of parts) {
    const value = part?.trim();
    if (!value || uniq[uniq.length - 1] === value) continue;
    uniq.push(value);
  }
  return uniq.length ? uniq.join(", ") : fallback;
}

/** Reverse geocode GPS - rue si le relevé est serré, quartier sinon. */
export async function reverseGeocode(
  lat: number,
  lng: number,
  accuracyM?: number | null,
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
            housenumber?: string;
            street?: string;
            address_line1?: string;
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
          const tight = accuracyM == null || accuracyM <= 200;
          const door = [r.housenumber, r.street].filter(Boolean).join(" ");
          const base = placeLabel(
            [
              tight ? door || r.address_line1 : null,
              r.suburb || r.district,
              city,
              province,
            ],
            r.formatted || r.name || `${city ?? province}, RDC`,
          );
          const label =
            accuracyM != null ? `${base} · ±${Math.round(accuracyM)} m` : base;
          return {
            label,
            province,
            commune: city,
            quartier: r.suburb || r.district || null,
            lat,
            lng,
            precision:
              accuracyM != null && accuracyM <= 80
                ? "exact"
                : accuracyM != null && accuracyM <= 400
                  ? "commune"
                  : "exact",
            source: "geoapify",
          };
        }
      }
    } catch {
      // offline
    }
  }

  const near = nearestPlace(lat, lng);
  const base = near.label;
  return {
    label: accuracyM != null ? `${base} · ±${Math.round(accuracyM)} m` : base,
    province: near.province,
    commune: near.city,
    quartier: null,
    lat,
    lng,
    precision: accuracyM != null && accuracyM <= 80 ? "exact" : "approx",
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

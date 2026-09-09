import { readEnvKey } from "@/lib/env";

export type IpGeoResult = {
  label: string;
  city: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  lat: number | null;
  lng: number | null;
  source: "geoapify_ip" | "ipwho";
};

function isPrivateOrInvalidIp(ip: string): boolean {
  const v = ip.trim().toLowerCase();
  if (!v || v === "unknown" || v === "::1" || v === "127.0.0.1") return true;
  if (v.startsWith("10.") || v.startsWith("192.168.") || v.startsWith("127.")) {
    return true;
  }
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(v)) return true;
  if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80:")) {
    return true;
  }
  return false;
}

async function fromGeoapify(ip: string, key: string): Promise<IpGeoResult | null> {
  const url = new URL("https://api.geoapify.com/v1/ipinfo");
  url.searchParams.set("ip", ip);
  url.searchParams.set("apiKey", key);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    city?: { name?: string };
    state?: { name?: string };
    country?: { name?: string; iso_code?: string };
    location?: { latitude?: number; longitude?: number };
  };
  const city = json.city?.name ?? null;
  const region = json.state?.name ?? null;
  const country = json.country?.name ?? null;
  const countryCode = json.country?.iso_code ?? null;
  const lat =
    typeof json.location?.latitude === "number" ? json.location.latitude : null;
  const lng =
    typeof json.location?.longitude === "number"
      ? json.location.longitude
      : null;
  const parts = [city, region, country].filter(Boolean);
  if (!parts.length && lat == null) return null;
  return {
    label: parts.length ? parts.join(", ") : `${lat!.toFixed(2)}, ${lng!.toFixed(2)}`,
    city,
    region,
    country,
    countryCode,
    lat,
    lng,
    source: "geoapify_ip",
  };
}

/** Fallback HTTPS sans clé (approx ville / pays). */
async function fromIpWho(ip: string): Promise<IpGeoResult | null> {
  const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    success?: boolean;
    city?: string;
    region?: string;
    country?: string;
    country_code?: string;
    latitude?: number;
    longitude?: number;
  };
  if (json.success === false) return null;
  const city = json.city?.trim() || null;
  const region = json.region?.trim() || null;
  const country = json.country?.trim() || null;
  const countryCode = json.country_code?.trim() || null;
  const lat = typeof json.latitude === "number" ? json.latitude : null;
  const lng = typeof json.longitude === "number" ? json.longitude : null;
  const parts = [city, region, country].filter(Boolean);
  if (!parts.length && lat == null) return null;
  return {
    label: parts.length ? parts.join(", ") : `${lat!.toFixed(2)}, ${lng!.toFixed(2)}`,
    city,
    region,
    country,
    countryCode,
    lat,
    lng,
    source: "ipwho",
  };
}

/** Géolocalisation approximative (ville) depuis une IP publique. */
export async function resolveIpGeolocation(
  ip: string | null | undefined,
): Promise<IpGeoResult | null> {
  if (!ip || isPrivateOrInvalidIp(ip)) return null;
  const key = readEnvKey("GEOAPIFY_API_KEY");
  try {
    if (key) {
      const g = await fromGeoapify(ip.trim(), key);
      if (g) return g;
    }
    return await fromIpWho(ip.trim());
  } catch {
    return null;
  }
}

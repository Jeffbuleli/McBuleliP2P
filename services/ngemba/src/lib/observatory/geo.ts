import { RDC_PROVINCES } from "@/lib/location/rdc-places";
import { KINSHASA_COMMUNE_CENTROIDS } from "@/lib/location/communes";

export type ZoneGeo = {
  zoneKey: string;
  province: string | null;
  provinceId: string | null;
  lat: number | null;
  lng: number | null;
};

type IndexEntry = {
  name: string;
  nameNorm: string;
  province: string;
  provinceId: string;
  lat: number | null;
  lng: number | null;
  isProvince: boolean;
};

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const PLACE_INDEX: IndexEntry[] = (() => {
  const rows: IndexEntry[] = [];
  for (const p of RDC_PROVINCES) {
    rows.push({
      name: p.name,
      nameNorm: norm(p.name),
      province: p.name,
      provinceId: p.id,
      lat: p.lat ?? null,
      lng: p.lng ?? null,
      isProvince: true,
    });
    for (const c of p.children ?? []) {
      const kinCentroid =
        p.id === "kinshasa"
          ? KINSHASA_COMMUNE_CENTROIDS[c.name]
          : undefined;
      rows.push({
        name: c.name,
        nameNorm: norm(c.name),
        province: p.name,
        provinceId: p.id,
        lat: kinCentroid?.lat ?? c.lat ?? p.lat ?? null,
        lng: kinCentroid?.lng ?? c.lng ?? p.lng ?? null,
        isProvince: false,
      });
    }
  }
  return rows;
})();

export function listObservatoryProvinces(): Array<{
  id: string;
  name: string;
}> {
  return RDC_PROVINCES.map((p) => ({ id: p.id, name: p.name }));
}

function findByName(name: string, preferCity = true): IndexEntry | undefined {
  const n = norm(name);
  if (!n) return undefined;
  const matches = PLACE_INDEX.filter((e) => e.nameNorm === n);
  if (matches.length === 0) {
    return PLACE_INDEX.find(
      (e) => n.includes(e.nameNorm) || e.nameNorm.includes(n),
    );
  }
  if (preferCity) {
    return matches.find((e) => !e.isProvince) ?? matches[0];
  }
  return matches.find((e) => e.isProvince) ?? matches[0];
}

export function resolveZoneGeo(
  zoneKey: string,
  locationLabel?: string | null,
): ZoneGeo {
  const key = zoneKey.trim();
  const label = locationLabel?.trim() ?? "";

  const direct = findByName(key, true);
  if (direct && !direct.isProvince) {
    return {
      zoneKey: key,
      province: direct.province,
      provinceId: direct.provinceId,
      lat: direct.lat,
      lng: direct.lng,
    };
  }

  const parts = (label || key)
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    const city = findByName(parts[0]!, true);
    const provPart = findByName(parts[1]!, false);
    if (city && !city.isProvince) {
      return {
        zoneKey: key,
        province: city.province,
        provinceId: city.provinceId,
        lat: city.lat,
        lng: city.lng,
      };
    }
    if (provPart) {
      return {
        zoneKey: key,
        province: provPart.province,
        provinceId: provPart.provinceId,
        lat: provPart.lat,
        lng: provPart.lng,
      };
    }
  }

  if (direct) {
    return {
      zoneKey: key,
      province: direct.province,
      provinceId: direct.provinceId,
      lat: direct.lat,
      lng: direct.lng,
    };
  }

  return {
    zoneKey: key,
    province: null,
    provinceId: null,
    lat: null,
    lng: null,
  };
}

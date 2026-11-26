import { citizenAuthHeaders } from "@/lib/citizen/session-client";
import { trackPrecisePosition } from "@/lib/location/precise-gps";

const MAX_SEND_ACCURACY_M = 2500;

export type GpsBackfillResult =
  | "saved"
  | "already"
  | "unavailable"
  | "denied"
  | "too_wide"
  | "forbidden"
  | "failed";

/** Après création du dossier : le téléphone envoie le GPS quand la permission arrive. */
export function backfillSessionGps(
  sessionId: string,
  alreadyHasDeviceGps: boolean,
  onStatus?: (status: GpsBackfillResult) => void,
): void {
  if (alreadyHasDeviceGps) {
    onStatus?.("already");
    return;
  }
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    onStatus?.("unavailable");
    return;
  }

  const track = trackPrecisePosition({ maxWaitMs: 55_000, goodEnoughM: 60 });
  void track.done.then(async (fix) => {
    if (!fix) {
      onStatus?.("denied");
      return;
    }
    if (fix.accuracyM > MAX_SEND_ACCURACY_M) {
      onStatus?.("too_wide");
      return;
    }
    const result = await postSessionGps(sessionId, fix);
    onStatus?.(result);
    if (result === "forbidden" || result === "failed") {
      window.setTimeout(() => {
        void postSessionGps(sessionId, fix).then(onStatus);
      }, 1200);
      window.setTimeout(() => {
        void postSessionGps(sessionId, fix).then(onStatus);
      }, 4000);
    }
  });
}

export async function postSessionGps(
  sessionId: string,
  fix: { lat: number; lng: number; accuracyM: number },
): Promise<GpsBackfillResult> {
  try {
    const res = await fetch(`/api/alerts/${sessionId}/location`, {
      method: "POST",
      credentials: "include",
      headers: citizenAuthHeaders(sessionId),
      body: JSON.stringify({
        lat: fix.lat,
        lng: fix.lng,
        accuracyM: fix.accuracyM,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      persisted?: boolean;
      reason?: string;
    };
    if (res.status === 403) return "forbidden";
    if (!res.ok) return "failed";
    if (data.reason === "too_wide") return "too_wide";
    if (data.ok && data.persisted) return "saved";
    if (data.ok && !data.persisted) return "failed";
    return "failed";
  } catch {
    return "failed";
  }
}

export function hasDeviceGpsOnRecord(input: {
  lat: number | null;
  lng: number | null;
  locationSource: string | null;
  locationAccuracyM?: number | null;
}): boolean {
  if (input.lat == null || input.lng == null) return false;
  if (input.locationAccuracyM != null) return true;
  const src = input.locationSource ?? "";
  return /gps_precise|gps_wide|geoapify|gps_offline/.test(src);
}
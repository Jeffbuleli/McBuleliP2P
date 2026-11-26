import { trackPrecisePosition } from "@/lib/location/precise-gps";

/** Après création du dossier : le téléphone envoie le GPS quand la permission arrive. */
export function backfillSessionGps(
  sessionId: string,
  alreadyHasDeviceGps: boolean,
): void {
  if (alreadyHasDeviceGps) return;
  if (typeof navigator === "undefined" || !navigator.geolocation) return;

  const track = trackPrecisePosition({ maxWaitMs: 50_000, goodEnoughM: 55 });
  void track.done.then((fix) => {
    if (!fix || fix.accuracyM > 1200) return;
    void fetch(`/api/alerts/${sessionId}/location`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: fix.lat,
        lng: fix.lng,
        accuracyM: fix.accuracyM,
      }),
    });
  });
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
/** Relevé GPS frais. Ignore la position en cache (souvent ± quelques km). */

export type PreciseFix = {
  lat: number;
  lng: number;
  accuracyM: number;
};

export function readPrecisePosition(options?: {
  maxWaitMs?: number;
  goodEnoughM?: number;
}): Promise<PreciseFix | null> {
  const maxWaitMs = options?.maxWaitMs ?? 14_000;
  const goodEnoughM = options?.goodEnoughM ?? 35;

  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }

    let best: PreciseFix | null = null;
    let settled = false;
    let watchId: number | null = null;

    const finish = (value: PreciseFix | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      resolve(value);
    };

    const consider = (pos: GeolocationPosition) => {
      const raw = pos.coords.accuracy;
      const accuracyM = Number.isFinite(raw) ? Math.round(raw) : 99_999;
      const fix: PreciseFix = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracyM,
      };
      if (!best || fix.accuracyM < best.accuracyM) best = fix;
      if (fix.accuracyM <= goodEnoughM) finish(fix);
    };

    const onError = (err: GeolocationPositionError) => {
      if (err.code === err.PERMISSION_DENIED) finish(null);
    };

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: maxWaitMs,
    };

    watchId = navigator.geolocation.watchPosition(
      consider,
      onError,
      geoOptions,
    );
    navigator.geolocation.getCurrentPosition(consider, onError, geoOptions);

    const timer = window.setTimeout(() => finish(best), maxWaitMs);
  });
}

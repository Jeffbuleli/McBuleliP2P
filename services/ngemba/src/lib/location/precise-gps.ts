/** Relevé GPS frais. Ignore la position en cache (souvent ± quelques km). */

export type PreciseFix = {
  lat: number;
  lng: number;
  accuracyM: number;
};

export function trackPrecisePosition(options?: {
  maxWaitMs?: number;
  goodEnoughM?: number;
}): {
  best: () => PreciseFix | null;
  done: Promise<PreciseFix | null>;
  stop: () => void;
} {
  const maxWaitMs = options?.maxWaitMs ?? 45_000;
  const goodEnoughM = options?.goodEnoughM ?? 35;
  let best: PreciseFix | null = null;
  let watchId: number | null = null;
  let timer = 0;
  let settled = false;
  let resolveDone: (value: PreciseFix | null) => void = () => {};
  const done = new Promise<PreciseFix | null>((resolve) => {
    resolveDone = resolve;
  });

  const stop = () => {
    if (settled) return;
    settled = true;
    window.clearTimeout(timer);
    if (watchId != null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
    resolveDone(best);
  };

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    queueMicrotask(stop);
    return { best: () => null, done, stop };
  }

  const consider = (pos: GeolocationPosition) => {
    if (settled) return;
    const raw = pos.coords.accuracy;
    const accuracyM = Number.isFinite(raw) ? Math.round(raw) : 99_999;
    const fix: PreciseFix = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracyM,
    };
    if (!best || fix.accuracyM < best.accuracyM) best = fix;
    if (fix.accuracyM <= goodEnoughM) stop();
  };

  const onError = (err: GeolocationPositionError) => {
    if (err.code === err.PERMISSION_DENIED) {
      best = null;
      stop();
    }
  };

  const geoOptions: PositionOptions = {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: maxWaitMs,
  };

  watchId = navigator.geolocation.watchPosition(consider, onError, geoOptions);
  navigator.geolocation.getCurrentPosition(consider, onError, geoOptions);
  timer = window.setTimeout(stop, maxWaitMs);

  return { best: () => best, done, stop };
}

export function readPrecisePosition(options?: {
  maxWaitMs?: number;
  goodEnoughM?: number;
}): Promise<PreciseFix | null> {
  const track = trackPrecisePosition({
    maxWaitMs: options?.maxWaitMs ?? 14_000,
    goodEnoughM: options?.goodEnoughM ?? 35,
  });
  return track.done;
}

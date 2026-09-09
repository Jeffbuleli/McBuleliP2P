"use client";

import { vibrateDiscreteConfirm } from "@/lib/discrete/vibrate";
import { readLocalTrustedContacts } from "@/lib/trusted-contacts/client-store";

export type DiscreteFireResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function quickGps(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    let settled = false;
    const finish = (value: { lat: number; lng: number } | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(value);
    };
    const timer = window.setTimeout(() => finish(null), 2500);
    navigator.geolocation.getCurrentPosition(
      (p) =>
        finish({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
        }),
      () => finish(null),
      { enableHighAccuracy: false, timeout: 2200, maximumAge: 60_000 },
    );
  });
}

/**
 * Envoi immédiat d'une alerte discrète (geste / raccourci) -
 * pas d'écran de composition voyant.
 */
export async function fireDiscretePanicAlert(input: {
  locale: string;
}): Promise<DiscreteFireResult> {
  const pos = await quickGps();
  const trustedContacts = readLocalTrustedContacts();

  try {
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        message: "Alerte discrète - geste (danger extrême)",
        locale: input.locale,
        source: "shake",
        discrete: true,
        shareLocation: Boolean(pos),
        lat: pos?.lat ?? null,
        lng: pos?.lng ?? null,
        trustedContacts,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    if (!res.ok || !data.id) {
      return { ok: false, error: "create_failed" };
    }
    vibrateDiscreteConfirm();
    return { ok: true, id: data.id };
  } catch {
    return { ok: false, error: "network" };
  }
}

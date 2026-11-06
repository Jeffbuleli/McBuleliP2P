"use client";

import { vibrateDiscreteConfirm } from "@/lib/discrete/vibrate";
import { readPrecisePosition } from "@/lib/location/precise-gps";
import { readLocalTrustedContacts } from "@/lib/trusted-contacts/client-store";

export type DiscreteFireResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Alerte discrète. Attend un GPS frais (pas la position en cache),
 * puis envoie. L'IP reste le recours si le GPS est refusé.
 */
export async function fireDiscretePanicAlert(input: {
  locale: string;
}): Promise<DiscreteFireResult> {
  const trustedContacts = readLocalTrustedContacts();
  const pos = await readPrecisePosition({
    maxWaitMs: 10_000,
    goodEnoughM: 40,
  });

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
        accuracyM: pos?.accuracyM ?? null,
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

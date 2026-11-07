"use client";

import { vibrateDiscreteConfirm } from "@/lib/discrete/vibrate";
import { trackPrecisePosition } from "@/lib/location/precise-gps";
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
  // Démarre dans le geste. L'autorisation peut arriver après l'envoi du dossier.
  const track = trackPrecisePosition({ maxWaitMs: 45_000, goodEnoughM: 40 });
  await new Promise((resolve) => setTimeout(resolve, 2500));
  const first = track.best();
  const sent = first && first.accuracyM <= 1000 ? first : null;

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
        shareLocation: Boolean(sent),
        lat: sent?.lat ?? null,
        lng: sent?.lng ?? null,
        accuracyM: sent?.accuracyM ?? null,
        trustedContacts,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    if (!res.ok || !data.id) {
      track.stop();
      return { ok: false, error: "create_failed" };
    }
    const id = data.id;
    void track.done.then((fix) => {
      if (!fix || fix.accuracyM > 1000) return;
      if (sent && fix.accuracyM >= sent.accuracyM) return;
      void fetch(`/api/alerts/${id}/location`, {
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
    vibrateDiscreteConfirm();
    return { ok: true, id };
  } catch {
    track.stop();
    return { ok: false, error: "network" };
  }
}

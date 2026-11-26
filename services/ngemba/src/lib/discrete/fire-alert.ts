"use client";

import { persistSessionCitizenKey } from "@/lib/citizen/session-client";
import { vibrateDiscreteConfirm } from "@/lib/discrete/vibrate";
import { trackPrecisePosition } from "@/lib/location/precise-gps";
import { postSessionGps } from "@/lib/location/push-session-gps";
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
  const track = trackPrecisePosition({ maxWaitMs: 45_000, goodEnoughM: 80 });
  await new Promise((resolve) => setTimeout(resolve, 2500));
  const first = track.best();
  const sent = first && first.accuracyM <= 2500 ? first : null;
  console.info("[ngemba] gps discrete create", {
    hasFix: Boolean(sent),
    accuracyBucket: sent ? Math.min(2500, Math.round(sent.accuracyM / 100) * 100) : null,
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
        shareLocation: Boolean(sent),
        lat: sent?.lat ?? null,
        lng: sent?.lng ?? null,
        accuracyM: sent?.accuracyM ?? null,
        trustedContacts,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      sessionKey?: string;
    };
    if (!res.ok || !data.id) {
      track.stop();
      return { ok: false, error: "create_failed" };
    }
    const id = data.id;
    persistSessionCitizenKey(id, data.sessionKey);
    void track.done.then((fix) => {
      if (!fix || fix.accuracyM > 2500) {
        console.info("[ngemba] gps discrete backfill skip", {
          reason: fix ? "too_wide" : "no_fix",
        });
        return;
      }
      if (sent && fix.accuracyM >= sent.accuracyM) return;
      void postSessionGps(id, fix).then((status) => {
        console.info("[ngemba] gps discrete backfill", { status });
      });
    });
    vibrateDiscreteConfirm();
    return { ok: true, id };
  } catch {
    track.stop();
    return { ok: false, error: "network" };
  }
}

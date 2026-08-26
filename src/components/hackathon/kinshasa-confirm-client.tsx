"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  HkBtn,
  HkPage,
  HkSection,
  HkShell,
  useHkLocale,
} from "@/components/hackathon/hk-ui";
import { HackathonAtmosphere } from "@/components/hackathon/hackathon-atmosphere";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";

export function KinshasaConfirmClient({ token }: { token: string }) {
  const isFr = useHkLocale();
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);

  const confirm = useCallback(async () => {
    if (!token) {
      setError(isFr ? "Lien invalide." : "Invalid link.");
      setBusy(false);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithDeadline(
        "/api/hackathon/promo/kinshasa/confirm",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        },
        30_000,
      );
      const j = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        mode?: string;
        ticketCode?: string;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(
          typeof j.message === "string"
            ? j.message
            : isFr
              ? "Confirmation impossible."
              : "Could not confirm.",
        );
        return;
      }
      setMode(j.mode ?? null);
      setTicketCode(j.ticketCode ?? null);
    } catch {
      setError(isFr ? "Réseau indisponible." : "Network unavailable.");
    } finally {
      setBusy(false);
    }
  }, [token, isFr]);

  useEffect(() => {
    void confirm();
  }, [confirm]);

  return (
    <HkShell authReturnPath="/hackathon/promo/kinshasa">
      <HackathonAtmosphere variant="page" />
      <HkPage
        eyebrow="KINSHASA"
        title={
          isFr ? "Confirmation de place" : "Seat confirmation"
        }
        lede={
          isFr
            ? "Validation de votre place gratuite après le quiz."
            : "Validating your free seat after the quiz."
        }
      >
        {busy ? (
          <p className="text-sm text-[color:var(--hk-muted)]">
            {isFr ? "Confirmation en cours…" : "Confirming…"}
          </p>
        ) : error ? (
          <HkSection title={isFr ? "Échec" : "Failed"}>
            <p className="text-sm text-[color:var(--hk-muted)]">{error}</p>
            <div className="flex flex-wrap gap-2">
              <HkBtn onClick={() => void confirm()}>
                {isFr ? "Réessayer" : "Retry"}
              </HkBtn>
              <Link
                href="/hackathon/promo/kinshasa"
                className="inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-bold text-[color:var(--hk-accent)] ring-1 ring-[color:var(--hk-border)]"
              >
                {isFr ? "Retour au quiz" : "Back to quiz"}
              </Link>
            </div>
          </HkSection>
        ) : (
          <HkSection
            title={
              mode === "already_confirmed"
                ? isFr
                  ? "Déjà confirmé"
                  : "Already confirmed"
                : isFr
                  ? "Place confirmée"
                  : "Seat confirmed"
            }
          >
            <p className="text-sm leading-relaxed text-[color:var(--hk-muted)]">
              {isFr
                ? "Votre ticket QR et les orientations (matériel à apporter, déroulé) viennent d'être envoyés par e-mail."
                : "Your QR ticket and orientation (what to bring, day flow) were just emailed."}
            </p>
            {ticketCode ? (
              <a
                href={`/hackathon/pass/${encodeURIComponent(ticketCode)}`}
                className="inline-flex rounded-xl bg-[color:var(--hk-accent)] px-4 py-3 text-sm font-bold text-white"
              >
                {isFr ? "Ouvrir mon ticket" : "Open my ticket"}
              </a>
            ) : null}
            <Link
              href="/hackathon/infos"
              className="block text-sm font-bold text-[color:var(--hk-accent)] hover:underline"
            >
              {isFr ? "Infos pratiques →" : "Practical info →"}
            </Link>
          </HkSection>
        )}
      </HkPage>
    </HkShell>
  );
}

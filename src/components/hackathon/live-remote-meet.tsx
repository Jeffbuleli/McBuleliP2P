"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BRAND_LOGO_MARK_256 } from "@/lib/brand-logo";

type MeetJoinState =
  | { phase: "loading" }
  | { phase: "ready"; url: string }
  | { phase: "error"; message: string };

export function LiveRemoteMeet({
  meetSlug,
  partnerName,
}: {
  meetSlug: string;
  partnerName?: string | null;
}) {
  const [state, setState] = useState<MeetJoinState>({ phase: "loading" });
  const redirected = useRef(false);

  useEffect(() => {
    let cancelled = false;
    redirected.current = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/hackathon/live/meet-join?slug=${encodeURIComponent(meetSlug)}`,
          { cache: "no-store" },
        );
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok || !data?.url) {
          const message =
            data?.error === "meet_not_active"
              ? "Visio inactive · repassez en mode Meet depuis /hackathon/mc."
              : data?.error === "meet_closed"
                ? "Cette visio est terminée."
                : "Impossible d'ouvrir la visio pour le projecteur.";
          setState({ phase: "error", message });
          return;
        }

        setState({ phase: "ready", url: data.url as string });
        if (!redirected.current) {
          redirected.current = true;
          window.location.replace(data.url as string);
        }
      } catch {
        if (!cancelled) {
          setState({
            phase: "error",
            message: "Réseau indisponible · réessayez ou ouvrez la visio manuellement.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [meetSlug]);

  const title = partnerName ? `${partnerName} · visio` : "Visio partenaire";

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#050a08] px-4 text-white">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <Image
          src={BRAND_LOGO_MARK_256}
          alt=""
          width={56}
          height={56}
          unoptimized
          className="h-14 w-14 object-contain"
        />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
            McBuleli Meet · Live
          </p>
          <p className="mt-1 text-lg font-black">{title}</p>
        </div>

        {state.phase === "loading" || state.phase === "ready" ? (
          <>
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
            <p className="text-sm text-white/70">
              Ouverture de la visio en plein écran…
            </p>
            <p className="text-[11px] text-white/45">
              Le projecteur rejoint Jitsi directement (pas d&apos;iframe — sécurité
              McBuleli). Contrôle : /hackathon/mc
            </p>
          </>
        ) : (
          <>
            <p className="rounded-xl bg-rose-500/15 px-4 py-3 text-sm text-rose-100">
              {state.message}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href={`/meet/${meetSlug}/host`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-black"
              >
                Ouvrir Meet (hôte) ↗
              </Link>
              <Link
                href="/hackathon/live"
                className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white/80"
              >
                Retour Live
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

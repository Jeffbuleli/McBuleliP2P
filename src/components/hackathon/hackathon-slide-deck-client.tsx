"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type {
  HackathonDeck,
  SlideSessionPublic,
} from "@/lib/hackathon/slides/types";
import { HackathonSlideFrame } from "@/components/hackathon/hackathon-slide-frame";
import { HkBtn, HkStatusPill } from "@/components/hackathon/hk-ui";

async function postSlideAction(body: Record<string, unknown>) {
  const res = await fetch("/api/hackathon/slides", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

export function HackathonSlideDeckClient({
  deck,
  initialSession,
  mode,
}: {
  deck: HackathonDeck;
  initialSession: SlideSessionPublic | null;
  mode: "prepare" | "present";
}) {
  const [index, setIndex] = useState(() => {
    if (
      initialSession?.status === "live" &&
      initialSession.deckSlug === deck.slug
    ) {
      return Math.max(
        0,
        Math.min(initialSession.slideIndex, deck.slides.length - 1),
      );
    }
    return 0;
  });
  const [revealQuiz, setRevealQuiz] = useState(false);
  const [session, setSession] = useState(initialSession);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(mode === "prepare");

  const slide = deck.slides[index]!;
  const total = deck.slides.length;
  const isOnAir =
    session?.status === "live" && session.deckSlug === deck.slug;

  const goTo = useCallback(
    (next: number) => {
      const safe = Math.max(0, Math.min(next, total - 1));
      setIndex(safe);
      setRevealQuiz(false);
      setError(null);
    },
    [total],
  );

  const syncIndexIfLive = useCallback(
    async (nextIndex: number) => {
      if (!isOnAir) return;
      setBusy(true);
      const { ok, json, status } = await postSlideAction({
        action: "set_index",
        slideIndex: nextIndex,
      });
      setBusy(false);
      if (!ok) {
        setError(
          status === 401
            ? "Connexion requise pour contrôler le Live."
            : status === 403
              ? "Accès speaker / staff requis."
              : json.error ?? "Échec sync Live",
        );
        return;
      }
      setSession(json.session);
    },
    [isOnAir],
  );

  const next = useCallback(() => {
    const n = Math.min(index + 1, total - 1);
    if (n === index) return;
    goTo(n);
    void syncIndexIfLive(n);
  }, [goTo, index, syncIndexIfLive, total]);

  const prev = useCallback(() => {
    const n = Math.max(index - 1, 0);
    if (n === index) return;
    goTo(n);
    void syncIndexIfLive(n);
  }, [goTo, index, syncIndexIfLive]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen?.();
    } else {
      void document.exitFullscreen?.();
    }
  }, []);

  const goLive = useCallback(async () => {
    setBusy(true);
    setError(null);
    const { ok, json, status } = await postSlideAction({
      action: "go_live",
      deckSlug: deck.slug,
      slideIndex: index,
    });
    setBusy(false);
    if (!ok) {
      setError(
        status === 401
          ? "Connectez-vous pour passer On Air."
          : status === 403
            ? "Réservé aux speakers / partenaires / staff."
            : json.error ?? "Impossible de passer On Air",
      );
      return;
    }
    setSession(json.session);
  }, [deck.slug, index]);

  const endLive = useCallback(async () => {
    setBusy(true);
    setError(null);
    const { ok, json, status } = await postSlideAction({ action: "end_live" });
    setBusy(false);
    if (!ok) {
      setError(
        status === 401 || status === 403
          ? "Accès refusé."
          : json.error ?? "Échec",
      );
      return;
    }
    setSession(json.session);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        prev();
      } else if (e.key === " " || e.key === "Enter") {
        if (slide.layout === "quiz") {
          e.preventDefault();
          setRevealQuiz((v) => !v);
        }
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        if (isOnAir) void endLive();
        else void goLive();
      } else if (e.key === "n" || e.key === "N") {
        if (mode === "prepare") setShowNotes((v) => !v);
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
        void syncIndexIfLive(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(total - 1);
        void syncIndexIfLive(total - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    endLive,
    goLive,
    goTo,
    isOnAir,
    mode,
    next,
    prev,
    slide.layout,
    syncIndexIfLive,
    toggleFullscreen,
    total,
  ]);

  // Keep session status fresh while presenting.
  useEffect(() => {
    if (mode !== "present") return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/hackathon/slides?slug=${deck.slug}`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.session) setSession(json.session);
      } catch {
        /* ignore */
      }
    }, 4000);
    return () => clearInterval(poll);
  }, [deck.slug, mode]);

  const shellClass =
    mode === "present"
      ? "min-h-dvh bg-[color:var(--hk-page,#fafaf8)] px-3 py-3 sm:px-6 sm:py-5"
      : "mt-6";

  return (
    <div className={shellClass}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {mode === "present" ? (
            <Link
              href={`/hackathon/slides/${deck.slug}`}
              className="text-xs font-semibold text-[color:var(--hk-accent)] hover:underline"
            >
              ← Préparer
            </Link>
          ) : (
            <Link
              href="/hackathon/slides"
              className="text-xs font-semibold text-[color:var(--hk-accent)] hover:underline"
            >
              ← Decks
            </Link>
          )}
          <HkStatusPill tone={isOnAir ? "accent" : "neutral"}>
            {isOnAir ? "On Air" : "Hors antenne"}
          </HkStatusPill>
          <span className="text-xs tabular-nums text-[color:var(--hk-muted)]">
            {index + 1} / {total}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {mode === "prepare" ? (
            <Link href={`/hackathon/slides/${deck.slug}/present`}>
              <HkBtn variant="ghost">Présenter</HkBtn>
            </Link>
          ) : null}
          <Link href="/hackathon/live" target="_blank">
            <HkBtn variant="ghost">Ouvrir Live</HkBtn>
          </Link>
          {isOnAir ? (
            <HkBtn variant="ghost" disabled={busy} onClick={() => void endLive()}>
              Fin Live
            </HkBtn>
          ) : (
            <HkBtn disabled={busy} onClick={() => void goLive()}>
              Passer On Air
            </HkBtn>
          )}
          <HkBtn variant="ghost" onClick={toggleFullscreen}>
            Plein écran
          </HkBtn>
        </div>
      </div>

      {error ? (
        <p className="mx-auto mt-3 max-w-6xl text-sm text-rose-600">{error}</p>
      ) : null}

      <div className="mx-auto mt-4 max-w-6xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.28 }}
          >
            <HackathonSlideFrame
              slide={slide}
              revealQuiz={revealQuiz}
              compact={mode === "prepare"}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mx-auto mt-4 flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <HkBtn variant="ghost" disabled={index === 0} onClick={prev}>
            ← Précédent
          </HkBtn>
          <HkBtn disabled={index >= total - 1} onClick={next}>
            Suivant →
          </HkBtn>
          {slide.layout === "quiz" ? (
            <HkBtn variant="ghost" onClick={() => setRevealQuiz((v) => !v)}>
              {revealQuiz ? "Masquer réponse" : "Révéler réponse"}
            </HkBtn>
          ) : null}
        </div>
        <p className="text-[11px] text-[color:var(--hk-muted)]">
          ← → naviguer · Espace quiz · F plein écran · L On Air
        </p>
      </div>

      {mode === "prepare" ? (
        <div className="mx-auto mt-6 max-w-6xl space-y-4">
          {showNotes && slide.notes ? (
            <div className="rounded-2xl bg-[color:var(--hk-surface)] p-4 text-sm ring-1 ring-[color:var(--hk-border)]">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--hk-muted)]">
                Notes speaker
              </p>
              <p className="mt-2 text-[color:var(--hk-text)]">{slide.notes}</p>
            </div>
          ) : null}

          <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
            {deck.slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  goTo(i);
                  void syncIndexIfLive(i);
                }}
                className={`rounded-xl px-3 py-2.5 text-left text-xs ring-1 transition ${
                  i === index
                    ? "bg-[color:var(--hk-soft)] ring-[color:var(--hk-accent)]"
                    : "bg-[color:var(--hk-surface)] ring-[color:var(--hk-border)] hover:ring-[color:var(--hk-accent)]"
                }`}
              >
                <span className="font-bold tabular-nums text-[color:var(--hk-muted)]">
                  {i + 1}.
                </span>{" "}
                <span className="font-semibold text-[color:var(--hk-text)]">
                  {s.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

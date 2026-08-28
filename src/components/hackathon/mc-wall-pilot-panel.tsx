"use client";

import { useCallback, useEffect, useState } from "react";

type PitchQueue = {
  entries: Array<{ teamId: string; teamName: string }>;
  currentIndex: number;
  active: boolean;
  current: { teamId: string; teamName: string } | null;
  next: { teamId: string; teamName: string } | null;
  total: number;
  position: number;
};

type LiveSnap = {
  presence: { inside: number; outside: number; absent: number; paid: number };
  program: {
    labelFr: string;
    slot: { time: string; activityFr: string } | null;
  } | null;
  mentoringCount: number;
  teamCount: number;
};

function SwitchBtn({
  active,
  disabled,
  onClick,
  children,
  className = "",
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl px-3 py-3 text-sm font-black transition disabled:opacity-40 ${className} ${
        active
          ? "bg-white text-black shadow-sm"
          : "bg-white/10 text-white/85 hover:bg-white/15"
      }`}
    >
      {children}
    </button>
  );
}

/** Pilotage Mur depuis /mc : aperçu salle + file pitch (sans communiqués). */
export function McWallPilotPanel({
  busy,
  setBusy,
  setErr,
}: {
  busy: boolean;
  setBusy: (v: boolean) => void;
  setErr: (v: string | null) => void;
}) {
  const [snap, setSnap] = useState<LiveSnap | null>(null);
  const [queue, setQueue] = useState<PitchQueue | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [liveRes, pitchRes] = await Promise.all([
        fetch("/api/hackathon/live", { cache: "no-store" }),
        fetch("/api/hackathon/pitch-queue", { cache: "no-store" }),
      ]);
      const live = await liveRes.json().catch(() => null);
      const pitch = await pitchRes.json().catch(() => null);
      if (live && !live.error) {
        setSnap({
          presence: live.presence,
          program: live.program
            ? {
                labelFr: live.program.labelFr,
                slot: live.program.slot
                  ? {
                      time: live.program.slot.time,
                      activityFr: live.program.slot.activityFr,
                    }
                  : null,
              }
            : null,
          mentoringCount: Array.isArray(live.mentoring)
            ? live.mentoring.length
            : 0,
          teamCount: Array.isArray(live.teams) ? live.teams.length : 0,
        });
      }
      if (pitch?.queue) setQueue(pitch.queue);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 2500);
    return () => clearInterval(t);
  }, [refresh]);

  const pitchPost = async (payload: Record<string, unknown>) => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/hackathon/pitch-queue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(
          json?.error === "forbidden"
            ? "Session expirée · reconnectez-vous admin."
            : json?.error || "Erreur file pitch",
        );
        return;
      }
      if (json.queue) setQueue(json.queue);
      await refresh();
    } catch {
      setErr("Réseau indisponible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200/90">
          Pilote Mur
        </p>
        <p className="mt-0.5 text-[11px] text-white/55">
          Mur = défis · prix · partenaires · équipes · mentorat
        </p>
      </div>

      {snap ? (
        <div className="grid grid-cols-4 gap-1.5">
          <div className="rounded-xl bg-black/25 px-2 py-2 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/45">
              Présents
            </p>
            <p className="font-mono text-xl font-black tabular-nums text-white">
              {snap.presence.inside}
            </p>
          </div>
          <div className="rounded-xl bg-black/25 px-2 py-2 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/45">
              Mentorat
            </p>
            <p className="font-mono text-xl font-black tabular-nums text-white">
              {snap.mentoringCount}
            </p>
          </div>
          <div className="rounded-xl bg-black/25 px-2 py-2 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/45">
              Équipes
            </p>
            <p className="font-mono text-xl font-black tabular-nums text-white">
              {snap.teamCount}
            </p>
          </div>
          <div className="rounded-xl bg-black/25 px-2 py-2 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/45">
              Inscrits
            </p>
            <p className="font-mono text-xl font-black tabular-nums text-white">
              {snap.presence.paid}
            </p>
          </div>
        </div>
      ) : null}

      {snap?.program?.slot ? (
        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-white/45">
            Créneau mur
          </p>
          <p className="mt-0.5 text-sm font-bold text-white">
            {snap.program.slot.activityFr}
          </p>
          <p className="text-[11px] text-white/50">{snap.program.slot.time}</p>
        </div>
      ) : null}

      <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
        <p className="text-[9px] font-bold uppercase tracking-wider text-white/45">
          Contenu fixe Mur
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-white/60">
          4 défis · 5 prix · logos partenaires · repères pratiques. Pas de
          communiqués - les builders utilisent Mon espace.
        </p>
      </div>

      <div className="space-y-1.5 border-t border-white/10 pt-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
          File Mini Demo
        </p>
        {queue?.active && queue.current ? (
          <div className="rounded-xl bg-black/25 px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-amber-200/80">
              En scène · {queue.position}/{queue.total}
            </p>
            <p className="mt-0.5 text-base font-black text-white">
              {queue.current.teamName}
            </p>
            {queue.next ? (
              <p className="mt-1 text-[11px] text-white/50">
                Suivante · {queue.next.teamName}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-white/45">
            File inactive{queue?.total ? ` · ${queue.total} équipe(s)` : ""}.
          </p>
        )}
        <div className="grid grid-cols-2 gap-1.5">
          <SwitchBtn disabled={busy} onClick={() => void pitchPost({ action: "init" })}>
            Init soumis
          </SwitchBtn>
          <SwitchBtn
            active={queue?.active}
            disabled={busy}
            onClick={() =>
              void pitchPost({ action: "active", on: !queue?.active })
            }
          >
            File {queue?.active ? "ON" : "OFF"}
          </SwitchBtn>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <SwitchBtn
            disabled={busy || !queue?.total}
            onClick={() => void pitchPost({ action: "prev" })}
          >
            ←
          </SwitchBtn>
          <SwitchBtn
            disabled={busy || !queue?.current}
            onClick={() => void pitchPost({ action: "present_current" })}
            className="bg-emerald-400 text-black hover:bg-emerald-300"
          >
            Présenté →
          </SwitchBtn>
          <SwitchBtn
            disabled={busy || !queue?.total}
            onClick={() => void pitchPost({ action: "next" })}
          >
            →
          </SwitchBtn>
        </div>
      </div>
    </section>
  );
}

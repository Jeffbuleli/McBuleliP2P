"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KILELO_REMOTE_MEET_SLUG } from "@/lib/hackathon/mc-day";
import type { McSmartAction } from "@/lib/hackathon/mc-control-phases";
import {
  buildMcRemoteUiContext,
  projectorModeLabel,
  type McSlideRemote,
} from "@/lib/hackathon/mc-remote-context";
import type { McSessionPublic } from "@/lib/hackathon/mc-state";
import { McWallPilotPanel } from "@/components/hackathon/mc-wall-pilot-panel";

function formatRemain(ms: number) {
  if (ms <= 0) return "0:00";
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

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

type McPoll = {
  session: McSessionPublic;
  slides: McSlideRemote | null;
};

export function McOperatorConsole({
  initialSession,
  initialSlides,
}: {
  initialSession: McSessionPublic;
  initialSlides: McSlideRemote | null;
}) {
  const [session, setSession] = useState(initialSession);
  const [slides, setSlides] = useState(initialSlides);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const applyPoll = useCallback((data: McPoll) => {
    if (data.session) setSession(data.session);
    if (data.slides !== undefined) setSlides(data.slides);
  }, []);

  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const res = await fetch("/api/hackathon/mc", { cache: "no-store" });
        const data = await res.json();
        if (data?.session) applyPoll(data);
      } catch {
        /* ignore */
      }
    }, 1500);
    return () => clearInterval(t);
  }, [applyPoll]);

  const remainMs = useMemo(() => {
    if (!session.timerEndsAt) return null;
    return new Date(session.timerEndsAt).getTime() - now;
  }, [session.timerEndsAt, now]);

  const ui = useMemo(
    () => buildMcRemoteUiContext(session, slides),
    [session, slides],
  );

  const post = useCallback(
    async (body: Record<string, unknown>) => {
      setBusy(true);
      setErr(null);
      try {
        const res = await fetch("/api/hackathon/mc", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setErr(
            data?.error === "forbidden"
              ? "Session expirée · reconnectez-vous admin."
              : data?.error || "Erreur",
          );
          return;
        }
        if (data?.session) applyPoll(data);
      } catch {
        setErr("Réseau indisponible");
      } finally {
        setBusy(false);
      }
    },
    [applyPoll],
  );

  const runSmart = async (action: McSmartAction) => {
    await post({ action: "smart", id: action.id });
    if (action.id === "kilelo_visio") {
      window.open(`/meet/${KILELO_REMOTE_MEET_SLUG}/host`, "_blank", "noopener");
    }
  };

  const modeCols = Math.min(Math.max(ui.showProjectorModes.length, 2), 5);

  return (
    <div className="mx-auto max-w-lg space-y-3 px-3 py-4 pb-8 sm:max-w-xl sm:px-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/90">
            Télécommande Live
          </p>
          <p className="text-xs text-white/50">{ui.phaseLabel}</p>
        </div>
        <Link
          href="/hackathon/live"
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-white px-3 py-2 text-xs font-black text-black"
        >
          Live
        </Link>
      </header>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">
              {projectorModeLabel(session.projectorMode)}
              {session.meetSlug ? " · Meet" : ""}
              {ui.stepKind === "slide" ? " · On Air" : ""}
            </p>
            <p className="truncate text-sm font-bold text-white">
              {ui.statusLine}
            </p>
          </div>
          {ui.showChrono ? (
            <div className="shrink-0 text-right">
              <p className="font-mono text-2xl font-black tabular-nums text-white">
                {remainMs == null ? "—" : formatRemain(remainMs)}
              </p>
            </div>
          ) : null}
        </div>
        {err ? (
          <p className="mt-2 rounded-lg bg-rose-500/20 px-2 py-1.5 text-xs font-semibold text-rose-200">
            {err}
          </p>
        ) : null}
      </div>

      <section className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-3">
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${modeCols}, minmax(0, 1fr))`,
          }}
        >
          {ui.showProjectorModes.map((mode) => (
            <SwitchBtn
              key={mode}
              active={session.projectorMode === mode}
              disabled={busy}
              onClick={() => post({ action: "projector", mode })}
            >
              {projectorModeLabel(mode)}
            </SwitchBtn>
          ))}
        </div>
        {ui.showOnAirSlides ? (
          <SwitchBtn
            disabled={busy}
            onClick={() => post({ action: "go_live_slides" })}
            className="mt-2 w-full bg-emerald-400 text-black"
          >
            Slides · Passer On Air
          </SwitchBtn>
        ) : null}
        {ui.showEndSlides ? (
          <SwitchBtn
            disabled={busy}
            onClick={() => post({ action: "end_slides" })}
            className={
              ui.slidesAtEnd
                ? "mt-2 w-full bg-emerald-400 text-black"
                : "mt-2 w-full border border-white/20 bg-white/5 text-white/80"
            }
          >
            {ui.slidesAtEnd
              ? "Terminer · retour Live MC"
              : "Quitter slides · Live MC"}
          </SwitchBtn>
        ) : null}
        {session.meetSlug && session.projectorMode !== "meet" ? (
          <Link
            href={`/meet/${session.meetSlug}/host`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 flex w-full items-center justify-center rounded-xl border border-sky-400/35 bg-sky-400/10 py-3 text-xs font-bold text-sky-200"
          >
            Hôte Meet ↗ (optionnel · son salle)
          </Link>
        ) : null}
      </section>

      {ui.showWallControls ? (
        <McWallPilotPanel busy={busy} setBusy={setBusy} setErr={setErr} />
      ) : null}

      {ui.showCueNav ? (
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <div className="grid grid-cols-2 gap-1.5">
          <SwitchBtn disabled={busy} onClick={() => post({ action: "step", delta: -1 })}>
            {ui.stepPrevLabel}
          </SwitchBtn>
          <SwitchBtn
            disabled={busy}
            onClick={() => post({ action: "step", delta: 1 })}
            className="bg-emerald-400 text-black hover:bg-emerald-300"
          >
            {ui.stepNextLabel}
          </SwitchBtn>
        </div>

        {(ui.showVoice || ui.showChrono) && (
          <div
            className={`mt-2 grid gap-1.5 ${ui.showVoice && ui.showChrono ? "grid-cols-2" : "grid-cols-1"}`}
          >
            {ui.showVoice ? (
              <div className="grid grid-cols-2 gap-1.5">
                <SwitchBtn
                  active={session.voiceEnabled}
                  disabled={busy}
                  onClick={() =>
                    post({ action: "voice", on: !session.voiceEnabled })
                  }
                >
                  Voix {session.voiceEnabled ? "ON" : "OFF"}
                </SwitchBtn>
                <SwitchBtn
                  disabled={busy || !session.voiceEnabled}
                  onClick={() => post({ action: "voice_replay" })}
                >
                  Rejouer
                </SwitchBtn>
              </div>
            ) : null}
            {ui.showChrono ? (
              <div className="grid grid-cols-3 gap-1.5">
                <SwitchBtn
                  disabled={busy}
                  onClick={() =>
                    post({
                      action: "timer",
                      seconds: session.cue.timerSeconds ?? 600,
                    })
                  }
                >
                  {session.cue.timerSeconds
                    ? `${Math.round(session.cue.timerSeconds / 60)}'`
                    : "10'"}
                </SwitchBtn>
                <SwitchBtn
                  disabled={busy}
                  onClick={() => post({ action: "timer", seconds: 60 })}
                >
                  1&apos;
                </SwitchBtn>
                <SwitchBtn disabled={busy} onClick={() => post({ action: "clear_timer" })}>
                  Stop
                </SwitchBtn>
              </div>
            ) : null}
          </div>
        )}

        {ui.showHumanOverride ? (
          <SwitchBtn
            disabled={busy}
            onClick={() =>
              post({
                action: "human_override",
                on: !session.humanOverride,
              })
            }
            className={`mt-2 w-full ${
              session.humanOverride ? "bg-rose-500 text-white" : ""
            }`}
          >
            {session.humanOverride ? "Reprendre IA" : "Urgence humaine"}
          </SwitchBtn>
        ) : null}
      </section>
      ) : session.projectorMode === "meet" ? (
        <p className="rounded-xl border border-sky-400/25 bg-sky-400/10 px-3 py-2.5 text-center text-xs text-sky-100">
          Visio Live active · utilisez <span className="font-black">Visio OFF</span>{" "}
          pour couper Meet et revenir au MC.
        </p>
      ) : null}

      {ui.smartActions.length > 0 ? (
        <section className="space-y-1.5">
          {ui.smartActions.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={busy}
              onClick={() => void runSmart(action)}
              className={`flex w-full flex-col rounded-xl px-3 py-2.5 text-left ${
                action.variant === "sky"
                  ? "bg-sky-400 text-black"
                  : action.variant === "amber"
                    ? "bg-amber-400 text-black"
                    : "bg-[#1F6B43] text-white"
              }`}
            >
              <span className="text-sm font-black">{action.labelFr}</span>
              <span className="text-[11px] opacity-80">{action.hintFr}</span>
            </button>
          ))}
        </section>
      ) : null}

      {ui.jumpCues.length > 0 ? (
        <section className="grid gap-1">
          {ui.jumpCues.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={busy}
              onClick={() => post({ action: "goto", cueId: c.id })}
              className={`rounded-lg px-3 py-2 text-left text-xs ${
                c.id === session.cueId
                  ? "bg-emerald-400 font-black text-black"
                  : "bg-black/30 font-semibold text-white/75"
              }`}
            >
              {c.labelFr}
            </button>
          ))}
        </section>
      ) : null}

      <footer className="flex gap-2 pt-1">
        <Link
          href="/hackathon/scan"
          className="flex flex-1 items-center justify-center rounded-xl border border-white/15 py-3 text-xs font-semibold text-white/70"
        >
          Porte
        </Link>
        <SwitchBtn
          disabled={busy}
          onClick={() => post({ action: "reset" })}
          className="flex-1 text-xs font-semibold"
        >
          Standby
        </SwitchBtn>
        <Link
          href="/hackathon/ops"
          className="flex flex-1 items-center justify-center rounded-xl border border-white/15 py-3 text-xs font-semibold text-white/70"
        >
          Ops
        </Link>
      </footer>
    </div>
  );
}

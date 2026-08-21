"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { McCue } from "@/lib/hackathon/mc-day";
import { MC_MAGIC_PHRASES, MC_ROLE_CARDS } from "@/lib/hackathon/mc-day";
import type { McSessionPublic } from "@/lib/hackathon/mc-state";

function formatRemain(ms: number) {
  if (ms <= 0) return "0:00";
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function McOperatorConsole({
  initialSession,
  cues,
  initialKey,
  controlConfigured,
}: {
  initialSession: McSessionPublic;
  cues: McCue[];
  initialKey: string;
  controlConfigured: boolean;
}) {
  const [key, setKey] = useState(initialKey);
  const [session, setSession] = useState(initialSession);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const res = await fetch("/api/hackathon/mc", { cache: "no-store" });
        const data = await res.json();
        if (data?.session) setSession(data.session);
      } catch {
        /* ignore poll errors */
      }
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const remainMs = useMemo(() => {
    if (!session.timerEndsAt) return null;
    return new Date(session.timerEndsAt).getTime() - now;
  }, [session.timerEndsAt, now]);

  const post = useCallback(
    async (body: Record<string, unknown>) => {
      setBusy(true);
      setErr(null);
      try {
        const res = await fetch("/api/hackathon/mc", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-mc-key": key,
          },
          body: JSON.stringify({ ...body, key }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErr(
            data?.error === "forbidden"
              ? "Clé MC invalide (HACKATHON_MC_KEY)."
              : data?.error || "Erreur",
          );
          return;
        }
        if (data?.session) setSession(data.session);
      } catch {
        setErr("Réseau indisponible");
      } finally {
        setBusy(false);
      }
    },
    [key],
  );

  const stageHref = key
    ? `/hackathon/mc/stage?key=${encodeURIComponent(key)}`
    : "/hackathon/mc/stage";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-3 py-6 sm:px-4">
      <header className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/90">
          Console opérateur · 28 août
        </p>
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          McBuleli AI · MC
        </h1>
        <p className="max-w-2xl text-sm text-white/65">
          Tu pilotes l&apos;écran scène. Patty ouvre/clôture, Jeff = bootcamp,
          partenaires = talks + mentorat, salle = ordre.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <a
            href={stageHref}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-black"
          >
            Ouvrir écran scène
          </a>
          <button
            type="button"
            disabled={busy}
            onClick={() => post({ action: "reset" })}
            className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white/80"
          >
            Reset standby
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <label className="block text-xs font-semibold text-white/50">
          Clé opérateur {controlConfigured ? "" : "(dev : clé optionnelle)"}
        </label>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50"
          placeholder="HACKATHON_MC_KEY"
          autoComplete="off"
        />
        {err ? (
          <p className="mt-2 text-sm font-semibold text-rose-300">{err}</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200/80">
              Cue actuel · {session.cueIndex + 1}/{cues.length}
            </p>
            <h2 className="mt-1 text-xl font-black text-white">
              {session.cue.labelFr}
            </h2>
            <p className="mt-2 text-base leading-relaxed text-white/90">
              {session.cue.stageLineFr}
            </p>
            {session.cue.detailFr ? (
              <p className="mt-2 text-sm text-white/60">{session.cue.detailFr}</p>
            ) : null}
            {session.cue.humanScriptFr ? (
              <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-200/80">
                  Carte humaine
                </p>
                <p className="mt-1 text-sm leading-relaxed text-amber-50/95">
                  {session.cue.humanScriptFr}
                </p>
              </div>
            ) : null}
          </div>
          <div className="min-w-[7.5rem] rounded-xl border border-white/15 bg-black/40 px-3 py-3 text-center">
            <p className="text-[10px] font-bold uppercase text-white/45">Chrono</p>
            <p
              className={`mt-1 font-mono text-3xl font-black tabular-nums ${
                remainMs != null && remainMs <= 60_000
                  ? "text-rose-300"
                  : "text-white"
              }`}
            >
              {remainMs == null ? "—" : formatRemain(remainMs)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            type="button"
            disabled={busy}
            onClick={() => post({ action: "prev" })}
            className="rounded-xl bg-white/10 py-3 text-sm font-bold text-white"
          >
            ← Précédent
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => post({ action: "next" })}
            className="rounded-xl bg-white py-3 text-sm font-black text-black"
          >
            Suivant →
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              post({
                action: "timer",
                seconds: session.cue.timerSeconds ?? 10 * 60,
              })
            }
            className="rounded-xl bg-emerald-400 py-3 text-sm font-black text-black"
          >
            Chrono{" "}
            {session.cue.timerSeconds
              ? `${Math.round(session.cue.timerSeconds / 60)}'`
              : "10'"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => post({ action: "timer", seconds: 60 })}
            className="rounded-xl bg-amber-400 py-3 text-sm font-black text-black"
          >
            1 min
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => post({ action: "clear_timer" })}
            className="rounded-xl border border-white/20 py-3 text-sm font-semibold text-white/80"
          >
            Stop chrono
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              post({
                action: "human_override",
                on: !session.humanOverride,
              })
            }
            className={`rounded-xl py-3 text-sm font-black col-span-2 sm:col-span-1 ${
              session.humanOverride
                ? "bg-rose-500 text-white"
                : "bg-rose-500/20 text-rose-100"
            }`}
          >
            {session.humanOverride ? "Reprendre AI" : "Urgence humaine"}
          </button>
        </div>

        {session.nextCue ? (
          <p className="mt-3 text-sm text-white/50">
            Ensuite : <span className="text-white/80">{session.nextCue.labelFr}</span>
          </p>
        ) : null}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-white/70">Phrases magiques</h3>
        <ul className="space-y-2 text-sm text-white/80">
          <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            Patty → AI : « {MC_MAGIC_PHRASES.pattyToAi} »
          </li>
          <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            Humain → AI : « {MC_MAGIC_PHRASES.humanToAi} »
          </li>
          <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            AI → Jeff : « {MC_MAGIC_PHRASES.aiToJeff} »
          </li>
        </ul>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {MC_ROLE_CARDS.map((c) => (
          <article
            key={c.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <h3 className="text-sm font-black text-white">{c.titleFr}</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-white/65">
              {c.bodyFr.map((line) => (
                <li key={line}>· {line}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-bold text-white/70">Tous les cues</h3>
        <div className="max-h-[28rem] space-y-1 overflow-y-auto rounded-2xl border border-white/10 p-2">
          {cues.map((c, i) => {
            const active = i === session.cueIndex;
            return (
              <button
                key={c.id}
                type="button"
                disabled={busy}
                onClick={() => post({ action: "goto", cueId: c.id })}
                className={`flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left text-sm ${
                  active
                    ? "bg-emerald-400 text-black"
                    : "bg-transparent text-white/75 hover:bg-white/5"
                }`}
              >
                <span className="w-7 shrink-0 font-mono text-xs opacity-70">
                  {i + 1}
                </span>
                <span className="font-semibold">{c.labelFr}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

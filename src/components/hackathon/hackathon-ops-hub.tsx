"use client";

import Link from "next/link";
import {
  HACKATHON_DAY1_CHECKLIST_EN,
  HACKATHON_DAY1_CHECKLIST_FR,
  HACKATHON_SURFACES,
  day1PrimarySurfaces,
  type HackathonSurface,
  type HackathonSurfaceAudience,
} from "@/lib/hackathon/surfaces";
import { useHkLocale } from "@/components/hackathon/hk-ui";

const AUDIENCE_ORDER: HackathonSurfaceAudience[] = [
  "ops",
  "participant",
  "partner",
  "public",
  "internal",
];

function audienceLabel(
  a: HackathonSurfaceAudience,
  isFr: boolean,
): string {
  const map: Record<HackathonSurfaceAudience, [string, string]> = {
    ops: ["Équipe ops (Jour 1)", "Ops team (Day 1)"],
    participant: ["Participants", "Participants"],
    partner: ["Partenaires", "Partners"],
    public: ["Public", "Public"],
    internal: ["Interne / QA", "Internal / QA"],
  };
  return isFr ? map[a][0] : map[a][1];
}

function SurfaceCard({
  s,
  isFr,
  emphasize,
}: {
  s: HackathonSurface;
  isFr: boolean;
  emphasize?: boolean;
}) {
  return (
    <Link
      href={s.href}
      className={`block rounded-2xl border px-4 py-4 transition ${
        emphasize
          ? "border-emerald-400/40 bg-emerald-400/10 hover:bg-emerald-400/15"
          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
      }`}
    >
      <p className="text-sm font-black text-white">
        {isFr ? s.labelFr : s.labelEn}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-white/60">
        {isFr ? s.jobFr : s.jobEn}
      </p>
      <p className="mt-2 font-mono text-[11px] text-white/35">{s.href}</p>
    </Link>
  );
}

export function HackathonOpsHub() {
  const isFr = useHkLocale();
  const checklist = isFr
    ? HACKATHON_DAY1_CHECKLIST_FR
    : HACKATHON_DAY1_CHECKLIST_EN;
  const primary = day1PrimarySurfaces();

  const grouped = AUDIENCE_ORDER.map((audience) => ({
    audience,
    items: HACKATHON_SURFACES.filter(
      (s) => s.audience === audience && s.id !== "ops",
    ),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-dvh bg-[#050a08] text-white">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <header className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-400/90">
            {isFr ? "Équipe McBuleli · non indexé" : "McBuleli team · noindex"}
          </p>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            {isFr ? "Ops jour - Hackathon" : "Day ops - Hackathon"}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-white/65">
            {isFr
              ? "Point d'entrée unique. Projecteur = /hackathon/live. Builders = Mon espace. Partenaires = Chat. Infos = /hackathon/infos."
              : "Single entry point. Projector = /hackathon/live. Builders = My hub. Partners = Chat. Info = /hackathon/infos."}
          </p>
        </header>

        <section className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-5">
          <h2 className="text-sm font-black uppercase tracking-wider text-emerald-200">
            {isFr ? "Checklist Jour 1" : "Day 1 checklist"}
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-white/85">
            {checklist.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="text-sm font-bold text-white/70">
            {isFr ? "Priorité projecteur / téléphone" : "Projector / phone first"}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {primary.map((s) => (
              <SurfaceCard key={s.id} s={s} isFr={isFr} emphasize />
            ))}
          </div>
        </section>

        {grouped.map((g) => (
          <section key={g.audience}>
            <h2 className="text-sm font-bold text-white/70">
              {audienceLabel(g.audience, isFr)}
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {g.items.map((s) => (
                <SurfaceCard key={s.id} s={s} isFr={isFr} />
              ))}
            </div>
          </section>
        ))}

        <p className="pb-8 text-center text-xs text-white/35">
          <Link href="/hackathon" className="hover:text-white/60 hover:underline">
            ← /hackathon
          </Link>
        </p>
      </div>
    </div>
  );
}

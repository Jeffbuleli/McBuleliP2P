"use client";

import Link from "next/link";
import {
  RUNBOOK_HEADER,
  runbookChecklist,
  runbookMcCues,
  runbookPrimaryLinks,
  runbookProgramSlots,
  runbookRoleCards,
} from "@/lib/hackathon/runbook-content";

export function HackathonRunbookClient() {
  const checklist = runbookChecklist();
  const links = runbookPrimaryLinks();
  const slots = runbookProgramSlots();
  const cues = runbookMcCues();
  const roles = runbookRoleCards();

  return (
    <div className="min-h-dvh bg-white text-stone-900 print:min-h-0">
      <style>{`
        @media print {
          .runbook-no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      <div className="runbook-no-print border-b border-stone-200 bg-[#050a08] px-4 py-4 text-white">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold">Runbook ops - version imprimable</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-black"
            >
              Imprimer / PDF
            </button>
            <Link
              href="/hackathon/ops"
              className="rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold"
            >
              Retour ops
            </Link>
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-4 py-8 print:max-w-none print:px-8 print:py-6">
        <header className="border-b border-stone-300 pb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-800">
            {RUNBOOK_HEADER.date} - {RUNBOOK_HEADER.venue}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            {RUNBOOK_HEADER.title}
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Projecteur unique : https://mcbuleli.org/hackathon/live
          </p>
        </header>

        <section className="mt-8">
          <h2 className="text-lg font-black">Checklist Jour 1</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            {checklist.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </section>

        <section className="mt-8 break-inside-avoid">
          <h2 className="text-lg font-black">Liens prioritaires</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {links.map((l) => (
              <li key={l.href} className="rounded-lg border border-stone-200 px-3 py-2">
                <p className="font-bold">{l.label}</p>
                <p className="font-mono text-xs text-stone-500">{l.href}</p>
                <p className="text-stone-600">{l.job}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 break-inside-avoid">
          <h2 className="text-lg font-black">Programme horaire</h2>
          <table className="mt-3 w-full border-collapse text-sm">
            <tbody>
              {slots.map((slot) => (
                <tr key={slot.time} className="border-b border-stone-200">
                  <td className="py-2 pr-3 font-mono text-xs whitespace-nowrap text-stone-500">
                    {slot.time}
                  </td>
                  <td className="py-2">{slot.activityFr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-8 break-inside-avoid">
          <h2 className="text-lg font-black">Cues console MC</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {cues.map((c) => (
              <li key={c.id} className="flex flex-wrap gap-x-2 gap-y-0.5">
                <span className="font-bold">{c.label}</span>
                {c.window ? (
                  <span className="font-mono text-xs text-stone-500">{c.window}</span>
                ) : null}
                {c.projector ? (
                  <span className="text-xs text-emerald-800">projecteur: {c.projector}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 break-inside-avoid">
          <h2 className="text-lg font-black">Phrases magiques</h2>
          <ul className="mt-3 space-y-2 text-sm italic text-stone-700">
            <li>Patty vers AI : « {RUNBOOK_HEADER.magicPhrases.pattyToAi} »</li>
            <li>Humain vers AI : « {RUNBOOK_HEADER.magicPhrases.humanToAi} »</li>
            <li>AI vers Patty : « {RUNBOOK_HEADER.magicPhrases.aiToPatty} »</li>
            <li>AI vers Jeff : « {RUNBOOK_HEADER.magicPhrases.aiToJeff} »</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-black">Rôles scène</h2>
          <div className="mt-3 space-y-4">
            {roles.map((r) => (
              <div key={r.id} className="break-inside-avoid">
                <h3 className="font-bold">{r.titleFr}</h3>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-stone-700">
                  {r.bodyFr.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-10 border-t border-stone-300 pt-4 text-xs text-stone-500">
          McBuleli Hackathon 2026 - document généré depuis surfaces.ts et mc-day.ts
        </footer>
      </article>
    </div>
  );
}

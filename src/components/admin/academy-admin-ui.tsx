"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AcademyIcon, type AcademyIconName } from "@/components/academy/academy-icon";

export const EDITION_STATUS_FR: Record<string, string> = {
  draft: "Brouillon",
  open: "Ouvert",
  active: "En cours",
  closed: "Terminé",
};

export const ANALYTICS_VERB_FR: Record<string, string> = {
  enrolled: "Inscriptions",
  live_attended: "Présences live",
  quiz_passed: "Quiz réussis",
  module_completed: "Modules",
  replay_viewed: "Replays vus",
};

export function formatSessionWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LiveActionChip({
  href,
  icon,
  label,
  variant = "default",
}: {
  href: string;
  icon: AcademyIconName;
  label: string;
  variant?: "host" | "learner" | "default" | "app";
}) {
  const cls =
    variant === "host"
      ? "bg-amber-100 text-amber-950 border-amber-200"
      : variant === "learner"
        ? "bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)] border-[color:var(--fd-primary)]/20"
        : variant === "app"
          ? "border-2 border-[color:var(--fd-primary)] text-[color:var(--fd-primary)] bg-white"
          : "border border-[color:var(--fd-border)] bg-white text-[color:var(--fd-text)]";

  const inner = (
    <>
      <AcademyIcon name={icon} className="h-5 w-5 shrink-0" />
      <span className="text-[11px] font-extrabold leading-tight">{label}</span>
      <span className="text-[9px] opacity-60" aria-hidden>
        ↗
      </span>
    </>
  );

  const className = `flex min-w-[4.5rem] flex-1 flex-col items-center gap-1 rounded-xl border px-2 py-2.5 transition active:scale-[0.98] ${cls}`;

  if (href.startsWith("/")) {
    return (
      <Link href={href} target="_blank" className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {inner}
    </a>
  );
}

export function SectionHead({
  icon,
  title,
  hint,
}: {
  icon: AcademyIconName;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--fd-mint)]">
        <AcademyIcon name={icon} className="h-6 w-6" />
      </span>
      <div>
        <h2 className="text-sm font-extrabold text-[color:var(--fd-text)]">{title}</h2>
        {hint ? (
          <p className="mt-0.5 text-xs text-[color:var(--fd-muted)]">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

export function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
        ok ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-600" : "bg-amber-600"}`}
        aria-hidden
      />
      {label}
    </span>
  );
}

export function AdvancedBlock({
  summary,
  children,
}: {
  summary: string;
  children: ReactNode;
}) {
  return (
    <details className="mt-3 rounded-xl border border-dashed border-[color:var(--fd-border)] bg-stone-50/80">
      <summary className="cursor-pointer px-3 py-2 text-xs font-bold text-[color:var(--fd-muted)]">
        {summary}
      </summary>
      <div className="space-y-3 border-t border-[color:var(--fd-border)]/60 px-3 py-3">
        {children}
      </div>
    </details>
  );
}

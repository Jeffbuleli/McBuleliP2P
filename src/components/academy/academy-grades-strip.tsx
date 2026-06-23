"use client";

import Link from "next/link";
import { AcademyIcon } from "@/components/academy/academy-icon";

export function AcademyGradesStrip({
  fr,
  title,
  quizTitle,
  quizHref,
  quizPassed,
  quizAttempts,
  quizMaxAttempts,
  quizStartLabel,
  badges,
  verifyLabel,
}: {
  fr: boolean;
  title: string;
  quizTitle?: string;
  quizHref?: string;
  quizPassed?: boolean;
  quizAttempts?: number;
  quizMaxAttempts?: number;
  quizStartLabel: string;
  badges: { id: string; title: string; verifyCode: string }[];
  verifyLabel: string;
}) {
  if (!quizTitle && badges.length === 0) return null;

  return (
    <section className="rounded-2xl border border-[#305f33]/20 bg-gradient-to-br from-white to-[#e8f3ee]/40 p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <AcademyIcon name="tutor" className="h-5 w-5" />
        <h2 className="text-sm font-bold text-[color:var(--fd-text)]">{title}</h2>
      </div>

      {quizTitle && quizHref ? (
        <div className="mt-3 rounded-xl border border-[color:var(--fd-border)] bg-white p-3">
          <p className="text-xs font-bold text-[color:var(--fd-text)]">{quizTitle}</p>
          <p className="mt-0.5 text-[10px] text-[color:var(--fd-muted)]">
            {quizAttempts}/{quizMaxAttempts} {fr ? "tentatives" : "attempts"}
            {quizPassed ? (fr ? " · réussi" : " · passed") : ""}
          </p>
          <Link
            href={quizHref}
            className="mt-2 inline-flex rounded-lg bg-[#305f33] px-3 py-2 text-xs font-bold text-white"
          >
            {quizPassed ? "✓ " : ""}
            {quizStartLabel}
          </Link>
        </div>
      ) : null}

      {badges.length > 0 ? (
        <ul className={`space-y-2 ${quizTitle ? "mt-3" : "mt-3"}`}>
          {badges.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-2"
            >
              <span className="text-xs font-bold text-[color:var(--fd-text)]">{c.title}</span>
              <Link
                href={`/verify/${c.verifyCode}`}
                className="text-[10px] font-bold text-[#305f33]"
              >
                {verifyLabel} →
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

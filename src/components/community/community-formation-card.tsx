"use client";

import Link from "next/link";
import {
  formatFormationDate,
  type FormationPostMeta,
} from "@/lib/community/formation-post-meta";

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPlay({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 8.5v7l6-3.5-6-3.5z" fill="currentColor" />
    </svg>
  );
}

function IconLive({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 10a8 8 0 0116 0M7 10a5 5 0 0110 0M10 10a2 2 0 014 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="10" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function CommunityFormationCard({
  meta,
  fr,
  isLive,
}: {
  meta: FormationPostMeta;
  fr: boolean;
  isLive?: boolean;
}) {
  const when = formatFormationDate(meta.startDate, meta.timezone, fr);
  const live = isLive || meta.eventStatus === "LIVE";

  return (
    <div className="overflow-hidden rounded-2xl border border-[#305f33]/25 bg-white shadow-[0_4px_20px_rgba(48,95,51,0.12)]">
      <div className="relative bg-gradient-to-br from-[#305f33] via-[#3a7340] to-[#4a8f52] px-4 py-3 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/academy/event-live.svg"
              alt=""
              className="h-11 w-11 shrink-0 drop-shadow-sm"
            />
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">
                {fr ? "Formation" : "Training"}
              </span>
              {meta.editionTitle ? (
                <p className="mt-1 text-[11px] font-semibold text-[#d4eddc]">
                  {meta.editionTitle}
                </p>
              ) : null}
            </div>
          </div>
          {live ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-extrabold uppercase text-[#305f33]">
              <IconLive className="h-3.5 w-3.5" />
              LIVE
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <h3 className="text-base font-extrabold leading-snug text-[#0c0a09]">
          {meta.title}
        </h3>

        {meta.description?.trim() ? (
          <p className="text-sm leading-relaxed text-[#57534e] line-clamp-3">
            {meta.description.trim()}
          </p>
        ) : null}

        <ul className="space-y-2 text-sm text-[#44403c]">
          <li className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f3ee] text-[#305f33]">
              <IconCalendar className="h-4 w-4" />
            </span>
            <span className="font-medium">{when}</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f3ee] text-[#305f33]">
              <IconUser className="h-4 w-4" />
            </span>
            <span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#78716c]">
                {fr ? "Formateur" : "Trainer"}
              </span>
              <span className="block font-semibold">{meta.trainerName}</span>
            </span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f3ee] text-[#305f33]">
              <IconLive className="h-4 w-4" />
            </span>
            <span className="font-semibold text-[#305f33]">McBuleli Live</span>
          </li>
        </ul>

        <Link
          href={meta.joinPath}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#305f33] px-4 py-3 text-sm font-extrabold text-white shadow-md transition active:scale-[0.98]"
        >
          <IconPlay className="h-5 w-5 !text-white" />
          {live
            ? fr
              ? "Rejoindre le live"
              : "Join live"
            : fr
              ? "Voir le programme"
              : "View program"}
        </Link>
      </div>
    </div>
  );
}

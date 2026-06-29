"use client";

import Link from "next/link";
import { useState } from "react";
import { formatUpcomingSessionDate } from "@/lib/community/formation-post-meta";
import { academySessionContinueHref } from "@/lib/academy-route-paths";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";

export type UpcomingEventRow = {
  eventSlug: string;
  title: string;
  startsAt: string;
  editionSlug: string;
  programSlug: string;
  editionTitle: string;
  enrolled: boolean;
  priceUsdt: string | null;
  requiresKyc: boolean;
};

export function CommunityUpcomingEventCard({
  event,
  fr,
  onChanged,
}: {
  event: UpcomingEventRow;
  fr: boolean;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const sessionHref = academySessionContinueHref({
    editionSlug: event.editionSlug,
    programSlug: event.programSlug,
    sessionSlug: event.eventSlug,
  });

  async function enroll() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetchWithDeadline(
        "/api/academy/enroll",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            editionSlug: event.editionSlug,
            programSlug: event.programSlug,
          }),
        },
        20_000,
      );
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(mapEnrollError(j.error, fr));
        return;
      }
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function withdraw() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetchWithDeadline(
        "/api/academy/enroll",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            editionSlug: event.editionSlug,
            programSlug: event.programSlug,
          }),
        },
        20_000,
      );
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(mapWithdrawError(j.error, fr));
        return;
      }
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  const day = new Date(event.startsAt).getDate();
  const month = new Intl.DateTimeFormat(fr ? "fr-FR" : "en-US", {
    month: "short",
  })
    .format(new Date(event.startsAt))
    .replace(".", "");

  return (
    <li className="fd-card overflow-hidden">
      <div className="flex gap-3 p-4">
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-[#eaf5ee] ring-1 ring-sky-200/60">
          <span className="text-[9px] font-extrabold uppercase tracking-wide text-sky-700">
            {month}
          </span>
          <span className="text-lg font-black tabular-nums leading-none text-[#305f33]">
            {day}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-sky-800">
              {fr ? "À venir" : "Upcoming"}
            </span>
            {event.enrolled ? (
              <span className="rounded-full bg-[#eaf5ee] px-2 py-0.5 text-[9px] font-bold text-[#305f33]">
                {fr ? "Inscrit" : "Enrolled"}
              </span>
            ) : null}
          </div>
          <p className="text-sm font-bold leading-snug text-[#0c0a09]">{event.title}</p>
          <p className="mt-0.5 text-[11px] text-[#78716c]">{event.editionTitle}</p>
          <p className="mt-1 text-xs font-medium tabular-nums text-[#57534e]">
            {formatUpcomingSessionDate(event.startsAt, fr)}
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-t border-[#f0f4f2] bg-[#fafaf9] px-3 py-2.5">
        {event.enrolled ? (
          <>
            <Link
              href={sessionHref}
              className="flex flex-1 items-center justify-center rounded-xl bg-[#305f33] py-2.5 text-xs font-bold text-white"
            >
              {fr ? "Voir le live" : "View live"}
            </Link>
            <button
              type="button"
              disabled={busy}
              onClick={() => void withdraw()}
              className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-700 disabled:opacity-50"
            >
              {busy ? "…" : fr ? "Se retirer" : "Withdraw"}
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void enroll()}
            className="flex flex-1 items-center justify-center rounded-xl bg-[#305f33] py-2.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {busy ? "…" : fr ? "S'inscrire" : "Enroll"}
          </button>
        )}
      </div>

      {err ? <p className="px-4 pb-3 text-[11px] font-medium text-rose-600">{err}</p> : null}
    </li>
  );
}

function mapEnrollError(code: string | undefined, fr: boolean): string {
  if (code === "academy_insufficient_balance") {
    return fr ? "Solde USDT insuffisant" : "Insufficient USDT balance";
  }
  if (code === "academy_kyc_required") {
    return fr ? "KYC requis pour ce parcours" : "KYC required for this program";
  }
  return fr ? "Inscription impossible" : "Enrollment failed";
}

function mapWithdrawError(code: string | undefined, fr: boolean): string {
  if (code === "academy_withdraw_paid") {
    return fr
      ? "Parcours payant - contactez le support pour vous retirer"
      : "Paid program - contact support to withdraw";
  }
  if (code === "academy_withdraw_has_attendance") {
    return fr ? "Déjà présent à une session" : "Already attended a session";
  }
  if (code === "academy_not_enrolled") {
    return fr ? "Vous n'êtes pas inscrit" : "Not enrolled";
  }
  return fr ? "Retrait impossible" : "Withdraw failed";
}

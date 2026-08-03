"use client";

import Link from "next/link";
import {
  HkBtn,
  HkPage,
  HkSection,
  HkShell,
  HkStatusPill,
} from "@/components/hackathon/hk-ui";
import {
  DAMIENNE_LEARNER,
  DAMIENNE_MEET_SLUG,
  DAMIENNE_SESSIONS,
  damienneNextSession,
  damienneSessionDateLabel,
  type DamienneSession,
} from "@/lib/hackathon/damienne";

function SessionRow({
  session,
  isNext,
}: {
  session: DamienneSession;
  isNext: boolean;
}) {
  return (
    <li
      className={`rounded-2xl border px-4 py-3.5 ${
        isNext
          ? "border-[color:var(--hk-accent)] bg-[color:var(--hk-soft)]"
          : "border-[color:var(--hk-border)] bg-[color:var(--hk-surface)]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--hk-muted)]">
            Session {String(session.num).padStart(2, "0")} · {session.module}
            {isNext ? " · Prochaine" : ""}
          </p>
          <p className="mt-1 font-bold text-[color:var(--hk-text)]">
            {session.title}
          </p>
          <p className="mt-1 text-sm text-[color:var(--hk-muted)]">
            {damienneSessionDateLabel(session.startsAt)} ·{" "}
            {session.durationMinutes} min · {DAMIENNE_LEARNER.timezoneLabel}
          </p>
        </div>
        {isNext ? <HkStatusPill tone="accent">Ce soir / à venir</HkStatusPill> : null}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--hk-text)]">
        {session.focus}
      </p>
      <ul className="mt-2 space-y-1 text-sm text-[color:var(--hk-muted)]">
        {session.outcomes.map((o) => (
          <li key={o} className="flex gap-2">
            <span className="font-black text-[color:var(--hk-accent)]">-</span>
            <span>{o}</span>
          </li>
        ))}
      </ul>
    </li>
  );
}

export function DamienneHubClient({
  isStaff,
  displayName,
}: {
  isStaff: boolean;
  displayName: string;
}) {
  const next = damienneNextSession();
  const meetPath = `/meet/${DAMIENNE_MEET_SLUG}`;

  return (
    <HkShell authReturnPath="/hackathon/damienne">
      <HkPage
        eyebrow="Formation privée · Damienne"
        title={`Bonjour ${DAMIENNE_LEARNER.shortName}`}
        lede={`Programme personnalisé Vibe Coding + SDK Pi Network · 1 mois · 3×/semaine à 19h (${DAMIENNE_LEARNER.timezoneLabel}). Espace réservé à ${DAMIENNE_LEARNER.displayName} et à l'équipe McBuleli.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <HkStatusPill tone="ok">Payée · 1 mois</HkStatusPill>
            {isStaff ? <HkStatusPill tone="accent">Admin</HkStatusPill> : null}
          </div>
        }
      >
        <HkSection
          title="Objectif du mois"
          hint="Même esprit que le Hackathon McBuleli — en format 1:1 mentoré."
        >
          <ul className="space-y-2 text-sm text-[color:var(--hk-text)]">
            <li className="flex gap-2">
              <span className="font-black text-[color:var(--hk-accent)]">-</span>
              Apprendre à programmer avec l&apos;IA (Vibe Coding)
            </li>
            <li className="flex gap-2">
              <span className="font-black text-[color:var(--hk-accent)]">-</span>
              Construire une vraie application de A à Z
            </li>
            <li className="flex gap-2">
              <span className="font-black text-[color:var(--hk-accent)]">-</span>
              Intégrer le SDK Pi Network (auth & paiements) en tant que pioneer
            </li>
            <li className="flex gap-2">
              <span className="font-black text-[color:var(--hk-accent)]">-</span>
              Présenter une démo finale le 2 septembre 2026
            </li>
          </ul>
          <p className="mt-3 text-xs text-[color:var(--hk-muted)]">
            Connectée en tant que {displayName}.
          </p>
        </HkSection>

        <HkSection
          title="Salle McBuleli Meet"
          hint="Lien privé — ne pas partager. Compte McBuleli requis."
          action={
            <div className="flex flex-wrap gap-2">
              <Link href={`${meetPath}/join`}>
                <HkBtn>Rejoindre la session</HkBtn>
              </Link>
              {isStaff ? (
                <Link href={`${meetPath}/host`}>
                  <HkBtn variant="ghost">Mode hôte</HkBtn>
                </Link>
              ) : null}
            </div>
          }
        >
          {next ? (
            <p className="text-sm text-[color:var(--hk-text)]">
              Prochaine session :{" "}
              <strong>{next.title}</strong> —{" "}
              {damienneSessionDateLabel(next.startsAt)}.
            </p>
          ) : null}
          <p className="mt-2 text-xs text-[color:var(--hk-muted)]">
            Landing :{" "}
            <Link
              href={meetPath}
              className="font-semibold text-[color:var(--hk-accent)] hover:underline"
            >
              mcbuleli.org{meetPath}
            </Link>
          </p>
        </HkSection>

        <HkSection
          title="Parcours (14 sessions)"
          hint="Lundi · Mercredi · Vendredi · 19h00 Porto-Novo"
        >
          <ol className="space-y-3">
            {DAMIENNE_SESSIONS.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                isNext={next?.id === s.id}
              />
            ))}
          </ol>
        </HkSection>

        <HkSection title="Ressources">
          <ul className="space-y-2 text-sm text-[color:var(--hk-text)]">
            <li className="flex gap-2">
              <span className="font-black text-[color:var(--hk-accent)]">-</span>
              <span>
                Slides masterclass Vibe Coding :{" "}
                <Link
                  href="/hackathon/slides/vibe-coding-masterclass"
                  className="font-semibold text-[color:var(--hk-accent)] hover:underline"
                >
                  /hackathon/slides/vibe-coding-masterclass
                </Link>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-black text-[color:var(--hk-accent)]">-</span>
              Support : hi@mcbuleli.org · Mentorat CEO : ceo@mcbuleli.org
            </li>
          </ul>
        </HkSection>
      </HkPage>
    </HkShell>
  );
}

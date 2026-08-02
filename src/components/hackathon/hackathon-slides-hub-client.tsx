"use client";

import Link from "next/link";
import type {
  HackathonDeckMeta,
  SlideSessionPublic,
} from "@/lib/hackathon/slides/types";
import {
  HkBtn,
  HkPage,
  HkSection,
  HkShell,
  HkStatusPill,
  useHkLocale,
} from "@/components/hackathon/hk-ui";

export function HackathonSlidesHubClient({
  decks,
  session,
}: {
  decks: HackathonDeckMeta[];
  session: SlideSessionPublic | null;
}) {
  const isFr = useHkLocale();
  const live = session?.status === "live";

  return (
    <HkShell authReturnPath="/hackathon/slides">
      <HkPage
        eyebrow="McBuleli Slides"
        title={isFr ? "Préparer & présenter" : "Prepare & present"}
        lede={
          isFr
            ? "Decks speakers pour le bootcamp. Répétez ici, puis diffusez sur le mur Live."
            : "Speaker decks for the bootcamp. Rehearse here, then push to the Live wall."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {live ? (
              <HkStatusPill tone="accent">On Air</HkStatusPill>
            ) : (
              <HkStatusPill tone="neutral">
                {isFr ? "Hors antenne" : "Off air"}
              </HkStatusPill>
            )}
            <Link href="/hackathon/live">
              <HkBtn variant="ghost">Live</HkBtn>
            </Link>
          </div>
        }
      >
        {live && session?.deckSlug ? (
          <HkSection
            title={isFr ? "Diffusion en cours" : "Now presenting"}
            hint={
              isFr
                ? `${session.deckSlug} · slide ${(session.slideIndex ?? 0) + 1}${
                    session.speakerLabel ? ` · ${session.speakerLabel}` : ""
                  }`
                : `${session.deckSlug} · slide ${(session.slideIndex ?? 0) + 1}${
                    session.speakerLabel ? ` · ${session.speakerLabel}` : ""
                  }`
            }
            action={
              <Link href={`/hackathon/slides/${session.deckSlug}/present`}>
                <HkBtn>Contrôler</HkBtn>
              </Link>
            }
          >
            <p className="text-sm text-[color:var(--hk-muted)]">
              {isFr
                ? "Le projecteur /hackathon/live affiche la slide courante."
                : "The /hackathon/live projector shows the current slide."}
            </p>
          </HkSection>
        ) : null}

        <div className="grid gap-4">
          {decks.map((d) => (
            <HkSection
              key={d.slug}
              title={isFr ? d.titleFr : d.titleEn}
              hint={isFr ? d.descriptionFr : d.descriptionEn}
              action={
                <div className="flex flex-wrap gap-2">
                  <Link href={`/hackathon/slides/${d.slug}`}>
                    <HkBtn variant="ghost">
                      {isFr ? "Préparer" : "Prepare"}
                    </HkBtn>
                  </Link>
                  <Link href={`/hackathon/slides/${d.slug}/present`}>
                    <HkBtn>{isFr ? "Présenter" : "Present"}</HkBtn>
                  </Link>
                </div>
              }
            >
              <ul className="space-y-1.5 text-sm text-[color:var(--hk-text)]">
                <li className="flex gap-2">
                  <span className="font-bold text-[color:var(--hk-accent)]">
                    -
                  </span>
                  {isFr ? d.moduleLabelFr : d.moduleLabelEn}
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-[color:var(--hk-accent)]">
                    -
                  </span>
                  ~{d.estimatedMinutes} min
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-[color:var(--hk-accent)]">
                    -
                  </span>
                  {isFr ? d.speakerHintFr : d.speakerHintEn}
                </li>
              </ul>
            </HkSection>
          ))}
        </div>
      </HkPage>
    </HkShell>
  );
}

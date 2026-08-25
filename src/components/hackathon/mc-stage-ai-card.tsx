"use client";

import { AssistantAvatar } from "@/components/assistant/assistant-avatar";
import { McStageFuturisticAura } from "@/components/hackathon/mc-stage-futuristic-aura";
import type { StagePortraitTone } from "@/components/hackathon/mc-stage-portrait-frame";
import { McStageVoiceWaves } from "@/components/hackathon/mc-stage-voice-waves";
import type { McCue } from "@/lib/hackathon/mc-day";

function MicPulse({ active }: { active: boolean }) {
  return (
    <span className="relative inline-flex h-3 w-3 items-center justify-center">
      {active ? (
        <>
          <span className="absolute inset-0 animate-ping rounded-full bg-[#1F6B43]/40" />
          <span className="relative h-2 w-2 rounded-full bg-[#1F6B43]" />
        </>
      ) : (
        <span className="h-2 w-2 rounded-full bg-stone-300" />
      )}
    </span>
  );
}

/** Human host on stage (Patty, Jeff) — not McBuleli IA. */
export function McStageHumanCard({
  title,
  subtitle,
  hostName,
}: {
  title: string;
  subtitle?: string;
  hostName: string;
  /** Kept for call-site compat; portrait layout removed (was overlapping text). */
  role?: string;
  photoSrc?: string;
  photoAlt?: string;
  tone?: StagePortraitTone;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-[#E5E5E0]/95 bg-gradient-to-b from-white to-[#FAFAF8] px-8 py-12 text-center shadow-[0_20px_60px_-28px_rgba(31,107,67,0.35)] sm:px-12 sm:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#EAF6EE]/80 to-transparent"
      />
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1F6B43]">
        {title}
      </p>
      <h2 className="mt-4 text-3xl font-black tracking-tight text-[#0c0a09] sm:text-5xl">
        {hostName}
      </h2>
      {subtitle ? (
        <p className="mt-3 text-sm text-[#78716c] sm:text-base">{subtitle}</p>
      ) : null}
    </div>
  );
}

/** Ambient IA card — voice line hidden; public sees avatar + metadata only. */
export function McStageAiCard({
  cue,
  speaking,
  chunkIndex,
  chunkTotal,
  meetActive,
}: {
  cue: McCue;
  speaking: boolean;
  chunkIndex: number;
  chunkTotal: number;
  meetActive?: boolean;
}) {
  const isPartnerCall = cue.kind === "partner_call";
  const isPartnerThanks = cue.kind === "partner_thanks";
  const showPartnerLogo = Boolean(cue.partnerLogoUrl && (isPartnerCall || isPartnerThanks));

  return (
    <div className="relative min-h-[min(52vh,380px)] overflow-hidden rounded-[1.75rem] border border-[#1F6B43]/15 bg-gradient-to-b from-[#FAFFFC]/95 via-white/92 to-[#F4FBF7]/90 shadow-[0_20px_50px_-28px_rgba(31,107,67,0.4)] backdrop-blur-[2px]">
      <McStageFuturisticAura active intense={speaking} />

      <div className="relative z-10 flex h-full min-h-[min(52vh,380px)] flex-col items-center px-5 py-6 sm:px-7 sm:py-7">
        {/* Partner logo — top center, square or wide */}
        {showPartnerLogo ? (
          <div className="mb-4 flex w-full max-w-sm justify-center">
            <div className="flex min-h-[4.25rem] w-full max-w-[14rem] items-center justify-center rounded-xl border-2 border-[#E5E5E0] bg-white px-4 py-3 shadow-sm sm:min-h-[5rem] sm:max-w-[16rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cue.partnerLogoUrl!}
                alt={cue.partnerName ?? "Partenaire"}
                className="max-h-14 max-w-full object-contain sm:max-h-16"
              />
            </div>
          </div>
        ) : null}

        {/* Public metadata */}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1F6B43]/20 bg-[#EAF6EE] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1F6B43]">
            {cue.partnerName && !isPartnerCall ? cue.partnerName : cue.labelFr}
          </span>
          {cue.domainFr ? (
            <span className="rounded-full border border-[#E5E5E0] bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#78716c]">
              {cue.domainFr}
            </span>
          ) : null}
          {cue.windowFr ? (
            <span className="rounded-full border border-[#E5E5E0] bg-white/90 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#57534e]">
              {cue.windowFr}
            </span>
          ) : null}
          {meetActive ? (
            <span className="rounded-full border border-sky-300 bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700">
              Visio active
            </span>
          ) : null}
        </div>

        {cue.partnerName && isPartnerCall ? (
          <h2 className="mt-3 text-center text-xl font-black tracking-tight text-[#0c0a09] sm:text-3xl">
            {cue.partnerName}
          </h2>
        ) : null}

        {cue.partnerPresenterFr ? (
          <p className="mt-1.5 text-center text-sm font-semibold text-[#1F6B43] sm:text-base">
            {cue.partnerPresenterFr}
          </p>
        ) : null}

        {cue.detailFr && !isPartnerThanks ? (
          <p className="mt-2 max-w-md text-center text-xs text-[#78716c] sm:text-sm">
            {cue.detailFr}
          </p>
        ) : null}

        {/* McBuleli IA avatar — center stage + voice waves */}
        <div className="relative mt-auto flex flex-col items-center pb-1 pt-4">
          <div className="relative flex h-36 w-36 items-center justify-center sm:h-44 sm:w-44">
            <McStageVoiceWaves
              speaking={speaking}
              size={isPartnerCall ? 150 : 175}
            />
            <div className="relative z-10">
              <AssistantAvatar size={isPartnerCall ? 72 : 88} pulse={speaking} />
            </div>
          </div>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#1F6B43]">
            McBuleli IA
          </p>
          {speaking ? (
            <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#1F6B43]">
              <MicPulse active />
              En direct
              {chunkTotal > 1 ? (
                <span className="font-mono normal-case tracking-normal text-[#78716c]">
                  · {chunkIndex + 1}/{chunkTotal}
                </span>
              ) : null}
            </div>
          ) : (
            <p className="mt-1.5 text-[11px] text-[#a8a29e]">Modération · scène</p>
          )}
        </div>

        {/* Voice script — hidden from audience, kept for a11y */}
        <p className="sr-only">{cue.stageLineFr}</p>
      </div>
    </div>
  );
}

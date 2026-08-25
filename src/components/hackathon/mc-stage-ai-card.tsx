"use client";

import { AssistantAvatar } from "@/components/assistant/assistant-avatar";
import { McStageFuturisticAura } from "@/components/hackathon/mc-stage-futuristic-aura";
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
    <div className="relative min-h-[min(72vh,520px)] overflow-hidden rounded-[2rem] border border-[#1F6B43]/15 bg-gradient-to-b from-[#FAFFFC] via-white to-[#F4FBF7] shadow-[0_24px_70px_-32px_rgba(31,107,67,0.45)]">
      <McStageFuturisticAura active intense={speaking} />

      <div className="relative z-10 flex h-full min-h-[min(72vh,520px)] flex-col items-center px-6 py-8 sm:px-10 sm:py-10">
        {/* Partner logo — top center, square or wide */}
        {showPartnerLogo ? (
          <div className="mb-5 flex w-full max-w-md justify-center">
            <div className="flex min-h-[5.5rem] w-full max-w-[18rem] items-center justify-center rounded-2xl border-2 border-[#E5E5E0] bg-white px-5 py-4 shadow-sm sm:min-h-[6.5rem] sm:max-w-[22rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cue.partnerLogoUrl!}
                alt={cue.partnerName ?? "Partenaire"}
                className="max-h-20 max-w-full object-contain sm:max-h-24"
              />
            </div>
          </div>
        ) : null}

        {/* Public metadata */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1F6B43]/20 bg-[#EAF6EE] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#1F6B43]">
            {cue.partnerName && !isPartnerCall ? cue.partnerName : cue.labelFr}
          </span>
          {cue.domainFr ? (
            <span className="rounded-full border border-[#E5E5E0] bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#78716c]">
              {cue.domainFr}
            </span>
          ) : null}
          {cue.windowFr ? (
            <span className="rounded-full border border-[#E5E5E0] bg-white/90 px-3 py-1 font-mono text-[10px] font-bold text-[#57534e]">
              {cue.windowFr}
            </span>
          ) : null}
          {meetActive ? (
            <span className="rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-700">
              Visio active
            </span>
          ) : null}
        </div>

        {cue.partnerName && isPartnerCall ? (
          <h2 className="mt-4 text-center text-2xl font-black tracking-tight text-[#0c0a09] sm:text-4xl">
            {cue.partnerName}
          </h2>
        ) : null}

        {cue.partnerPresenterFr ? (
          <p className="mt-2 text-center text-base font-semibold text-[#1F6B43] sm:text-lg">
            {cue.partnerPresenterFr}
          </p>
        ) : null}

        {cue.detailFr && !isPartnerThanks ? (
          <p className="mt-3 max-w-lg text-center text-sm text-[#78716c] sm:text-base">
            {cue.detailFr}
          </p>
        ) : null}

        {/* McBuleli IA avatar — center stage + voice waves */}
        <div className="relative mt-auto flex flex-col items-center pb-2 pt-6">
          <div className="relative flex h-48 w-48 items-center justify-center sm:h-56 sm:w-56">
            <McStageVoiceWaves
              speaking={speaking}
              size={isPartnerCall ? 200 : 230}
            />
            <div className="relative z-10">
              <AssistantAvatar size={isPartnerCall ? 96 : 120} pulse={speaking} />
            </div>
          </div>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.28em] text-[#1F6B43]">
            McBuleli IA
          </p>
          {speaking ? (
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#1F6B43]">
              <MicPulse active />
              En direct
              {chunkTotal > 1 ? (
                <span className="font-mono normal-case tracking-normal text-[#78716c]">
                  · {chunkIndex + 1}/{chunkTotal}
                </span>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-xs text-[#a8a29e]">Modération · scène</p>
          )}
        </div>

        {/* Voice script — hidden from audience, kept for a11y */}
        <p className="sr-only">{cue.stageLineFr}</p>
      </div>
    </div>
  );
}

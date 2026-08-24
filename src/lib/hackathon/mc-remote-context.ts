import type { McCue } from "@/lib/hackathon/mc-day";
import {
  MC_CONTROL_PHASES,
  MC_SMART_ACTIONS,
  mcCueById,
  mcPhaseForCueIndex,
  type McSmartAction,
} from "@/lib/hackathon/mc-control-phases";
import type { McSessionPublic, ProjectorMode } from "@/lib/hackathon/mc-state";

export type McSlideRemote = {
  status: "idle" | "live";
  deckSlug: string | null;
  slideIndex: number;
  totalSlides: number;
};

export type McRemoteUiContext = {
  phaseId: string;
  phaseLabel: string;
  /** prev/next target */
  stepKind: "cue" | "slide";
  stepPrevLabel: string;
  stepNextLabel: string;
  statusLine: string;
  showVoice: boolean;
  showChrono: boolean;
  showHumanOverride: boolean;
  showProjectorModes: ProjectorMode[];
  showOnAirSlides: boolean;
  smartActions: McSmartAction[];
  jumpCues: McCue[];
};

const MODE_LABEL: Record<ProjectorMode, string> = {
  mc: "MC",
  meet: "Visio",
  slides: "Slides",
  wall: "Mur",
  awards: "Prix",
};

export function buildMcRemoteUiContext(
  session: McSessionPublic,
  slides: McSlideRemote | null,
): McRemoteUiContext {
  const phase = mcPhaseForCueIndex(session.cueIndex);
  const slidesLive = slides?.status === "live" && (slides.totalSlides ?? 0) > 0;
  const mode = session.projectorMode;

  const stepKind: "cue" | "slide" =
    mode === "slides" && slidesLive ? "slide" : "cue";

  const stepPrevLabel =
    stepKind === "slide" ? "← Slide" : "← Cue AI";
  const stepNextLabel =
    stepKind === "slide" ? "Slide →" : "Cue AI →";

  let statusLine = session.cue.labelFr;
  if (stepKind === "slide" && slides) {
    statusLine = `Slide ${slides.slideIndex + 1}/${slides.totalSlides}`;
  }

  const showVoice = mode === "mc" && !session.humanOverride;
  const showChrono =
    mode === "mc" &&
    Boolean(session.cue.timerSeconds || session.timerEndsAt);
  const showHumanOverride = mode === "mc";

  const showProjectorModes: ProjectorMode[] = ["mc"];
  if (phase.id === "partners" || session.meetSlug) {
    showProjectorModes.push("meet");
  }
  if (phase.id === "bootcamp" || mode === "slides") {
    showProjectorModes.push("slides");
  }
  if (phase.id === "build" || phase.id === "demo" || mode === "wall") {
    showProjectorModes.push("wall");
  }
  if (phase.id === "close" || mode === "awards") {
    showProjectorModes.push("awards");
  }
  if (!showProjectorModes.includes(mode)) {
    showProjectorModes.push(mode);
  }

  const showOnAirSlides =
    phase.id === "bootcamp" &&
    mode === "slides" &&
    !slidesLive;

  const smartActions = MC_SMART_ACTIONS.filter((a) => {
    if (a.id === "bootcamp_slides") return false;
    if (a.id === "kilelo_visio" || a.id === "kilelo_projector") {
      return phase.id === "partners" || Boolean(session.meetSlug);
    }
    if (a.id === "visio_off") return Boolean(session.meetSlug) || mode === "meet";
    if (a.id === "build_wall") return phase.id === "build";
    if (a.id === "podium") return phase.id === "close";
    return a.phaseId === phase.id;
  });

  const phaseCueIds = phase.cueIds;
  const curIdx = phaseCueIds.indexOf(session.cueId);
  const jumpCues: McCue[] = [];
  if (phaseCueIds.length <= 5) {
    for (const id of phaseCueIds) {
      const c = mcCueById(id);
      if (c) jumpCues.push(c);
    }
  } else if (curIdx >= 0) {
    for (const id of phaseCueIds.slice(curIdx, curIdx + 3)) {
      const c = mcCueById(id);
      if (c) jumpCues.push(c);
    }
  }

  return {
    phaseId: phase.id,
    phaseLabel: phase.labelFr,
    stepKind,
    stepPrevLabel,
    stepNextLabel,
    statusLine,
    showVoice,
    showChrono,
    showHumanOverride,
    showProjectorModes,
    showOnAirSlides,
    smartActions,
    jumpCues,
  };
}

export function projectorModeLabel(mode: ProjectorMode): string {
  return MODE_LABEL[mode];
}

export { MC_CONTROL_PHASES };

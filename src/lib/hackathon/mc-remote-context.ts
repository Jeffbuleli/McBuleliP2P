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
  /** Hide cue nav / jumps when Visio plein écran */
  showCueNav: boolean;
  /** Pilotage Mur : annonces + file pitch + aperçu salle */
  showWallControls: boolean;
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
  } else if (mode === "wall") {
    statusLine = `Mur · ${session.cue.labelFr}`;
  } else if (mode === "meet") {
    statusLine = session.cue.partnerName
      ? `Visio · ${session.cue.partnerName}`
      : "Visio Live";
  }

  const showVoice = mode === "mc" && !session.humanOverride;
  const showChrono =
    mode === "mc" &&
    Boolean(session.cue.timerSeconds || session.timerEndsAt);
  const showHumanOverride = mode === "mc";
  const showWallControls = mode === "wall";

  const smartActions = MC_SMART_ACTIONS.filter((a) => {
    if (a.id === "bootcamp_slides") return false;
    // Mode Visio : un seul bouton utile — couper
    if (mode === "meet") {
      return a.id === "visio_off";
    }
    if (a.id === "kilelo_prepare" || a.id === "kilelo_visio") {
      return false;
    }
    if (a.id === "kilelo_projector") {
      return phase.id === "partners" || Boolean(session.meetSlug);
    }
    if (a.id === "visio_off") return Boolean(session.meetSlug);
    // Déjà sur Mur : pas besoin du smart « Build · Mur »
    if (a.id === "build_wall") return phase.id === "build" && mode !== "wall";
    if (a.id === "podium") return phase.id === "close";
    return a.phaseId === phase.id;
  });

  const showProjectorModes: ProjectorMode[] =
    mode === "meet"
      ? (["mc", "meet"] as ProjectorMode[])
      : (() => {
          const modes: ProjectorMode[] = ["mc"];
          if (phase.id === "partners" || session.meetSlug) {
            modes.push("meet");
          }
          if (phase.id === "bootcamp" || mode === "slides") {
            modes.push("slides");
          }
          if (phase.id === "build" || phase.id === "demo" || mode === "wall") {
            modes.push("wall");
          }
          if (phase.id === "close" || mode === "awards") {
            modes.push("awards");
          }
          if (!modes.includes(mode)) modes.push(mode);
          return modes;
        })();

  const jumpCues: McCue[] = [];
  if (mode !== "meet") {
    const phaseCueIds = phase.cueIds;
    const curIdx = phaseCueIds.indexOf(session.cueId);
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
  }

  const showOnAirSlides =
    mode !== "meet" &&
    phase.id === "bootcamp" &&
    mode === "slides" &&
    !slidesLive;

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
    showCueNav: mode !== "meet",
    showWallControls,
    smartActions,
    jumpCues,
  };
}

export function projectorModeLabel(mode: ProjectorMode): string {
  return MODE_LABEL[mode];
}

export { MC_CONTROL_PHASES };

/**
 * Shared MC session state (operator <-> Live projector).
 * In-memory on the web process (single VPS container) - fine for Day 1 control.
 */
import {
  findMcCueIndex,
  getMcCueAt,
  peekNextCue,
  type McCue,
} from "@/lib/hackathon/mc-day";

/** What the single room projector (/hackathon/live) shows. */
export type ProjectorMode = "wall" | "mc" | "slides";

export type McSessionState = {
  cueId: string;
  cueIndex: number;
  /** ISO end time when a countdown is running */
  timerEndsAt: string | null;
  /** Soft pause: show human banner instead of AI line */
  humanOverride: boolean;
  overrideMessageFr: string;
  /** Single projector mode for /hackathon/live */
  projectorMode: ProjectorMode;
  updatedAt: string;
};

export type McSessionPublic = McSessionState & {
  cue: McCue;
  nextCue: McCue | null;
  serverNow: string;
};

const DEFAULT_OVERRIDE =
  "Une seconde - l'équipe McBuleli ajuste. Reprise dans un instant.";

type GlobalMc = {
  __mcbuleliMcSession?: McSessionState;
};

function store(): GlobalMc {
  return globalThis as GlobalMc;
}

function defaultState(): McSessionState {
  const cue = getMcCueAt(0);
  return {
    cueId: cue.id,
    cueIndex: 0,
    timerEndsAt: null,
    humanOverride: false,
    overrideMessageFr: DEFAULT_OVERRIDE,
    projectorMode: "mc",
    updatedAt: new Date().toISOString(),
  };
}

export function getMcSession(): McSessionState {
  const g = store();
  if (!g.__mcbuleliMcSession) {
    g.__mcbuleliMcSession = defaultState();
  }
  // Backfill if older in-memory state predates projectorMode
  if (!g.__mcbuleliMcSession.projectorMode) {
    g.__mcbuleliMcSession.projectorMode = "mc";
  }
  return g.__mcbuleliMcSession;
}

export function toMcPublic(state: McSessionState): McSessionPublic {
  const cue = getMcCueAt(state.cueIndex);
  return {
    ...state,
    cueId: cue.id,
    cue,
    nextCue: peekNextCue(state.cueIndex),
    serverNow: new Date().toISOString(),
  };
}

function touch(partial: Partial<McSessionState>): McSessionPublic {
  const g = store();
  const prev = getMcSession();
  const next: McSessionState = {
    ...prev,
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  g.__mcbuleliMcSession = next;
  return toMcPublic(next);
}

export function setMcCueIndex(index: number): McSessionPublic {
  const cue = getMcCueAt(index);
  return touch({
    cueIndex: index,
    cueId: cue.id,
    timerEndsAt: null,
    humanOverride: false,
  });
}

export function setMcCueById(id: string): McSessionPublic {
  return setMcCueIndex(findMcCueIndex(id));
}

export function stepMcCue(delta: number): McSessionPublic {
  const cur = getMcSession();
  return setMcCueIndex(cur.cueIndex + delta);
}

export function startMcTimer(seconds: number): McSessionPublic {
  const ends = new Date(Date.now() + Math.max(1, seconds) * 1000);
  return touch({
    timerEndsAt: ends.toISOString(),
    humanOverride: false,
  });
}

export function clearMcTimer(): McSessionPublic {
  return touch({ timerEndsAt: null });
}

export function setMcHumanOverride(
  on: boolean,
  messageFr?: string,
): McSessionPublic {
  return touch({
    humanOverride: on,
    overrideMessageFr: messageFr?.trim() || DEFAULT_OVERRIDE,
    timerEndsAt: on ? null : getMcSession().timerEndsAt,
  });
}

export function setProjectorMode(mode: ProjectorMode): McSessionPublic {
  return touch({ projectorMode: mode });
}

export function resetMcSession(): McSessionPublic {
  const g = store();
  g.__mcbuleliMcSession = defaultState();
  return toMcPublic(g.__mcbuleliMcSession);
}

export function mcControlKeyOk(provided: string | null | undefined): boolean {
  const expected = (process.env.HACKATHON_MC_KEY ?? "").trim();
  if (!expected) {
    // Dev-friendly: allow when unset locally; block empty prod-like hosts
    if (process.env.NODE_ENV !== "production") return true;
    return false;
  }
  return (provided ?? "").trim() === expected;
}

/**
 * Shared MC session state (operator <-> Live projector).
 * In-memory cache + Postgres persistence (survives container restart).
 */
import {
  findMcCueIndex,
  getMcCueAt,
  peekNextCue,
  type McCue,
} from "@/lib/hackathon/mc-day";
import { getDb, hackathonMcSessions } from "@/db";
import { eq } from "drizzle-orm";

/** What the single room projector (/hackathon/live) shows. */
export type ProjectorMode = "wall" | "mc" | "slides" | "awards";

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
  /** Projector may speak stage lines (browser TTS) */
  voiceEnabled: boolean;
  /** Bump to force projector to re-speak current cue */
  voiceReplayToken: number;
  updatedAt: string;
};

export type McSessionPublic = McSessionState & {
  cue: McCue;
  nextCue: McCue | null;
  serverNow: string;
};

const DEFAULT_OVERRIDE =
  "Une seconde - l'équipe McBuleli ajuste. Reprise dans un instant.";

const MC_SESSION_ROW_ID = "default";

type GlobalMc = {
  __mcbuleliMcSession?: McSessionState;
  __mcbuleliMcHydrated?: boolean;
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
    voiceEnabled: true,
    voiceReplayToken: 0,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeState(raw: Partial<McSessionState> | null | undefined): McSessionState {
  const base = defaultState();
  if (!raw || typeof raw !== "object") return base;
  const cueIndex =
    typeof raw.cueIndex === "number" && Number.isFinite(raw.cueIndex)
      ? Math.max(0, Math.floor(raw.cueIndex))
      : 0;
  const cue = getMcCueAt(cueIndex);
  return {
    cueId: cue.id,
    cueIndex,
    timerEndsAt:
      typeof raw.timerEndsAt === "string" || raw.timerEndsAt === null
        ? raw.timerEndsAt
        : null,
    humanOverride: Boolean(raw.humanOverride),
    overrideMessageFr:
      typeof raw.overrideMessageFr === "string" && raw.overrideMessageFr.trim()
        ? raw.overrideMessageFr
        : DEFAULT_OVERRIDE,
    projectorMode:
      raw.projectorMode === "wall" ||
      raw.projectorMode === "mc" ||
      raw.projectorMode === "slides" ||
      raw.projectorMode === "awards"
        ? raw.projectorMode
        : "mc",
    voiceEnabled:
      typeof raw.voiceEnabled === "boolean" ? raw.voiceEnabled : true,
    voiceReplayToken:
      typeof raw.voiceReplayToken === "number" ? raw.voiceReplayToken : 0,
    updatedAt:
      typeof raw.updatedAt === "string"
        ? raw.updatedAt
        : new Date().toISOString(),
  };
}

async function persistMcSession(state: McSessionState): Promise<void> {
  try {
    const db = getDb();
    const payload = state as unknown as Record<string, unknown>;
    const [existing] = await db
      .select({ id: hackathonMcSessions.id })
      .from(hackathonMcSessions)
      .where(eq(hackathonMcSessions.id, MC_SESSION_ROW_ID))
      .limit(1);
    if (existing) {
      await db
        .update(hackathonMcSessions)
        .set({ state: payload, updatedAt: new Date() })
        .where(eq(hackathonMcSessions.id, MC_SESSION_ROW_ID));
    } else {
      await db.insert(hackathonMcSessions).values({
        id: MC_SESSION_ROW_ID,
        state: payload,
        updatedAt: new Date(),
      });
    }
  } catch (e) {
    console.error("[mc-state] persist failed", e);
  }
}

/** Load DB state into memory once per process (safe on repeated calls). */
export async function ensureMcSessionHydrated(): Promise<void> {
  const g = store();
  if (g.__mcbuleliMcHydrated) return;
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(hackathonMcSessions)
      .where(eq(hackathonMcSessions.id, MC_SESSION_ROW_ID))
      .limit(1);
    if (row?.state) {
      g.__mcbuleliMcSession = normalizeState(
        row.state as Partial<McSessionState>,
      );
    }
  } catch (e) {
    console.error("[mc-state] hydrate failed", e);
  }
  g.__mcbuleliMcHydrated = true;
}

export function getMcSession(): McSessionState {
  const g = store();
  if (!g.__mcbuleliMcSession) {
    g.__mcbuleliMcSession = defaultState();
  }
  // Backfill if older in-memory state predates new fields
  if (!g.__mcbuleliMcSession.projectorMode) {
    g.__mcbuleliMcSession.projectorMode = "mc";
  }
  if (typeof g.__mcbuleliMcSession.voiceEnabled !== "boolean") {
    g.__mcbuleliMcSession.voiceEnabled = true;
  }
  if (typeof g.__mcbuleliMcSession.voiceReplayToken !== "number") {
    g.__mcbuleliMcSession.voiceReplayToken = 0;
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
  void persistMcSession(next);
  return toMcPublic(next);
}

export function setMcCueIndex(index: number): McSessionPublic {
  const cue = getMcCueAt(index);
  const partial: Partial<McSessionState> = {
    cueIndex: index,
    cueId: cue.id,
    timerEndsAt: null,
    humanOverride: false,
  };
  if (cue.projectorMode) {
    partial.projectorMode = cue.projectorMode;
  }
  return touch(partial);
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

export function setMcVoiceEnabled(on: boolean): McSessionPublic {
  return touch({ voiceEnabled: on });
}

export function requestMcVoiceReplay(): McSessionPublic {
  const cur = getMcSession();
  return touch({
    voiceEnabled: true,
    voiceReplayToken: cur.voiceReplayToken + 1,
  });
}

export function resetMcSession(): McSessionPublic {
  const g = store();
  g.__mcbuleliMcSession = defaultState();
  void persistMcSession(g.__mcbuleliMcSession);
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

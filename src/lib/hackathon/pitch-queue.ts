/**
 * Ordre de passage Mini Demo Day - état en mémoire (VPS single process).
 */
import { and, asc, eq } from "drizzle-orm";
import { getDb, hackathonSubmissions, hackathonTeams } from "@/db";

export type PitchQueueEntry = {
  teamId: string;
  teamName: string;
};

export type PitchQueueState = {
  entries: PitchQueueEntry[];
  currentIndex: number;
  active: boolean;
  updatedAt: string;
};

export type PitchQueuePublic = PitchQueueState & {
  current: PitchQueueEntry | null;
  next: PitchQueueEntry | null;
  total: number;
  position: number;
};

type GlobalPitch = {
  __mcbuleliPitchQueue?: PitchQueueState;
};

function store(): GlobalPitch {
  return globalThis as GlobalPitch;
}

function defaultState(): PitchQueueState {
  return {
    entries: [],
    currentIndex: 0,
    active: false,
    updatedAt: new Date().toISOString(),
  };
}

export function getPitchQueue(): PitchQueueState {
  const g = store();
  if (!g.__mcbuleliPitchQueue) {
    g.__mcbuleliPitchQueue = defaultState();
  }
  return g.__mcbuleliPitchQueue;
}

export function toPitchQueuePublic(state: PitchQueueState): PitchQueuePublic {
  const current = state.entries[state.currentIndex] ?? null;
  const next = state.entries[state.currentIndex + 1] ?? null;
  return {
    ...state,
    current,
    next,
    total: state.entries.length,
    position: state.entries.length ? state.currentIndex + 1 : 0,
  };
}

function touch(partial: Partial<PitchQueueState>): PitchQueuePublic {
  const g = store();
  const prev = getPitchQueue();
  const next: PitchQueueState = {
    ...prev,
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  g.__mcbuleliPitchQueue = next;
  return toPitchQueuePublic(next);
}

export async function initPitchQueueFromSubmitted(
  editionId: string,
): Promise<PitchQueuePublic> {
  const db = getDb();
  const rows = await db
    .select({
      teamId: hackathonTeams.id,
      teamName: hackathonTeams.name,
    })
    .from(hackathonSubmissions)
    .innerJoin(hackathonTeams, eq(hackathonSubmissions.teamId, hackathonTeams.id))
    .where(
      and(
        eq(hackathonSubmissions.editionId, editionId),
        eq(hackathonSubmissions.status, "submitted"),
      ),
    )
    .orderBy(asc(hackathonTeams.name));

  return touch({
    entries: rows.map((r) => ({ teamId: r.teamId, teamName: r.teamName })),
    currentIndex: 0,
    active: rows.length > 0,
  });
}

export function setPitchQueueEntries(entries: PitchQueueEntry[]): PitchQueuePublic {
  const cur = getPitchQueue();
  const safeIndex = Math.min(cur.currentIndex, Math.max(0, entries.length - 1));
  return touch({
    entries,
    currentIndex: entries.length ? safeIndex : 0,
    active: entries.length > 0 ? cur.active : false,
  });
}

export function pitchQueueNext(): PitchQueuePublic {
  const cur = getPitchQueue();
  if (!cur.entries.length) return toPitchQueuePublic(cur);
  const nextIndex = Math.min(cur.currentIndex + 1, cur.entries.length - 1);
  return touch({ currentIndex: nextIndex, active: true });
}

export function pitchQueuePrev(): PitchQueuePublic {
  const cur = getPitchQueue();
  const prevIndex = Math.max(0, cur.currentIndex - 1);
  return touch({ currentIndex: prevIndex, active: cur.active || cur.entries.length > 0 });
}

export function pitchQueueGoto(index: number): PitchQueuePublic {
  const cur = getPitchQueue();
  const i = Math.max(0, Math.min(index, Math.max(0, cur.entries.length - 1)));
  return touch({ currentIndex: i, active: cur.entries.length > 0 });
}

export function setPitchQueueActive(active: boolean): PitchQueuePublic {
  return touch({ active });
}

export function resetPitchQueue(): PitchQueuePublic {
  const g = store();
  g.__mcbuleliPitchQueue = defaultState();
  return toPitchQueuePublic(g.__mcbuleliPitchQueue);
}

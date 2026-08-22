/**
 * Contenu runbook ops Jour 1 - imprimable depuis /hackathon/ops/runbook.
 */
import {
  HACKATHON_DAY1_CHECKLIST_FR,
  day1PrimarySurfaces,
} from "@/lib/hackathon/surfaces";
import {
  MC_CUES,
  MC_MAGIC_PHRASES,
  MC_ROLE_CARDS,
  MC_EVENT_DATE_FR,
  MC_VENUE_FR,
} from "@/lib/hackathon/mc-day";
import { hackathonProgramDays } from "@/lib/hackathon/event-content";

export function runbookPrimaryLinks() {
  return day1PrimarySurfaces().map((s) => ({
    label: s.labelFr,
    href: s.href,
    job: s.jobFr,
  }));
}

export function runbookChecklist() {
  return [...HACKATHON_DAY1_CHECKLIST_FR];
}

export function runbookProgramSlots() {
  const day = hackathonProgramDays()[0];
  return day?.slots ?? [];
}

export function runbookMcCues() {
  return MC_CUES.filter((c) => c.id !== "standby").map((c) => ({
    id: c.id,
    label: c.labelFr,
    window: c.windowFr ?? "",
    projector: c.projectorMode ?? "",
  }));
}

export function runbookRoleCards() {
  return MC_ROLE_CARDS;
}

export const RUNBOOK_HEADER = {
  title: "McBuleli Hackathon 2026 - Runbook ops",
  date: MC_EVENT_DATE_FR,
  venue: MC_VENUE_FR,
  magicPhrases: MC_MAGIC_PHRASES,
};

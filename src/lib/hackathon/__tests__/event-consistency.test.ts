import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HACKATHON_EVENT_DAYS,
  HACKATHON_DATES_LABEL_FR,
  hackathonPartnerIntroFr,
  hackathonScheduleLinesFr,
} from "@/lib/hackathon/event-content";
import { eventDayIndex } from "@/lib/hackathon/access";
import { listTeamMessages, postTeamMessage } from "@/lib/hackathon/teams";
import { HACKATHON_SURFACES } from "@/lib/hackathon/surfaces";

describe("hackathon event consistency (single day)", () => {
  it("event is configured for one day", () => {
    assert.equal(HACKATHON_EVENT_DAYS, 1);
    assert.match(HACKATHON_DATES_LABEL_FR, /28/);
    assert.doesNotMatch(HACKATHON_DATES_LABEL_FR, /29/);
  });

  it("eventDayIndex always returns 1 for single-day edition", () => {
    const start = new Date("2026-08-28T08:00:00+01:00");
    assert.equal(eventDayIndex({ startDate: start }, new Date("2026-08-29T10:00:00+01:00")), 1);
  });

  it("partner email copy has no second day", () => {
    const intro = hackathonPartnerIntroFr();
    const lines = hackathonScheduleLinesFr();
    assert.doesNotMatch(intro, /2 jours|Jour 2|29 août/i);
    assert.equal(lines.length, 1);
    assert.doesNotMatch(lines.join("\n"), /29|Jour 2/i);
  });

  it("ops surfaces include runbook and live essentials", () => {
    const ids = new Set(HACKATHON_SURFACES.map((s) => s.id));
    for (const id of ["runbook", "live", "mc", "jury", "espace", "infos", "certificat"]) {
      assert.ok(ids.has(id), `missing surface: ${id}`);
    }
  });

  it("team messages API is wired to teams module", () => {
    assert.equal(typeof listTeamMessages, "function");
    assert.equal(typeof postTeamMessage, "function");
  });

  it("P3 incubation + MC hydrate helpers exist", async () => {
    const { incubationEligible } = await import("@/lib/hackathon/incubation");
    const { ensureMcSessionHydrated, getMcSession } = await import(
      "@/lib/hackathon/mc-state"
    );
    assert.equal(incubationEligible("judged"), true);
    assert.equal(incubationEligible("building"), false);
    assert.equal(typeof ensureMcSessionHydrated, "function");
    assert.equal(typeof getMcSession, "function");
  });

  it("MC voice expands isolated partner abbreviations", async () => {
    const { splitMcSpeechChunks } = await import("@/lib/hackathon/mc-voice");
    const chunks = splitMcSpeechChunks(
      "Nous accueillons TYTS. Merci RDPI Think Tank.",
    );
    const joined = chunks.join(" ");
    assert.ok(chunks.length >= 2);
    assert.match(joined, /The Young Technology Service/i);
    assert.doesNotMatch(joined, /\bT Y T S\b/);
    // RDPI reste avec Think Tank (pas épelé lettre à lettre)
    assert.match(joined, /RDPI Think Tank/);
    assert.doesNotMatch(joined, /R D P I/);
  });

  it("partner call cues: public fields stay audience-safe; TYTS spoken once", async () => {
    const { MC_CUES } = await import("@/lib/hackathon/mc-day");
    const { splitMcSpeechChunks } = await import("@/lib/hackathon/mc-voice");
    const tyts = MC_CUES.find((c) => c.id === "partner-tyts-call");
    assert.ok(tyts);
    assert.equal(tyts.partnerName, "TYTS");
    assert.ok(tyts.partnerLogoUrl?.includes("tyts"));
    assert.ok(tyts.partnerPresenterFr);
    assert.doesNotMatch(tyts.detailFr ?? "", /Chrono|Opérateur|console/i);
    assert.doesNotMatch(tyts.stageLineFr, /Chrono visible/i);
    assert.match(tyts.humanScriptFr ?? "", /Chrono/);
    const spoken = splitMcSpeechChunks(tyts.stageLineFr).join(" ");
    const hits = spoken.match(/The Young Technology Service/gi) ?? [];
    assert.equal(hits.length, 1);
  });

  it("MC intro is two public cues before rules", async () => {
    const { MC_CUES } = await import("@/lib/hackathon/mc-day");
    const ids = MC_CUES.map((c) => c.id);
    const intro = ids.indexOf("ai-intro");
    const stack = ids.indexOf("ai-stack");
    const rules = ids.indexOf("ai-rules");
    assert.ok(intro >= 0 && stack === intro + 1 && rules === stack + 1);
    const who = MC_CUES[intro];
    const tech = MC_CUES[stack];
    assert.match(who.stageLineFr, /vision|mission/i);
    assert.match(tech.stageLineFr, /P2P/);
    assert.match(tech.stageLineFr, /SafeFind/);
    assert.match(tech.stageLineFr, /Africa Insight/);
  });
});

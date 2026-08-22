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
    for (const id of ["runbook", "live", "mc", "jury", "espace", "infos"]) {
      assert.ok(ids.has(id), `missing surface: ${id}`);
    }
  });

  it("team messages API is wired to teams module", () => {
    assert.equal(typeof listTeamMessages, "function");
    assert.equal(typeof postTeamMessage, "function");
  });
});

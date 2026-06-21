import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildGoogleCalendarUrl, buildIcsContent } from "../calendar";
import { canEditEvent, resolveEventRole } from "../permissions";
import { EventRole } from "../types";

describe("events calendar", () => {
  const sample = {
    slug: "intro-trading",
    title: "Intro Trading",
    description: "Session Academy",
    startDate: new Date("2026-07-01T14:00:00.000Z"),
    endDate: new Date("2026-07-01T16:00:00.000Z"),
    timezone: "Africa/Kinshasa",
  };

  it("builds google calendar url", () => {
    const url = buildGoogleCalendarUrl(sample);
    assert.ok(url.includes("calendar.google.com"));
    assert.ok(url.includes("Intro+Trading"));
  });

  it("builds ics content", () => {
    const ics = buildIcsContent(sample);
    assert.ok(ics.includes("BEGIN:VCALENDAR"));
    assert.ok(ics.includes("McBuleli Live"));
  });
});

describe("events permissions", () => {
  it("super admin can edit any event", () => {
    const role = resolveEventRole({
      userId: "u1",
      appRole: "super_admin",
      event: { trainerId: "u2", createdBy: "u2" },
    });
    assert.equal(role, EventRole.SYSTEM_ADMIN);
    assert.equal(
      canEditEvent({
        role,
        userId: "u1",
        event: { trainerId: "u2", createdBy: "u2" },
      }),
      true,
    );
  });

  it("trainer can edit own event", () => {
    const role = resolveEventRole({
      userId: "t1",
      appRole: "user",
      event: { trainerId: "t1", createdBy: "t1" },
    });
    assert.equal(role, EventRole.TRAINER);
    assert.equal(
      canEditEvent({ role, userId: "t1", event: { trainerId: "t1", createdBy: "t1" } }),
      true,
    );
  });
});

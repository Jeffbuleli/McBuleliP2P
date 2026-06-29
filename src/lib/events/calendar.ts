import type { EventRecord } from "@/lib/events/types";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Google Calendar UTC compact format YYYYMMDDTHHmmssZ */
function toGoogleUtc(d: Date): string {
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildGoogleCalendarUrl(event: Pick<EventRecord, "title" | "description" | "startDate" | "endDate"> & {
  slug: string;
}): string {
  const base = "https://calendar.google.com/calendar/render";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toGoogleUtc(event.startDate)}/${toGoogleUtc(event.endDate)}`,
    details: `${event.description}\n\nMcBuleli Live - https://mcbuleli.org/app/events/${event.slug}`,
    location: "McBuleli Live (online)",
  });
  return `${base}?${params.toString()}`;
}

export function buildIcsContent(event: Pick<EventRecord, "title" | "description" | "startDate" | "endDate" | "timezone"> & {
  slug: string;
  uid?: string;
}): string {
  const uid = event.uid ?? `event-${event.slug}@mcbuleli.org`;
  const now = toGoogleUtc(new Date());
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//McBuleli//Events//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toGoogleUtc(event.startDate)}`,
    `DTEND:${toGoogleUtc(event.endDate)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description)}`,
    "LOCATION:McBuleli Live",
    `URL:https://mcbuleli.org/app/events/${event.slug}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

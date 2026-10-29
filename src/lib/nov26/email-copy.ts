import {
  NOV26_DATES_LABEL_EN,
  NOV26_DATES_LABEL_FR,
  NOV26_TIME_LABEL_EN,
  NOV26_TIME_LABEL_FR,
} from "@/lib/nov26/content";
import { NOV26_EDITION_SLUG } from "@/lib/hackathon/editions";

export function isNov26Edition(
  edition: { slug: string } | null | undefined,
): boolean {
  return edition?.slug === NOV26_EDITION_SLUG;
}

export function nov26DateLabel(isFr: boolean): string {
  return isFr ? NOV26_DATES_LABEL_FR : NOV26_DATES_LABEL_EN;
}

export function nov26ScheduleLabel(isFr: boolean): string {
  return isFr ? NOV26_TIME_LABEL_FR : NOV26_TIME_LABEL_EN;
}

export function nov26VenueLabel(isFr: boolean): string {
  return isFr ? "Google Meet · en ligne" : "Google Meet · online";
}

export function nov26PackLabel(isFr: boolean): string {
  return isFr ? "Formation · 3 soirées" : "Training · 3 evenings";
}

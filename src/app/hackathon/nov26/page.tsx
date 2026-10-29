import type { Metadata } from "next";
import {
  buildNov26LandingMetadata,
  Nov26LandingPage,
} from "@/lib/nov26/landing-page";

/** Alias canonique : mcbuleli.com/nov26 — voir redirects dans next.config. */
export const dynamic = "force-dynamic";

const BASE = "/hackathon/nov26";

export const metadata: Metadata = buildNov26LandingMetadata(BASE);

export default function HackathonNov26Page() {
  return <Nov26LandingPage basePath={BASE} />;
}

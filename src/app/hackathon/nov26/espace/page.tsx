import type { Metadata } from "next";
import {
  buildNov26EspaceMetadata,
  Nov26EspacePage,
} from "@/lib/nov26/espace-page";

export const dynamic = "force-dynamic";

const BASE = "/hackathon/nov26";

export const metadata: Metadata = buildNov26EspaceMetadata(BASE);

export default function HackathonNov26EspacePage() {
  return (
    <Nov26EspacePage basePath={BASE} authReturnPath={`${BASE}/espace`} />
  );
}

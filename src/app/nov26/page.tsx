import {
  buildNov26LandingMetadata,
  Nov26LandingPage,
} from "@/lib/nov26/landing-page";

export const dynamic = "force-dynamic";

const BASE = "/nov26";

export const metadata = buildNov26LandingMetadata(BASE);

export default function Page() {
  return <Nov26LandingPage basePath={BASE} />;
}

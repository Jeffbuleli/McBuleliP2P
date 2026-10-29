import {
  buildNov26EspaceMetadata,
  Nov26EspacePage,
} from "@/lib/nov26/espace-page";

export const dynamic = "force-dynamic";

const BASE = "/nov26";

export const metadata = buildNov26EspaceMetadata(`${BASE}/espace`);

export default function Page() {
  return (
    <Nov26EspacePage basePath={BASE} authReturnPath={`${BASE}/espace`} />
  );
}

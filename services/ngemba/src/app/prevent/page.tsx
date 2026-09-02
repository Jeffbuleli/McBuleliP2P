import { StaticPageShell } from "@/components/static-page-shell";
import { PREVENT_SECTIONS } from "@/lib/static-pages";

export default function PreventPage() {
  return (
    <StaticPageShell title="Prévenir" sections={PREVENT_SECTIONS} />
  );
}

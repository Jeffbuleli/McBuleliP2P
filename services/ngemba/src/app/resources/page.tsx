import { StaticPageShell } from "@/components/static-page-shell";
import { RESOURCES_SECTIONS } from "@/lib/static-pages";

export default function ResourcesPage() {
  return (
    <StaticPageShell title="Aide et ressources" sections={RESOURCES_SECTIONS} />
  );
}

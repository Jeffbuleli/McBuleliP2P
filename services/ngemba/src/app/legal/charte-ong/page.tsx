import { StaticPageShell } from "@/components/static-page-shell";
import { CHARTE_ONG_SECTIONS } from "@/lib/static-pages";

export default function CharteOngPage() {
  return (
    <StaticPageShell
      title="Charte opérateur ONG"
      sections={CHARTE_ONG_SECTIONS}
    />
  );
}

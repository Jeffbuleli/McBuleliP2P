import { StaticPageShell } from "@/components/static-page-shell";
import { CGU_SECTIONS } from "@/lib/static-pages";

export default function CguPage() {
  return (
    <StaticPageShell
      title="Conditions d'utilisation (brouillon pilote)"
      sections={CGU_SECTIONS}
    />
  );
}

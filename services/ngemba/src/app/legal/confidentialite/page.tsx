import { StaticPageShell } from "@/components/static-page-shell";
import { PRIVACY_SECTIONS } from "@/lib/static-pages";

export default function ConfidentialitePage() {
  return (
    <StaticPageShell
      title="Confidentialité (brouillon pilote)"
      sections={PRIVACY_SECTIONS}
    />
  );
}

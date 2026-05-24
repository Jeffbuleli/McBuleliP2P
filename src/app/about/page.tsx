import { LegalBulletList, LegalPageShell } from "@/components/legal/legal-page-shell";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export default async function AboutPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <LegalPageShell titleKey="legal_about_title" leadKey="legal_about_lead">
      <LegalBulletList
        items={[d.legal_about_1, d.legal_about_2, d.legal_about_3, d.legal_about_4]}
      />
    </LegalPageShell>
  );
}

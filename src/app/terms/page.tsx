import { PublicBulletList, PublicPageShell } from "@/components/legal/public-page-shell";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export default async function TermsPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <PublicPageShell titleKey="legal_terms_title" leadKey="legal_terms_lead">
      <PublicBulletList
        items={[d.legal_terms_1, d.legal_terms_2, d.legal_terms_3, d.legal_terms_4, d.legal_terms_5]}
      />
    </PublicPageShell>
  );
}

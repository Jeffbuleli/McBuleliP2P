import { PublicBulletList, PublicPageShell } from "@/components/legal/public-page-shell";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export default async function PrivacyPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <PublicPageShell titleKey="legal_privacy_title" leadKey="legal_privacy_lead">
      <PublicBulletList
        items={[
          d.legal_privacy_1,
          d.legal_privacy_2,
          d.legal_privacy_3,
          d.legal_privacy_4,
          d.legal_privacy_5,
        ]}
      />
    </PublicPageShell>
  );
}

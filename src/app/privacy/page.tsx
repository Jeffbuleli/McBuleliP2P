import { LegalBulletList, LegalPageShell } from "@/components/legal/legal-page-shell";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export default async function PrivacyPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <LegalPageShell titleKey="legal_privacy_title" leadKey="legal_privacy_lead">
      <LegalBulletList
        items={[
          d.legal_privacy_1,
          d.legal_privacy_2,
          d.legal_privacy_3,
          d.legal_privacy_4,
          d.legal_privacy_5,
        ]}
      />
    </LegalPageShell>
  );
}

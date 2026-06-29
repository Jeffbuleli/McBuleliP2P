import { PublicPageShell } from "@/components/legal/public-page-shell";
import { SupportContactPanel } from "@/components/support/support-contact-panel";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export default async function ContactPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <PublicPageShell titleKey="legal_contact_title" leadKey="legal_contact_lead">
      <SupportContactPanel variant="dark" />
      <p className="mt-4 text-xs text-stone-500">{d.legal_contact_note}</p>
    </PublicPageShell>
  );
}

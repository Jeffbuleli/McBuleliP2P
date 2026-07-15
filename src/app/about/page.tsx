import Link from "next/link";
import { PublicBulletList, PublicPageShell } from "@/components/legal/public-page-shell";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export default async function AboutPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <PublicPageShell titleKey="legal_about_title" leadKey="legal_about_lead">
      <PublicBulletList items={[d.legal_about_1, d.legal_about_2, d.legal_about_3, d.legal_about_4]} />
      <p className="mt-6">
        <Link
          href="/whitepaper"
          className="inline-flex text-sm font-bold text-[#305F33] hover:underline"
        >
          {d.legal_about_whitepaper_cta} →
        </Link>
      </p>
    </PublicPageShell>
  );
}

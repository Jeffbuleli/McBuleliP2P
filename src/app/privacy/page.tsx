import Link from "next/link";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export default async function PrivacyPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Link
        href="/"
        className="text-sm font-semibold text-emerald-400 hover:underline"
      >
        ← {d.brand}
      </Link>
      <h1 className="mt-6 text-2xl font-bold text-stone-50">
        {d.legal_privacy_title}
      </h1>
      <p className="mt-4 text-pretty text-stone-400">{d.legal_privacy_body}</p>
    </div>
  );
}

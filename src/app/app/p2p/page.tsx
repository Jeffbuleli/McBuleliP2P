import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export default async function P2pPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-2 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/40">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          className="text-emerald-800 dark:text-emerald-200"
          aria-hidden
        >
          <path
            d="M8 7h13M8 12h13M8 17h13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">
        {d.p2p_title}
      </h1>
      <p className="max-w-sm text-pretty text-sm text-stone-600 dark:text-stone-400">
        {d.p2p_body}
      </p>
    </div>
  );
}

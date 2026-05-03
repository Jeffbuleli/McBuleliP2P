import Link from "next/link";
import Image from "next/image";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export default async function HomePage() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 pb-12 pt-14">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex w-full items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-lg shadow-black/10 ring-1 ring-emerald-900/10 dark:bg-stone-900 dark:ring-white/10">
            <Image
              src="/brand/logo.png"
              alt=""
              width={44}
              height={44}
              priority
            />
          </div>
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-300">
          {d.brand}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-stone-900 dark:text-stone-50">
          {d.home_title}
        </h1>
        <p className="mt-3 text-pretty text-stone-600 dark:text-stone-400">
          {d.home_sub}
        </p>
      </div>
      <div className="mt-auto flex flex-col gap-3">
        <Link
          href="/login"
          className="rounded-2xl bg-emerald-700 px-4 py-3 text-center text-lg font-semibold text-white shadow-lg shadow-emerald-900/20 active:scale-[0.99]"
        >
          {d.home_login}
        </Link>
        <Link
          href="/register"
          className="rounded-2xl border-2 border-rose-900/30 bg-white px-4 py-3 text-center text-lg font-semibold text-rose-950 active:scale-[0.99] dark:bg-stone-900 dark:text-rose-100"
        >
          {d.home_register}
        </Link>
      </div>
      <p className="mt-8 text-center text-xs text-stone-500 dark:text-stone-400">
        {d.home_note}
      </p>
    </div>
  );
}

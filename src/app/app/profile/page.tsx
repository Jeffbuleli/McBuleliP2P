import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { LangSwitch } from "@/components/lang-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const sessionUser = await getSessionUser();

  const staff =
    sessionUser?.role === "agent" || sessionUser?.role === "super_admin";

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div>
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">
          {d.profile_title}
        </h1>
        <p className="mt-1 truncate text-sm text-stone-600 dark:text-stone-400">
          {sessionUser?.email ?? "—"}
        </p>
      </div>

      <section className="flex flex-col gap-3 rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-stone-900">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          {d.profile_security}
        </p>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {d.security_trusted}. {d.home_note}
        </p>
      </section>

      <ThemeToggle />

      <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
        <p className="mb-3 text-sm font-medium text-stone-900 dark:text-stone-100">
          {d.profile_lang}
        </p>
        <LangSwitch />
      </div>

      {staff ? (
        <Link
          href="/admin"
          className="flex min-h-[52px] items-center justify-center rounded-2xl border-2 border-stone-800 bg-stone-900 py-3 text-lg font-semibold text-amber-100 active:scale-[0.99]"
        >
          {d.ops}
        </Link>
      ) : null}

      <LogoutButton className="min-h-[52px] w-full rounded-2xl border-2 border-rose-900/25 bg-white py-3.5 text-lg font-semibold text-rose-950 disabled:opacity-60 dark:bg-stone-900 dark:text-rose-100" />
    </div>
  );
}

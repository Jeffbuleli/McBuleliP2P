"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { formatAuthClientError } from "@/lib/format-auth-client-error";
import { useI18n } from "@/components/i18n-provider";

function RegisterForm() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref")?.trim() ?? "";
  const referralCode = refParam ? refParam.toUpperCase() : undefined;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          ...(referralCode ? { referralCode } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(formatAuthClientError(data));
        return;
      }
      router.push("/app");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-4 pb-10 pt-14">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-emerald-900/10 dark:bg-stone-900 dark:ring-white/10">
          <Image src="/brand/logo.png" alt="" width={30} height={30} priority />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-300">
            {t("brand")}
          </p>
          <h1 className="truncate text-2xl font-bold text-stone-900 dark:text-stone-50">
            {t("register_title")}
          </h1>
        </div>
      </div>
      <p className="text-sm text-stone-600 dark:text-stone-400">{t("register_sub")}</p>
      {referralCode ? (
        <p className="mt-3 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3 py-2 text-xs font-medium text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-100">
          {t("register_ref_active", { code: referralCode })}
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-stone-800">
          {t("email")}
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base outline-none ring-emerald-700 focus:ring-2 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-stone-800">
          {t("password")}
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base outline-none ring-emerald-700 focus:ring-2 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50"
          />
        </label>
        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 min-h-[52px] rounded-2xl bg-emerald-700 py-3 font-semibold text-white shadow-lg shadow-emerald-900/20 disabled:opacity-60 active:scale-[0.99]"
        >
          {loading ? t("registering") : t("register_btn")}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-600 dark:text-stone-400">
        {t("has_account")}{" "}
        <Link href="/login" className="font-semibold text-emerald-800 underline">
          {t("home_login")}
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto min-h-full max-w-md animate-pulse space-y-4 px-4 pb-10 pt-14">
          <div className="h-11 w-11 rounded-2xl bg-stone-200 dark:bg-stone-800" />
          <div className="h-8 w-48 rounded-lg bg-stone-200 dark:bg-stone-800" />
          <div className="h-4 w-full rounded bg-stone-200 dark:bg-stone-800" />
          <div className="mt-8 h-11 w-full rounded-xl bg-stone-200 dark:bg-stone-800" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

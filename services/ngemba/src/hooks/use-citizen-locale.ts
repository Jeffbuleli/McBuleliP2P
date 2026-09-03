"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isLocale, type Locale } from "@/lib/i18n";
import {
  readStoredLocale,
  resolveLocale,
  withLang,
  writeStoredLocale,
} from "@/lib/locale-prefs";

export function useCitizenLocale(fallbackFromServer?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const urlLang = params.get("lang") ?? fallbackFromServer ?? null;

  const [locale, setLocaleState] = useState<Locale>(() =>
    resolveLocale(urlLang),
  );

  useEffect(() => {
    const next = resolveLocale(urlLang);
    setLocaleState(next);
    writeStoredLocale(next);
  }, [urlLang]);

  useEffect(() => {
    if (urlLang && isLocale(urlLang)) return;
    const stored = readStoredLocale();
    if (!stored || stored === "fr") return;
    router.replace(withLang(pathname || "/", stored), { scroll: false });
  }, [urlLang, router, pathname]);

  const setLocale = useCallback(
    (code: Locale) => {
      writeStoredLocale(code);
      setLocaleState(code);
      const path =
        typeof window !== "undefined"
          ? window.location.pathname
          : "/";
      router.replace(withLang(path, code), { scroll: false });
    },
    [router],
  );

  const href = useCallback((path: string) => withLang(path, locale), [locale]);

  return useMemo(
    () => ({ locale, setLocale, href, withLang: href }),
    [locale, setLocale, href],
  );
}

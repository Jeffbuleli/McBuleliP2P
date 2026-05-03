"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/locale";
import { LOCALE_COOKIE } from "@/i18n/locale";
import {
  getDictionary,
  interpolate,
  type Messages,
} from "@/i18n/messages";

type Ctx = {
  locale: Locale;
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string;
  setLocale: (l: Locale) => void;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(initialLocale);

  useEffect(() => {
    setLocaleState(initialLocale);
  }, [initialLocale]);

  function setLocale(l: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${l};path=/;max-age=31536000;SameSite=Lax`;
    setLocaleState(l);
    router.refresh();
  }

  const value = useMemo((): Ctx => {
    const d = getDictionary(locale);
    return {
      locale,
      setLocale,
      t: (key, vars) => {
        const raw = d[key];
        return vars ? interpolate(raw, vars) : raw;
      },
    };
  }, [locale]);

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): Ctx {
  const x = useContext(I18nContext);
  if (!x) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return x;
}

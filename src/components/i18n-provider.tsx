"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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
  const [locale, setLocaleState] = useState(initialLocale);

  useEffect(() => {
    // Prefer cookie after client flag switch so RSC remounts don't snap back.
    const match = document.cookie.match(
      new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]*)`),
    );
    const fromCookie = match?.[1];
    if (fromCookie === "fr" || fromCookie === "en") {
      setLocaleState(fromCookie);
      document.documentElement.lang = fromCookie;
      return;
    }
    setLocaleState(initialLocale);
    document.documentElement.lang = initialLocale;
  }, [initialLocale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState((prev) => {
      if (prev === l) return prev;
      document.cookie = `${LOCALE_COOKIE}=${l};path=/;max-age=31536000;SameSite=Lax`;
      document.documentElement.lang = l;
      document.documentElement.classList.add("locale-switching");
      window.setTimeout(() => {
        document.documentElement.classList.remove("locale-switching");
      }, 220);
      return l;
    });
  }, []);

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
  }, [locale, setLocale]);

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

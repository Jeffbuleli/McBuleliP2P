import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { locales, type Locale } from "../lib/i18n";
import { readStoredLocale, writeStoredLocale } from "../lib/locale-prefs";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  ready: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void readStoredLocale().then((stored) => {
      if (stored) setLocaleState(stored);
      setReady(true);
    });
  }, []);

  const setLocale = useCallback((code: Locale) => {
    if (!locales.includes(code)) return;
    setLocaleState(code);
    void writeStoredLocale(code);
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale, ready }),
    [locale, setLocale, ready],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale outside provider");
  return ctx;
}

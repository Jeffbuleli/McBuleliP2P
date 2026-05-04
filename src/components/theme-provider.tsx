"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE = "mcbuleli-theme";

type Theme = "light" | "dark";

type Ctx = { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void };

const ThemeCtx = createContext<Ctx | null>(null);

function getInitial(): Theme {
  return "dark";
}

/** Product is dark-mode only; keeps session storage aligned for any legacy readers. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    setThemeState("dark");
    document.documentElement.classList.add("dark");
    localStorage.setItem(STORAGE, "dark");
  }, []);

  const setTheme = useCallback((t: Theme) => {
    if (t !== "dark") return;
    setThemeState("dark");
    localStorage.setItem(STORAGE, "dark");
    document.documentElement.classList.add("dark");
  }, []);

  const toggle = useCallback(() => {
    /* intentionally no-op: dark-only experience */
  }, []);

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme outside ThemeProvider");
  return ctx;
}

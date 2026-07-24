"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export const HACKATHON_THEME_STORAGE = "mcbuleli-hackathon-surface";

export type HackathonSurface = "light" | "dark";

type Ctx = {
  surface: HackathonSurface;
  toggle: () => void;
};

const HackathonThemeCtx = createContext<Ctx | null>(null);

export function useHackathonTheme() {
  const ctx = useContext(HackathonThemeCtx);
  if (!ctx) throw new Error("useHackathonTheme outside HackathonThemeShell");
  return ctx;
}

export function useOptionalHackathonTheme() {
  return useContext(HackathonThemeCtx);
}

function readStored(): HackathonSurface {
  try {
    const saved = localStorage.getItem(HACKATHON_THEME_STORAGE);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    /* ignore */
  }
  return "light";
}

function applyHtmlTheme(surface: HackathonSurface) {
  document.documentElement.setAttribute("data-hk-theme", surface);
}

export function HackathonThemeShell({ children }: { children: ReactNode }) {
  const [surface, setSurface] = useState<HackathonSurface>("light");

  useEffect(() => {
    const next = readStored();
    setSurface(next);
    applyHtmlTheme(next);
    return () => {
      document.documentElement.removeAttribute("data-hk-theme");
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(HACKATHON_THEME_STORAGE, surface);
    } catch {
      /* ignore */
    }
    applyHtmlTheme(surface);
  }, [surface]);

  const toggle = useCallback(() => {
    setSurface((s) => (s === "light" ? "dark" : "light"));
  }, []);

  return (
    <HackathonThemeCtx.Provider value={{ surface, toggle }}>
      <div
        className="hackathon-theme home-theme fd-public-light min-h-dvh"
        data-hk-theme={surface}
        suppressHydrationWarning
      >
        {children}
      </div>
    </HackathonThemeCtx.Provider>
  );
}

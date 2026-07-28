"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  HACKATHON_THEME_DEFAULT,
  HACKATHON_THEME_STORAGE,
  type HackathonSurface,
} from "@/lib/hackathon/theme-storage";

export type { HackathonSurface };
export { HACKATHON_THEME_STORAGE, HACKATHON_THEME_DEFAULT };

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
  return HACKATHON_THEME_DEFAULT;
}

function applyHtmlTheme(surface: HackathonSurface) {
  document.documentElement.setAttribute("data-hk-theme", surface);
}

export function HackathonThemeShell({ children }: { children: ReactNode }) {
  // Always match SSR + first client paint (light default) to avoid hydration mismatch.
  const [surface, setSurface] = useState<HackathonSurface>(HACKATHON_THEME_DEFAULT);

  useEffect(() => {
    const next = readStored();
    applyHtmlTheme(next);
    setSurface((prev) => (prev === next ? prev : next));
    return () => {
      document.documentElement.removeAttribute("data-hk-theme");
    };
  }, []);

  const toggle = useCallback(() => {
    setSurface((prev) => {
      const next: HackathonSurface = prev === "light" ? "dark" : "light";
      try {
        localStorage.setItem(HACKATHON_THEME_STORAGE, next);
      } catch {
        /* ignore */
      }
      applyHtmlTheme(next);
      return next;
    });
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

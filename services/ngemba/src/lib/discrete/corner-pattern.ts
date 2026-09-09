"use client";

import { useCallback, useRef } from "react";

export type CornerId = "bl" | "br" | "tl" | "tr";

const DEFAULT_SEQUENCE: CornerId[] = ["bl", "br", "tl"];

/** Séquence de coins : bas-gauche → bas-droit → haut-gauche (défaut). */
export function useCornerPattern(
  onTrigger: () => void,
  sequence: CornerId[] = DEFAULT_SEQUENCE,
  windowMs = 2800,
) {
  const steps = useRef<CornerId[]>([]);
  const startedAt = useRef(0);

  return useCallback(
    (corner: CornerId) => {
      const now = Date.now();
      if (!startedAt.current || now - startedAt.current > windowMs) {
        steps.current = [];
        startedAt.current = now;
      }
      const next = sequence[steps.current.length];
      if (corner !== next) {
        steps.current = corner === sequence[0] ? [corner] : [];
        startedAt.current = corner === sequence[0] ? now : 0;
        return;
      }
      steps.current.push(corner);
      if (steps.current.length >= sequence.length) {
        steps.current = [];
        startedAt.current = 0;
        onTrigger();
      }
    },
    [onTrigger, sequence, windowMs],
  );
}

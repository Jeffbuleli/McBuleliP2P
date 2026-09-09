"use client";

import type { CornerId } from "@/lib/discrete/corner-pattern";
import { useCornerPattern } from "@/lib/discrete/corner-pattern";

const ZONES: { id: CornerId; className: string }[] = [
  { id: "bl", className: "bottom-0 left-0" },
  { id: "br", className: "bottom-0 right-0" },
  { id: "tl", className: "top-0 left-0" },
  { id: "tr", className: "top-0 right-0" },
];

/**
 * Zones invisibles aux 4 coins (touch ~48px).
 * Séquence discrète : bas-gauche → bas-droit → haut-gauche.
 */
export function DiscreteCornerPads({ onTrigger }: { onTrigger: () => void }) {
  const register = useCornerPattern(onTrigger);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60]">
      {ZONES.map((z) => (
        <button
          key={z.id}
          type="button"
          tabIndex={-1}
          className={`pointer-events-auto absolute size-12 touch-manipulation bg-transparent opacity-0 ${z.className}`}
          onClick={() => register(z.id)}
        />
      ))}
    </div>
  );
}

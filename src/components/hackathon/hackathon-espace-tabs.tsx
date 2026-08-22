"use client";

export type EspaceTabId = "accueil" | "equipe" | "build" | "pitch" | "prix";

export function espaceTabFromPhase(phase: string): EspaceTabId {
  if (phase === "teams") return "equipe";
  if (phase === "development" || phase === "mentoring") return "build";
  if (phase === "pitch" || phase === "deliberation") return "pitch";
  if (phase === "awards" || phase === "incubation") return "prix";
  return "accueil";
}

export function espaceTabPanelClass(
  tab: EspaceTabId,
  active: EspaceTabId,
): string {
  return active === tab ? "block" : "hidden md:block";
}

export function HackathonEspaceTabBar({
  active,
  onChange,
  isFr,
}: {
  active: EspaceTabId;
  onChange: (tab: EspaceTabId) => void;
  isFr: boolean;
}) {
  const tabs: Array<{ id: EspaceTabId; labelFr: string; labelEn: string }> = [
    { id: "accueil", labelFr: "Accueil", labelEn: "Home" },
    { id: "equipe", labelFr: "Équipe", labelEn: "Team" },
    { id: "build", labelFr: "Build", labelEn: "Build" },
    { id: "pitch", labelFr: "Pitch", labelEn: "Pitch" },
    { id: "prix", labelFr: "Prix", labelEn: "Awards" },
  ];

  return (
    <nav
      className="sticky top-0 z-20 -mx-1 mb-4 flex gap-1 overflow-x-auto rounded-2xl border border-[color:var(--hk-border,var(--fd-border))] bg-[color:var(--hk-surface,var(--fd-card))] p-1 shadow-sm md:hidden"
      aria-label={isFr ? "Sections Mon espace" : "My hub sections"}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`shrink-0 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
            active === tab.id
              ? "bg-[color:var(--hk-accent,var(--fd-primary))] text-white"
              : "text-[color:var(--hk-muted,var(--fd-muted))]"
          }`}
        >
          {isFr ? tab.labelFr : tab.labelEn}
        </button>
      ))}
    </nav>
  );
}

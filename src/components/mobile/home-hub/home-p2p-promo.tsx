import Link from "next/link";
import { IconP2P } from "@/components/icons/flow-icons";
import { HUD_PANEL_LG, HudFrame } from "@/components/ui/hud-frame";

export function HomeP2pPromo({ fr }: { fr: boolean }) {
  return (
    <HudFrame accent="amber" className={`${HUD_PANEL_LG} p-4`}>
      <section aria-label="P2P">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-500/15 text-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.12)]">
            <IconP2P className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="fd-section-title text-amber-200">P2P</h2>
            <p className="mt-0.5 fd-section-muted">
              {fr
                ? "Échangez crypto en séquestre avec mobile money."
                : "Trade crypto in escrow with mobile money."}
            </p>
          </div>
          <Link
            href="/app/p2p"
            className="shrink-0 rounded-full border border-amber-400/45 bg-amber-500/12 px-3 py-2 text-[10px] font-extrabold text-amber-300 transition active:scale-[0.98] hover:bg-amber-500/22"
          >
            {fr ? "Voir →" : "Browse →"}
          </Link>
        </div>
      </section>
    </HudFrame>
  );
}

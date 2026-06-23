import Link from "next/link";
import { IconP2P } from "@/components/icons/flow-icons";

export function HomeP2pPromo({ fr }: { fr: boolean }) {
  return (
    <section className="fd-card flex items-center gap-3 p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--fd-primary)] text-white">
        <IconP2P className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="fd-section-title">P2P</h2>
        <p className="mt-0.5 fd-section-muted">
          {fr
            ? "Échangez crypto en séquestre avec mobile money."
            : "Trade crypto in escrow with mobile money."}
        </p>
      </div>
      <Link
        href="/app/p2p"
        className="shrink-0 rounded-xl bg-[color:var(--fd-mint)] px-3 py-2 text-xs font-bold text-[color:var(--fd-primary)]"
      >
        {fr ? "Voir →" : "Browse →"}
      </Link>
    </section>
  );
}

import { Suspense } from "react";
import { MiningSimulatorClient } from "@/components/game/mining-simulator-client";

export const dynamic = "force-dynamic";

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-[#78716c]">
          …
        </div>
      }
    >
      <MiningSimulatorClient />
    </Suspense>
  );
}

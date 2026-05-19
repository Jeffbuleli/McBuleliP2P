"use client";

import { useI18n } from "@/components/i18n-provider";
import { FlowSection } from "@/components/p2p/p2p-flow-ui";

export function P2pProofPreview({
  dataUrl,
  compact,
}: {
  dataUrl: string;
  compact?: boolean;
}) {
  const { t } = useI18n();
  return (
    <FlowSection title={t("p2p_proof_title")} hint={compact ? undefined : t("p2p_proof_hint")}>
      <div
        className={`overflow-hidden rounded-2xl border border-[color:var(--fd-border)] bg-white ${compact ? "max-h-48" : "max-h-72"}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUrl}
          alt={t("p2p_proof_title")}
          className="h-full w-full object-contain"
        />
      </div>
    </FlowSection>
  );
}

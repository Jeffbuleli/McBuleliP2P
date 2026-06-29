"use client";

import { FiatChannelIcon, resolveFiatChannelId } from "@/components/wallet/fiat-channel-icon";
import { flowPickBtnClass } from "@/components/wallet/wallet-flow-shell";

export function FiatProviderPicker({
  providers,
  value,
  onChange,
  disabled,
}: {
  providers: { provider: string; label: string }[];
  value: string;
  onChange: (provider: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {providers.map((p) => {
        const channel = resolveFiatChannelId({ provider: p.provider });
        const active = value === p.provider;
        return (
          <button
            key={p.provider}
            type="button"
            disabled={disabled}
            onClick={() => onChange(p.provider)}
            className={`flex items-center gap-2 text-left disabled:opacity-45 ${flowPickBtnClass(active)}`}
          >
            <FiatChannelIcon channel={channel} className="h-8 w-8 shrink-0" />
            <span className="min-w-0 truncate text-xs font-bold text-[color:var(--fd-text)]">
              {p.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

"use client";

export function P2pPaymentPickChips({
  options,
  value,
  onChange,
  accent = "buy",
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  accent?: "buy" | "sell";
}) {
  if (options.length <= 1) return null;
  const onCls =
    accent === "sell"
      ? "bg-[color:var(--fd-sell)] text-white ring-[color:var(--fd-sell)]"
      : "bg-[color:var(--fd-primary)] text-white ring-[color:var(--fd-primary)]";
  const offCls = "bg-white text-[color:var(--fd-text)] ring-[color:var(--fd-border)]";

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${on ? onCls : offCls}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

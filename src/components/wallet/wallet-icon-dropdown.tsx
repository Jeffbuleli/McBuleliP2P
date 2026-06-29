"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export type IconDropdownOption = {
  id: string;
  label: string;
  icon?: ReactNode;
};

export function WalletIconDropdown({
  label,
  labelClass,
  value,
  onChange,
  options,
  hideLabel = false,
}: {
  label: string;
  labelClass?: string;
  value: string;
  onChange: (id: string) => void;
  options: IconDropdownOption[];
  hideLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open || !buttonRef.current) return;

    function syncMenuPosition() {
      const button = buttonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 136),
        zIndex: 200,
      });
    }

    syncMenuPosition();
    window.addEventListener("resize", syncMenuPosition);
    window.addEventListener("scroll", syncMenuPosition, true);
    return () => {
      window.removeEventListener("resize", syncMenuPosition);
      window.removeEventListener("scroll", syncMenuPosition, true);
    };
  }, [open]);

  const selected = options.find((o) => o.id === value) ?? options[0];

  return (
    <div ref={rootRef} className={`relative min-w-0 ${open ? "z-[50]" : ""}`}>
      {!hideLabel && label ? (
        <span
          className={`block font-mono text-[9px] font-bold uppercase tracking-[0.16em] ${labelClass ?? ""}`}
        >
          {label}
        </span>
      ) : null}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`wallet-swap-asset-btn flex w-full min-w-0 items-center gap-1.5 ${hideLabel ? "" : "mt-1"}`}
      >
        {selected?.icon ? <span className="shrink-0">{selected.icon}</span> : null}
        <span className="min-w-0 flex-1 truncate text-left text-xs font-bold">{selected?.label}</span>
        <span className="shrink-0 text-[color:var(--fd-muted)]">▾</span>
      </button>
      {open ? (
        <div
          className="wallet-swap-asset-menu min-w-[8.5rem] shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
          style={menuStyle}
        >
          {options.map((opt) => (
            <button
              key={opt.id || "all"}
              type="button"
              onClick={() => {
                onChange(opt.id);
                setOpen(false);
              }}
              className={`wallet-swap-asset-option ${opt.id === value ? "wallet-swap-asset-option-active" : ""}`}
            >
              {opt.icon ? <span className="shrink-0">{opt.icon}</span> : null}
              <span className="truncate font-bold">{opt.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

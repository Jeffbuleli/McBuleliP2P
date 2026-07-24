"use client";

import {
  createContext,
  useContext,
  useId,
  useState,
  type ReactNode,
} from "react";

type AccordionCtx = {
  open: string | null;
  toggle: (id: string) => void;
};

const Ctx = createContext<AccordionCtx | null>(null);

export function Accordion({
  children,
  defaultOpen,
  open: openControlled,
  onOpenChange,
  className = "space-y-2",
}: {
  children: ReactNode;
  defaultOpen?: string;
  /** Controlled open item id (null = all closed). */
  open?: string | null;
  onOpenChange?: (id: string | null) => void;
  className?: string;
}) {
  const [openUncontrolled, setOpenUncontrolled] = useState<string | null>(
    defaultOpen ?? null,
  );
  const controlled = openControlled !== undefined;
  const open = controlled ? openControlled : openUncontrolled;
  const toggle = (id: string) => {
    const next = open === id ? null : id;
    if (!controlled) setOpenUncontrolled(next);
    onOpenChange?.(next);
  };
  return (
    <Ctx.Provider value={{ open, toggle }}>
      <div className={className}>{children}</div>
    </Ctx.Provider>
  );
}

export function AccordionItem({
  id: itemId,
  title,
  subtitle,
  icon,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("AccordionItem must be inside Accordion");
  const { open, toggle } = ctx;
  const isOpen = open === itemId;
  const panelId = useId();
  const triggerId = useId();

  return (
    <div className="overflow-hidden rounded-[22px] border border-[#E5E5E0] bg-white shadow-[0_14px_44px_-28px_rgba(34,34,34,0.28)]">
      <button
        type="button"
        id={triggerId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => toggle(itemId)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-[#EAF6EE]/60 sm:px-5"
      >
        {icon ? (
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF6EE] text-[#1F6B43]">
            {icon}
          </span>
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="block font-extrabold tracking-tight text-[#222222]">{title}</span>
          {subtitle ? (
            <span className="mt-0.5 block text-sm text-[#8A8A8A]">{subtitle}</span>
          ) : null}
        </span>
        <span
          className={`shrink-0 text-lg font-light text-[#1F6B43] transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
          aria-hidden
        >
          +
        </span>
      </button>
      {isOpen ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={triggerId}
          className="border-t border-[#E5E5E0] px-4 py-4 sm:px-5"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

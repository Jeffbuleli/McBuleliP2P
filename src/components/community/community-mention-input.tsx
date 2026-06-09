"use client";

import { useEffect, useRef, useState } from "react";

type HandleHit = { handle: string; displayName: string };

export function CommunityMentionInput({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onSubmit?: () => void;
}) {
  const [suggestions, setSuggestions] = useState<HandleHit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const mentionStart = useRef<number | null>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const pos = el.selectionStart ?? value.length;
    const before = value.slice(0, pos);
    const match = before.match(/@([a-z0-9_]*)$/i);
    if (!match) {
      setOpen(false);
      setSuggestions([]);
      mentionStart.current = null;
      return;
    }

    const q = match[1] ?? "";
    mentionStart.current = before.length - match[0].length;
    const t = window.setTimeout(() => {
      void fetch(`/api/community/profiles/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d: { handles?: HandleHit[] }) => {
          const hits = d.handles ?? [];
          setSuggestions(hits);
          setOpen(hits.length > 0);
          setActive(0);
        })
        .catch(() => {
          setOpen(false);
          setSuggestions([]);
        });
    }, 120);
    return () => window.clearTimeout(t);
  }, [value]);

  const insertHandle = (handle: string) => {
    const start = mentionStart.current;
    if (start === null) return;
    const el = inputRef.current;
    const pos = el?.selectionStart ?? value.length;
    const next = `${value.slice(0, start)}@${handle} ${value.slice(pos)}`;
    onChange(next);
    setOpen(false);
    setSuggestions([]);
    mentionStart.current = null;
    requestAnimationFrame(() => {
      const cursor = start + handle.length + 2;
      el?.setSelectionRange(cursor, cursor);
      el?.focus();
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (open && suggestions.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const hit = suggestions[active];
        if (hit) insertHandle(hit.handle);
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="relative min-w-0 flex-1">
      <input
        ref={inputRef}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className={className}
      />
      {open ? (
        <ul className="absolute bottom-full left-0 z-20 mb-1 max-h-40 w-full overflow-y-auto rounded-xl border border-[#e8f3ee] bg-white py-1 shadow-lg">
          {suggestions.map((s, i) => (
            <li key={s.handle}>
              <button
                type="button"
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                  i === active ? "bg-[#f0f7f3]" : "hover:bg-[#fafafa]"
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertHandle(s.handle);
                }}
              >
                <span className="font-semibold text-[#305f33]">@{s.handle}</span>
                <span className="truncate text-[#78716c]">{s.displayName}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

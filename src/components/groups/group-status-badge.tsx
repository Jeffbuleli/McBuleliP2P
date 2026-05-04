"use client";

export function GroupStatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase?.() ?? "";
  const cls =
    s === "active"
      ? "bg-emerald-600/15 text-emerald-300 ring-emerald-500/20"
      : s === "pending" || s === "approved"
        ? "bg-amber-600/15 text-amber-200 ring-amber-500/20"
        : s === "suspended"
          ? "bg-rose-600/15 text-rose-200 ring-rose-500/20"
          : s === "closed" || s === "rejected"
            ? "bg-stone-600/15 text-stone-200 ring-stone-500/20"
            : "bg-stone-600/15 text-stone-200 ring-stone-500/20";

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${cls}`}>
      {status}
    </span>
  );
}


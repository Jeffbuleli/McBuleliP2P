import type { CommunityContentKind } from "@/lib/community/post-types";
import { postTypeConfig } from "@/lib/community/post-types";

function TypeIcon({ kind }: { kind: CommunityContentKind }) {
  const c = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const };
  if (kind === "news") {
    return (
      <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden>
        <rect x="3" y="4" width="18" height="14" rx="2" {...c} />
        <path d="M7 9h10M7 13h6" {...c} />
      </svg>
    );
  }
  if (kind === "discussion") {
    return (
      <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden>
        <path d="M4 6h14a2 2 0 012 2v8a2 2 0 01-2 2H9l-5 4V8a2 2 0 012-2z" {...c} />
      </svg>
    );
  }
  if (kind === "question") {
    return (
      <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="9" {...c} />
        <path d="M9.5 9.5a3 3 0 015 1c0 2-2 2-2 3M12 17h.01" {...c} />
      </svg>
    );
  }
  if (kind === "signal") {
    return (
      <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden>
        <path d="M4 19h16M6 16l4-8 4 5 4-9" {...c} />
      </svg>
    );
  }
  if (kind === "article") {
    return (
      <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden>
        <path d="M6 4h12v16H6zM9 8h6M9 12h6" {...c} />
      </svg>
    );
  }
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9" {...c} />
    </svg>
  );
}

export function CommunityPostTypeChip({
  kind,
  fr,
}: {
  kind: CommunityContentKind;
  fr: boolean;
}) {
  const cfg = postTypeConfig(kind);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      <TypeIcon kind={kind} />
      {fr ? cfg.labelFr : cfg.labelEn}
    </span>
  );
}

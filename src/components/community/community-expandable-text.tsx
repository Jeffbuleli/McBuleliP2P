"use client";

import { useState } from "react";

export function CommunityExpandableText({
  text,
  fr,
  maxChars = 180,
  className = "",
}: {
  text: string;
  fr: boolean;
  maxChars?: number;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const needsMore = text.length > maxChars;
  const shown =
    expanded || !needsMore ? text : `${text.slice(0, maxChars).trim()}…`;

  return (
    <p className={`whitespace-pre-wrap break-words ${className}`}>
      {shown}
      {needsMore && !expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="ml-1 font-semibold text-[#78716c] hover:text-[#305f33]"
        >
          {fr ? "Voir plus" : "See more"}
        </button>
      ) : null}
    </p>
  );
}

"use client";

import { useState } from "react";
import { CommunityTranslatableText } from "@/components/community/community-translatable-text";

export function CommunityExpandableText({
  text,
  fr,
  maxChars = 180,
  className = "",
  withMentions = false,
}: {
  text: string;
  fr: boolean;
  maxChars?: number;
  className?: string;
  withMentions?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const needsMore = text.length > maxChars;
  const shown =
    expanded || !needsMore ? text : `${text.slice(0, maxChars).trim()}…`;

  return (
    <div>
      <CommunityTranslatableText
        text={shown}
        sourceText={text}
        fr={fr}
        withMentions={withMentions}
        truncateTranslationAt={!expanded && needsMore ? maxChars : undefined}
        className={`whitespace-pre-wrap break-words ${className}`}
      />
      {needsMore && !expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="ml-1 font-semibold text-[#78716c] hover:text-[#305f33]"
        >
          {fr ? "Voir plus" : "See more"}
        </button>
      ) : null}
    </div>
  );
}

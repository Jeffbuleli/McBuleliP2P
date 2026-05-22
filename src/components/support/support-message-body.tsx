"use client";

import { parseSupportMarkup } from "@/lib/support-rich-text";

export function SupportMessageBody({
  body,
  mentionHandles,
  className = "",
}: {
  body: string;
  mentionHandles?: Map<string, string>;
  className?: string;
}) {
  const nodes = parseSupportMarkup(body, mentionHandles);
  return (
    <p
      className={`whitespace-pre-wrap break-words text-sm leading-relaxed text-[color:var(--fd-text)] [overflow-wrap:anywhere] ${className}`}
    >
      {nodes}
    </p>
  );
}

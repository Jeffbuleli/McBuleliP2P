"use client";

import { parseSupportMarkup } from "@/lib/support-rich-text";

export function SupportMessageBody({
  body,
  mentionHandles,
}: {
  body: string;
  mentionHandles?: Map<string, string>;
}) {
  const nodes = parseSupportMarkup(body, mentionHandles);
  return <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{nodes}</p>;
}

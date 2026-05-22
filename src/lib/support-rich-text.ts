import type { ReactNode } from "react";
import { createElement } from "react";

const URL_RE =
  /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/gi;

/** Lightweight markup: **bold**, *italic*, __underline__, auto-links, @mentions. */
export function parseSupportMarkup(
  body: string,
  mentionLabels?: Map<string, string>,
): ReactNode[] {
  const parts: ReactNode[] = [];
  let key = 0;
  const pushText = (chunk: string) => {
    if (!chunk) return;
    const nodes = splitUrls(chunk, () => key++);
    parts.push(...nodes);
  };

  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|@\w[\w.-]*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    pushText(body.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        createElement("strong", { key: key++ }, token.slice(2, -2)),
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(createElement("em", { key: key++ }, token.slice(1, -1)));
    } else if (token.startsWith("__") && token.endsWith("__")) {
      parts.push(
        createElement(
          "span",
          { key: key++, className: "underline" },
          token.slice(2, -2),
        ),
      );
    } else if (token.startsWith("@")) {
      const handle = token.slice(1);
      const label = mentionLabels?.get(handle.toLowerCase()) ?? token;
      parts.push(
        createElement(
          "span",
          {
            key: key++,
            className:
              "rounded bg-emerald-100/90 px-1 font-semibold text-emerald-900",
          },
          label.startsWith("@") ? label : `@${label}`,
        ),
      );
    } else {
      pushText(token);
    }
    last = m.index + token.length;
  }
  pushText(body.slice(last));
  return parts.length ? parts : [body];
}

function splitUrls(text: string, nextKey: () => number): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  URL_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = URL_RE.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const href = m[0];
    out.push(
      createElement(
        "a",
        {
          key: nextKey(),
          href,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "font-medium text-sky-800 underline break-all",
        },
        href,
      ),
    );
    last = m.index + href.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length ? out : [text];
}

export function bodyHasLink(body: string): boolean {
  const trimmed = body.trim();
  if (!trimmed) return false;
  URL_RE.lastIndex = 0;
  return URL_RE.test(trimmed);
}

export function extractMentionHandles(body: string): string[] {
  const handles = new Set<string>();
  const re = /@([\w][\w.-]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    handles.add(m[1].toLowerCase());
  }
  return [...handles];
}

export function wrapSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  wrap: "**" | "*" | "__",
): { next: string; cursor: number } {
  const selected = value.slice(selectionStart, selectionEnd);
  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionEnd);
  const inner = selected || "text";
  const next = `${before}${wrap}${inner}${wrap}${after}`;
  const cursor = before.length + wrap.length + inner.length + wrap.length;
  return { next, cursor };
}

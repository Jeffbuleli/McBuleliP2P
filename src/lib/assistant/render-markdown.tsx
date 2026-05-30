import type { ReactNode } from "react";
import Link from "next/link";

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\/app\/[^\s),]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(text.slice(last, m.index));
    }
    const token = m[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("[") && token.includes("](")) {
      const match = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
      if (match) {
        const [, label, href] = match;
        nodes.push(
          <Link
            key={`${keyPrefix}-l-${i}`}
            href={href}
            className="font-semibold text-[#6ee7a0] underline underline-offset-2"
          >
            {label}
          </Link>,
        );
      } else {
        nodes.push(token);
      }
    } else if (token.startsWith("/app/") || token.startsWith("/login") || token.startsWith("/register")) {
      nodes.push(
        <Link
          key={`${keyPrefix}-p-${i}`}
          href={token.replace(/[.,;:!?]+$/, "")}
          className="font-semibold text-[#6ee7a0] underline underline-offset-2"
        >
          {token}
        </Link>,
      );
    } else {
      nodes.push(token);
    }
    last = m.index + token.length;
    i++;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function isHeading(line: string): { level: number; text: string } | null {
  const h3 = /^###\s+(.+)$/.exec(line.trim());
  if (h3) return { level: 3, text: h3[1]!.replace(/^\*\*|\*\*$/g, "") };
  const h2 = /^##\s+(.+)$/.exec(line.trim());
  if (h2) return { level: 2, text: h2[1]!.replace(/^\*\*|\*\*$/g, "") };
  const boldTitle = /^\*\*(.+)\*\*$/.exec(line.trim());
  if (boldTitle) return { level: 3, text: boldTitle[1]! };
  return null;
}

/** Lightweight markdown for assistant replies (headings, lists, bold, links). */
export function RenderAssistantMarkdown({ text }: { text: string }) {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const lines = normalized.split("\n");
  const blocks: ReactNode[] = [];
  let ul: string[] = [];
  let ol: string[] = [];
  let blockIdx = 0;

  const flushList = () => {
    if (ul.length) {
      blocks.push(
        <ul
          key={`ul-${blockIdx++}`}
          className="my-2 list-disc space-y-1.5 pl-4 marker:text-[#6ee7a0]"
        >
          {ul.map((item, j) => (
            <li key={j} className="leading-relaxed">
              {renderInline(item, `ul-${blockIdx}-${j}`)}
            </li>
          ))}
        </ul>,
      );
      ul = [];
    }
    if (ol.length) {
      blocks.push(
        <ol
          key={`ol-${blockIdx++}`}
          className="my-2 list-decimal space-y-1.5 pl-4 marker:font-semibold marker:text-[#6ee7a0]"
        >
          {ol.map((item, j) => (
            <li key={j} className="leading-relaxed">
              {renderInline(item, `ol-${blockIdx}-${j}`)}
            </li>
          ))}
        </ol>,
      );
      ol = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    const heading = isHeading(trimmed);
    if (heading) {
      flushList();
      blocks.push(
        <p
          key={`h-${blockIdx++}`}
          className={`font-bold text-white ${
            heading.level <= 2 ? "mt-3 text-[14px]" : "mt-2.5 text-[13px]"
          }`}
        >
          {renderInline(heading.text, `h-${blockIdx}`)}
        </p>,
      );
      continue;
    }

    const bullet = /^[-*•]\s+(.+)$/.exec(trimmed);
    if (bullet) {
      ol = [];
      ul.push(bullet[1]!);
      continue;
    }

    const numbered = /^\d+[.)]\s+(.+)$/.exec(trimmed);
    if (numbered) {
      ul = [];
      ol.push(numbered[1]!);
      continue;
    }

    flushList();
    blocks.push(
      <p key={`p-${blockIdx++}`} className="my-1.5 leading-relaxed">
        {renderInline(trimmed, `p-${blockIdx}`)}
      </p>,
    );
  }

  flushList();
  return <div className="space-y-0.5">{blocks}</div>;
}

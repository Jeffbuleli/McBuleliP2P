import Link from "next/link";

const RICH_TEXT_RE = /(@[a-z][a-z0-9_]{2,31}|#[\p{L}\p{N}_]{2,40})/giu;

export function CommunityMentionText({ text }: { text: string }) {
  const parts = text.split(RICH_TEXT_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        if (part.startsWith("@")) {
          const handle = part.slice(1).toLowerCase();
          return (
            <Link
              key={`@${handle}-${i}`}
              href={`/app/community/u/${handle}`}
              className="font-semibold text-[#305f33] hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        if (part.startsWith("#")) {
          const tag = part.slice(1).toLowerCase();
          return (
            <Link
              key={`#${tag}-${i}`}
              href={`/app/community/tag/${encodeURIComponent(tag)}`}
              className="font-semibold text-[#229ed9] hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

import Link from "next/link";

const MENTION_RE = /(@[a-z][a-z0-9_]{2,31})/gi;

export function CommunityMentionText({ text }: { text: string }) {
  const parts = text.split(MENTION_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          const handle = part.slice(1).toLowerCase();
          return (
            <Link
              key={`${handle}-${i}`}
              href={`/app/community/u/${handle}`}
              className="font-semibold text-[#305f33] hover:underline"
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

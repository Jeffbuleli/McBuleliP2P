import Link from "next/link";
import {
  communityProfileCanonicalPath,
  communityProfileAppPath,
  communityTagSharePath,
  communityTagAppPath,
} from "@/lib/community/share-url";

const RICH_TEXT_RE = /(@[a-z][a-z0-9_]{2,31}|#[\p{L}\p{N}_]{2,40})/giu;

/**
 * @param publicLinks - use crawlable /community/* URLs (SEO share pages).
 *   Default false keeps in-app /app/community/* deep links for logged-in UI.
 */
export function CommunityMentionText({
  text,
  publicLinks = false,
}: {
  text: string;
  publicLinks?: boolean;
}) {
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
              href={
                publicLinks
                  ? communityProfileCanonicalPath(handle)
                  : communityProfileAppPath(handle)
              }
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
              href={
                publicLinks
                  ? communityTagSharePath(tag)
                  : communityTagAppPath(tag)
              }
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

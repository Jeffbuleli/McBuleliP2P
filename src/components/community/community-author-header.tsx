import Link from "next/link";
import {
  KycVerifiedBadge,
  ReputationLevelBadge,
} from "@/components/community/community-badges";
import { COMMUNITY_AVATAR_RING, COMMUNITY_META_TEXT } from "@/lib/community/community-ui";
import { formatRelativeTime } from "@/lib/community/relative-time";
import type { CommunityAuthorView } from "@/lib/community/profile-service";

export function CommunityAuthorHeader({
  author,
  publishedAt,
  fr,
  compact = false,
}: {
  author: CommunityAuthorView;
  publishedAt?: string;
  fr: boolean;
  compact?: boolean;
}) {
  const size = compact ? "h-9 w-9 text-[10px]" : "h-11 w-11 text-sm";

  return (
    <div className="flex min-w-0 items-start gap-3">
      <Link
        href={`/app/community/u/${author.handle}`}
        className={`relative flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#e8f3ee] to-[#d4ebe0] font-bold text-[#305f33] ${COMMUNITY_AVATAR_RING}`}
      >
        {author.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={author.avatarUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          author.displayName.slice(0, 1).toUpperCase()
        )}
      </Link>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href={`/app/community/u/${author.handle}`}
            className="truncate text-[15px] font-bold tracking-[-0.02em] text-[#0c0a09] hover:text-[#305f33]"
          >
            {author.displayName}
          </Link>
          {author.showKycBadge ? <KycVerifiedBadge fr={fr} /> : null}
          {author.reputationLevel ? (
            <ReputationLevelBadge levelId={author.reputationLevel} fr={fr} />
          ) : null}
        </div>
        <p className={`mt-0.5 ${COMMUNITY_META_TEXT}`}>
          <Link
            href={`/app/community/u/${author.handle}`}
            className="font-semibold text-[#57534e] hover:text-[#305f33]"
          >
            @{author.handle}
          </Link>
          {publishedAt ? (
            <>
              <span className="text-[#d6d3d1]"> · </span>
              <time dateTime={publishedAt}>{formatRelativeTime(publishedAt, fr)}</time>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}

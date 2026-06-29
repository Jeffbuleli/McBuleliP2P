import Link from "next/link";
import { CommunityAvatar } from "@/components/community/community-avatar";
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
        className={`relative flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full ${COMMUNITY_AVATAR_RING}`}
      >
        <CommunityAvatar
          label={author.displayName}
          avatarUrl={author.avatarUrl}
          sizeClass={size}
          textClass={compact ? "text-[10px]" : "text-sm"}
        />
      </Link>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href={`/app/community/u/${author.handle}`}
            className="truncate text-[15px] font-bold tracking-[-0.02em] text-stone-50 hover:text-emerald-300"
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
            className="font-semibold text-stone-400 hover:text-cyan-300"
          >
            @{author.handle}
          </Link>
          {publishedAt ? (
            <>
              <span className="text-stone-600"> · </span>
              <time dateTime={publishedAt}>{formatRelativeTime(publishedAt, fr)}</time>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}

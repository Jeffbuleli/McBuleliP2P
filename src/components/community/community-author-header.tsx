import Link from "next/link";
import {
  KycVerifiedBadge,
  ReputationLevelBadge,
} from "@/components/community/community-badges";
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
  const size = compact ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs";

  return (
    <div className="flex min-w-0 items-start gap-3">
      <Link
        href={`/app/community/u/${author.handle}`}
        className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8f3ee] font-bold text-[#305f33]`}
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
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href={`/app/community/u/${author.handle}`}
            className="truncate text-sm font-bold text-[#0c0a09]"
          >
            {author.displayName}
          </Link>
          {author.showKycBadge ? <KycVerifiedBadge fr={fr} /> : null}
          {author.reputationLevel ? (
            <ReputationLevelBadge levelId={author.reputationLevel} fr={fr} />
          ) : null}
        </div>
        <p className="mt-0.5 text-[11px] text-[#a8a29e]">
          <Link href={`/app/community/u/${author.handle}`} className="font-medium text-[#78716c]">
            @{author.handle}
          </Link>
          {publishedAt ? (
            <>
              {" · "}
              <time dateTime={publishedAt}>{formatRelativeTime(publishedAt, fr)}</time>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}

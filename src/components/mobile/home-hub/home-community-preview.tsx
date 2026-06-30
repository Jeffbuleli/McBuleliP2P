import Link from "next/link";
import { CommunityAvatar } from "@/components/community/community-avatar";
import type { TraderLeaderboardEntry } from "@/lib/community/leaderboard-service";
import { postDisplayText } from "@/lib/community/link-embed";
import type { UnifiedFeedItem } from "@/lib/community/unified-feed-service";

export function HomeCommunityPreview({
  fr,
  posts,
  traders,
}: {
  fr: boolean;
  posts: UnifiedFeedItem[];
  traders: TraderLeaderboardEntry[];
}) {
  if (posts.length === 0 && traders.length === 0) return null;

  return (
    <section className="fd-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="fd-section-title">
            {fr ? "Communauté" : "Community"}
          </h2>
          <p className="mt-0.5 fd-section-muted">
            {fr ? "Tendances et traders actifs" : "Trending & active traders"}
          </p>
        </div>
        <Link
          href="/app/community"
          className="shrink-0 text-xs font-extrabold text-[color:var(--fd-primary)]"
        >
          {fr ? "Explorer →" : "Explore →"}
        </Link>
      </div>

      {traders.length > 0 ? (
        <div className="mb-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
            {fr ? "Top traders" : "Top traders"}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            {traders.map((t) => (
              <Link
                key={t.userId}
                href={`/app/community/u/${t.handle}`}
                className="flex min-w-[5.5rem] shrink-0 flex-col items-center rounded-xl border border-[color:var(--fd-border)] bg-white px-2 py-2 transition active:scale-[0.98]"
              >
                <CommunityAvatar
                  label={t.displayName}
                  avatarUrl={t.avatarUrl}
                  sizeClass="h-10 w-10"
                  textClass="text-sm"
                />
                <span className="mt-1 max-w-full truncate text-[10px] font-bold text-[color:var(--fd-text)]">
                  {t.displayName}
                </span>
                <span className="text-[9px] font-semibold tabular-nums text-[color:var(--fd-muted)]">
                  {t.reputationScore} BP
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {posts.length > 0 ? (
        <ul className="space-y-2">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={post.href}
                className="block rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-2.5 transition active:scale-[0.99]"
              >
                <div className="flex items-start gap-2.5">
                  <CommunityAvatar
                    label={post.author.displayName}
                    avatarUrl={post.author.avatarUrl}
                    sizeClass="h-9 w-9"
                    textClass="text-xs"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-[color:var(--fd-text)]">
                      {post.author.displayName}
                    </span>
                    <span className="mt-0.5 block line-clamp-2 text-[11px] leading-snug text-[color:var(--fd-muted)]">
                      {postDisplayText(post.body)}
                    </span>
                    <span className="mt-1 block text-[10px] font-semibold tabular-nums text-[color:var(--fd-muted)]">
                      {post.likeCount} {fr ? "j'aime" : "likes"} · {post.commentCount}{" "}
                      {fr ? "com." : "comments"}
                    </span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

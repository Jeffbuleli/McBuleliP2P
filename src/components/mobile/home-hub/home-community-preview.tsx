import Link from "next/link";
import { CommunityAvatar } from "@/components/community/community-avatar";
import { HUD_PANEL_LG, HudFrame } from "@/components/ui/hud-frame";
import type { TraderLeaderboardEntry } from "@/lib/community/leaderboard-service";
import { postDisplayText } from "@/lib/community/link-embed";
import type { UnifiedFeedItem } from "@/lib/community/unified-feed-service";

const INNER_TILE =
  "rounded-xl border border-white/10 bg-[#0a1018]/85 transition active:scale-[0.98] hover:border-fuchsia-400/25";

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
    <HudFrame accent="magenta" className={`${HUD_PANEL_LG} p-4`}>
      <section aria-label={fr ? "Communauté" : "Community"}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="fd-section-title text-fuchsia-200">{fr ? "Communauté" : "Community"}</h2>
            <p className="mt-0.5 fd-section-muted">{fr ? "Tendances et traders actifs" : "Trending & active traders"}</p>
          </div>
          <Link
            href="/app/community"
            className="shrink-0 rounded-full border border-fuchsia-400/35 bg-fuchsia-500/10 px-2.5 py-1 text-[10px] font-extrabold text-fuchsia-300 transition active:scale-[0.98]"
          >
            {fr ? "Explorer →" : "Explore →"}
          </Link>
        </div>

        {traders.length > 0 ? (
          <div className="mb-3">
            <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-fuchsia-400/75">
              {fr ? "Top traders" : "Top traders"}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 app-scrollbar">
              {traders.map((t) => (
                <Link
                  key={t.userId}
                  href={`/app/community/u/${t.handle}`}
                  className={`flex min-w-[5.5rem] shrink-0 flex-col items-center px-2 py-2 ${INNER_TILE}`}
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
                  <span className="text-[9px] font-semibold tabular-nums text-amber-300/90">
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
                <Link href={post.href} className={`block px-3 py-2.5 ${INNER_TILE}`}>
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
                      <span className="mt-1 block text-[10px] font-semibold tabular-nums text-cyan-400/80">
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
    </HudFrame>
  );
}

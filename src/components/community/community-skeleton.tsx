import { COMMUNITY_SKELETON_CARD } from "@/lib/community/community-ui";

export function CommunityFeedSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={COMMUNITY_SKELETON_CARD}>
          <div className="flex gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-cyan-400/10" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-28 rounded bg-white/10" />
              <div className="h-2 w-20 rounded bg-white/5" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-white/8" />
            <div className="h-3 w-4/5 rounded bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

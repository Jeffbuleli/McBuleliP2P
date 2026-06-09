export function CommunityFeedSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-[#f0f4f2] bg-white p-4"
        >
          <div className="flex gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-[#e8f3ee]" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-28 rounded bg-[#e8f3ee]" />
              <div className="h-2 w-20 rounded bg-[#f5f5f4]" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-[#f5f5f4]" />
            <div className="h-3 w-4/5 rounded bg-[#f5f5f4]" />
          </div>
        </div>
      ))}
    </div>
  );
}

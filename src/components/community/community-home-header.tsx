import Link from "next/link";
import { CommunityHelpTrigger } from "@/components/community/community-help-sheet";
import { CommunitySearchBar } from "@/components/community/community-search-bar";
import { CommunityStoriesStrip } from "@/components/community/community-stories-strip";
import { CommunityDiscoverPeople } from "@/components/community/community-discover-people";
import { CommunityDmLink } from "@/components/community/community-dm-link";
import { formatBp } from "@/lib/community/format-count";

export function CommunityHomeHeader({
  fr,
  bp,
  searchLoading,
  onSearch,
  onHelpOpen,
}: {
  fr: boolean;
  bp: number | null;
  searchLoading?: boolean;
  onSearch: (q: string) => void;
  onHelpOpen: () => void;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <h1 className="text-lg font-extrabold tracking-tight text-[#0c0a09]">
          {fr ? "Communauté" : "Community"}
        </h1>
        <div className="flex shrink-0 items-center gap-1.5">
          <CommunityDmLink fr={fr} />
          {bp !== null ? (
            <Link
              href="/app/wallet/points"
              className="flex h-9 items-center rounded-xl bg-[#eaf5ee] px-2.5 text-[11px] font-bold tabular-nums text-[#305f33] ring-1 ring-[#305f33]/10 transition active:scale-95"
            >
              {formatBp(bp, fr ? "fr" : "en")} BP
            </Link>
          ) : null}
          <CommunityHelpTrigger onClick={onHelpOpen} />
        </div>
      </div>

      <CommunityStoriesStrip fr={fr} />

      <CommunityDiscoverPeople fr={fr} />

      <CommunitySearchBar fr={fr} loading={searchLoading} onSearch={onSearch} embedded />
    </div>
  );
}

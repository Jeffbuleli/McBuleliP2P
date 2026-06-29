"use client";

import Link from "next/link";
import { CommunityHelpTrigger } from "@/components/community/community-help-sheet";
import { CommunitySearchBar } from "@/components/community/community-search-bar";
import { CommunityStoriesStrip } from "@/components/community/community-stories-strip";
import { CommunityDmLink } from "@/components/community/community-dm-link";
import { COMMUNITY_BP_BADGE, COMMUNITY_TITLE } from "@/lib/community/community-ui";

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
        <h1 className={COMMUNITY_TITLE}>
          {fr ? "Communauté" : "Community"}
        </h1>
        <div className="flex shrink-0 items-center gap-1.5">
          <CommunityDmLink fr={fr} />
          {bp !== null ? (
            <Link href="/app/wallet/points" className={COMMUNITY_BP_BADGE}>
              {bp} BP
            </Link>
          ) : null}
          <CommunityHelpTrigger onClick={onHelpOpen} />
        </div>
      </div>

      <CommunityStoriesStrip fr={fr} />

      <CommunitySearchBar fr={fr} loading={searchLoading} onSearch={onSearch} embedded />
    </div>
  );
}

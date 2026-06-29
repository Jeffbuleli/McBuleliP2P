"use client";

import Link from "next/link";
import { IconInbox } from "@/components/community/community-icons";
import { COMMUNITY_DM_BTN } from "@/lib/community/community-ui";
import { useDmUnreadCount } from "@/hooks/use-dm-unread-count";

export function CommunityDmLink({
  fr,
  className = COMMUNITY_DM_BTN,
  iconSize = 17,
}: {
  fr: boolean;
  className?: string;
  iconSize?: number;
}) {
  const unread = useDmUnreadCount();

  return (
    <Link
      href="/app/community/inbox"
      className={className}
      aria-label={
        unread > 0
          ? fr
            ? `Messages (${unread} non lu${unread > 1 ? "s" : ""})`
            : `Messages (${unread} unread)`
          : fr
            ? "Messages"
            : "Inbox"
      }
    >
      <IconInbox size={iconSize} className="drop-shadow-[0_0_6px_rgba(34,211,238,0.35)]" />
      {unread > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full border border-rose-400/40 bg-rose-500 px-1 text-[9px] font-extrabold leading-none text-white shadow-[0_0_10px_rgba(244,63,94,0.45)] ring-2 ring-[rgba(10,16,24,0.95)]">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}

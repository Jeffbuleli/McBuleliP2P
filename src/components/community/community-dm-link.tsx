"use client";

import Link from "next/link";
import { IconInbox } from "@/components/community/community-icons";
import { useDmUnreadCount } from "@/hooks/use-dm-unread-count";

export function CommunityDmLink({
  fr,
  className = "relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#dce8e0] bg-white text-[#305f33] transition active:scale-95",
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
      <IconInbox size={iconSize} />
      {unread > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-[#dc2626] px-1 text-[9px] font-extrabold leading-none text-white ring-2 ring-white">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}

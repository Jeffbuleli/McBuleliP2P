"use client";

import { usePartnerChatUnreadCount } from "@/hooks/use-partner-chat-unread-count";
import { HackathonChatUnreadDot } from "@/components/hackathon/hackathon-chat-unread-dot";

/** Red unread pill that polls partner chat (for landing CTAs). */
export function HackathonChatUnreadBadge({
  className = "",
}: {
  className?: string;
}) {
  const count = usePartnerChatUnreadCount();
  return <HackathonChatUnreadDot count={count} className={className} />;
}

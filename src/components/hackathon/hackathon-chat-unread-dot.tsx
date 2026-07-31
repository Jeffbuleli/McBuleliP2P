"use client";

/** Red unread pill for Chat / Dialogue labels. */
export function HackathonChatUnreadDot({
  count,
  className = "",
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;
  return (
    <span
      className={`absolute -right-1 -top-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-[#dc2626] px-1 text-[9px] font-extrabold leading-none text-white ring-2 ring-white ${className}`}
      aria-hidden
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

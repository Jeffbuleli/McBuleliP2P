"use client";

type Props = {
  email: string;
  avatarUrl: string | null | undefined;
  sizeClass?: string;
  /** e.g. "text-sm" for the initial letter */
  textClass?: string;
};

/**
 * Profile image or first letter (app bar, profile header, P2P chat).
 * Accepts a relative app path or https URL.
 */
export function UserAvatarMark({
  email,
  avatarUrl,
  sizeClass = "h-10 w-10",
  textClass = "text-sm",
}: Props) {
  const initial = email.trim().charAt(0).toUpperCase() || "?";
  const show =
    typeof avatarUrl === "string" &&
    avatarUrl.length > 0 &&
    (avatarUrl.startsWith("/") ||
      avatarUrl.startsWith("https://") ||
      avatarUrl.startsWith("http://"));

  if (show) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white/30 dark:ring-stone-600`}
      />
    );
  }

  return (
    <span
      className={`flex ${sizeClass} items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 font-bold text-white shadow-md ring-2 ring-white/30 dark:ring-stone-700 ${textClass}`}
      aria-hidden
    >
      {initial}
    </span>
  );
}

/** Compact avatar for P2P order chat (falls back to initial from label). */
export function ChatAvatarBubble({
  label,
  avatarUrl,
  own,
}: {
  label: string;
  avatarUrl: string | null | undefined;
  own: boolean;
}) {
  const ring = own ? "ring-emerald-500/35" : "ring-stone-500/25";
  const show =
    typeof avatarUrl === "string" &&
    avatarUrl.length > 0 &&
    (avatarUrl.startsWith("/") ||
      avatarUrl.startsWith("https://") ||
      avatarUrl.startsWith("http://"));

  if (show) {
    return (
      <span
        className={`relative flex h-7 w-7 shrink-0 overflow-hidden rounded-full ring-2 ${ring}`}
      >
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }

  const initial = label.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-600 text-[10px] font-bold text-white ring-2 ${ring}`}
      aria-hidden
    >
      {initial}
    </span>
  );
}

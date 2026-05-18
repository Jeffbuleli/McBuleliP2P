"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { resolvePublicAssetUrl } from "@/lib/public-asset-url";

type Props = {
  email: string;
  avatarUrl: string | null | undefined;
  sizeClass?: string;
  /** e.g. "text-sm" for the initial letter */
  textClass?: string;
  variant?: "default" | "profile";
};

/**
 * Same-origin `/uploads/...` paths become absolute with `window.location.origin`
 * after layout when `NEXT_PUBLIC_APP_URL` is unset (PWA / standalone / some WebViews).
 */
function usePublicAvatarSrc(resolved: string | null): string | null {
  const [src, setSrc] = useState<string | null>(resolved);

  useLayoutEffect(() => {
    if (!resolved) {
      setSrc(null);
      return;
    }
    if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
      setSrc(resolved);
      return;
    }
    if (resolved.startsWith("/") && typeof window !== "undefined") {
      setSrc(new URL(resolved, window.location.origin).href);
      return;
    }
    setSrc(resolved);
  }, [resolved]);

  return src;
}

/**
 * Profile image or first letter (app bar, profile header, P2P chat).
 * Relative `/uploads/...` paths resolve with NEXT_PUBLIC_APP_URL when set (Android / installed PWA).
 */
export function UserAvatarMark({
  email,
  avatarUrl,
  sizeClass = "h-10 w-10",
  textClass = "text-sm",
  variant = "default",
}: Props) {
  const initial = email.trim().charAt(0).toUpperCase() || "?";
  const rawOk =
    typeof avatarUrl === "string" &&
    avatarUrl.length > 0 &&
    (avatarUrl.startsWith("/") ||
      avatarUrl.startsWith("https://") ||
      avatarUrl.startsWith("http://"));
  const [imgBroken, setImgBroken] = useState(false);
  const resolved = rawOk ? resolvePublicAssetUrl(avatarUrl) : null;
  const imgSrc = usePublicAvatarSrc(resolved);
  const showImg = rawOk && imgSrc && !imgBroken;

  useEffect(() => {
    setImgBroken(false);
  }, [avatarUrl]);

  if (showImg) {
    return (
      <img
        src={imgSrc}
        alt=""
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white/30 dark:ring-stone-600`}
        onError={() => setImgBroken(true)}
      />
    );
  }

  const fallbackClass =
    variant === "profile"
      ? `flex ${sizeClass} items-center justify-center rounded-full bg-[var(--fd-primary)] font-bold text-white shadow-md ring-2 ring-white ${textClass}`
      : `flex ${sizeClass} items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 font-bold text-white shadow-md ring-2 ring-white/30 dark:ring-stone-700 ${textClass}`;

  return (
    <span className={fallbackClass} aria-hidden>
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
  const rawOk =
    typeof avatarUrl === "string" &&
    avatarUrl.length > 0 &&
    (avatarUrl.startsWith("/") ||
      avatarUrl.startsWith("https://") ||
      avatarUrl.startsWith("http://"));
  const [imgBroken, setImgBroken] = useState(false);
  const resolved = rawOk ? resolvePublicAssetUrl(avatarUrl) : null;
  const imgSrc = usePublicAvatarSrc(resolved);
  const showImg = rawOk && imgSrc && !imgBroken;

  useEffect(() => {
    setImgBroken(false);
  }, [avatarUrl]);

  if (showImg) {
    return (
      <span
        className={`relative flex h-7 w-7 shrink-0 overflow-hidden rounded-full ring-2 ${ring}`}
      >
        <img
          src={imgSrc}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImgBroken(true)}
        />
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

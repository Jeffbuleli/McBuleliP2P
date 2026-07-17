"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { isDisplayableAvatarUrl, resolveAvatarSrc } from "@/lib/avatar-url";

type Props = {
  email: string;
  avatarUrl: string | null | undefined;
  sizeClass?: string;
  textClass?: string;
  variant?: "default" | "profile";
};

function useAvatarImgSrc(resolved: string | null): string | null {
  const [src, setSrc] = useState<string | null>(resolved);

  useLayoutEffect(() => {
    if (!resolved) {
      setSrc(null);
      return;
    }
    if (resolved.startsWith("data:image/")) {
      setSrc(resolved);
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

export function UserAvatarMark({
  email,
  avatarUrl,
  sizeClass = "h-10 w-10",
  textClass = "text-sm",
  variant = "default",
}: Props) {
  const initial = email.trim().charAt(0).toUpperCase() || "?";
  const rawOk = isDisplayableAvatarUrl(avatarUrl);
  const [imgBroken, setImgBroken] = useState(false);
  const resolved = rawOk ? resolveAvatarSrc(avatarUrl) : null;
  const imgSrc = useAvatarImgSrc(resolved);
  const showImg = rawOk && imgSrc && !imgBroken;

  useEffect(() => {
    setImgBroken(false);
  }, [avatarUrl]);

  const ringClass =
    variant === "profile"
      ? ""
      : "ring-2 ring-white/30 dark:ring-stone-600";

  if (showImg) {
    return (
      <img
        src={imgSrc}
        alt=""
        className={`${sizeClass} rounded-full object-cover ${ringClass}`}
        onError={() => setImgBroken(true)}
      />
    );
  }

  const fallbackClass =
    variant === "profile"
      ? `flex ${sizeClass} items-center justify-center rounded-full bg-[var(--fd-primary)] font-bold text-white shadow-md ${textClass}`
      : `flex ${sizeClass} items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 font-bold text-white shadow-md ring-2 ring-white/30 dark:ring-stone-700 ${textClass}`;

  return (
    <span className={fallbackClass} aria-hidden>
      {initial}
    </span>
  );
}

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
  const rawOk = isDisplayableAvatarUrl(avatarUrl);
  const [imgBroken, setImgBroken] = useState(false);
  const resolved = rawOk ? resolveAvatarSrc(avatarUrl) : null;
  const imgSrc = useAvatarImgSrc(resolved);
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

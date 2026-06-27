"use client";

import { useEffect, useState } from "react";
import { resolveMediaSrc } from "@/lib/media-url";

export function CommunityMediaImage({
  src,
  alt = "",
  className = "",
  fill = false,
  objectFit = "cover",
}: {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  fill?: boolean;
  objectFit?: "cover" | "contain";
}) {
  const resolved = resolveMediaSrc(src);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [src]);

  if (!resolved || broken) return null;

  const fitClass = objectFit === "contain" ? "object-contain" : "object-cover";
  const cls = fill
    ? `absolute inset-0 h-full w-full ${fitClass} ${className}`.trim()
    : `${fitClass} ${className}`.trim();

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      className={cls}
      onError={() => setBroken(true)}
      loading="lazy"
      decoding="async"
    />
  );
}

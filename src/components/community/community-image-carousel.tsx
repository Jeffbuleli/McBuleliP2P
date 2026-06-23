"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type CarouselImage = {
  id: string;
  src: string;
};

export function CommunityImageCarousel({
  images,
  postId,
  className = "",
}: {
  images: CarouselImage[];
  postId?: string;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !el.clientWidth) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActive(Math.min(Math.max(idx, 0), images.length - 1));
  }, [images.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const goTo = (idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
    setActive(idx);
  };

  if (images.length <= 1) return null;

  return (
    <div className={`relative ${className}`}>
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory overflow-x-auto scrollbar-none rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {images.map((img) => (
          <div
            key={img.id}
            className="relative w-full shrink-0 snap-center snap-always"
          >
            {postId ? (
              <Link
                href={`/app/community/post/${postId}/media/${img.id}`}
                className="block"
                onClick={(e) => e.stopPropagation()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt=""
                  className="max-h-80 min-h-[200px] w-full object-cover"
                  draggable={false}
                />
              </Link>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img.src}
                alt=""
                className="max-h-80 min-h-[200px] w-full object-cover"
                draggable={false}
              />
            )}
          </div>
        ))}
      </div>

      {images.length > 1 ? (
        <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              aria-label={`Image ${idx + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                goTo(idx);
              }}
              className={`h-1.5 rounded-full transition ${
                idx === active ? "w-4 bg-white" : "w-1.5 bg-white/55"
              }`}
            />
          ))}
        </div>
      ) : null}

      {images.length > 1 ? (
        <span className="absolute right-2 top-2 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white">
          {active + 1}/{images.length}
        </span>
      ) : null}
    </div>
  );
}

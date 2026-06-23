"use client";

import { useEffect, useRef } from "react";

/** Enregistre une vue unique quand la carte est visible ≥50 % pendant 1 s (feed). */
export function usePostImpression(
  postId: string,
  enabled: boolean,
  onRecorded?: (viewCount: number) => void,
) {
  const ref = useRef<HTMLElement | null>(null);
  const firedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRecordedRef = useRef(onRecorded);
  onRecordedRef.current = onRecorded;

  useEffect(() => {
    firedRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [postId]);

  useEffect(() => {
    if (!enabled || firedRef.current) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || entry.intersectionRatio < 0.5) {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          return;
        }
        if (firedRef.current || timerRef.current) return;
        timerRef.current = setTimeout(() => {
          if (firedRef.current) return;
          firedRef.current = true;
          fetch(`/api/community/feed/${postId}/view`, { method: "POST" })
            .then((r) => r.json())
            .then((j: { viewCount?: number }) => {
              if (typeof j.viewCount === "number") {
                onRecordedRef.current?.(j.viewCount);
              }
            })
            .catch(() => {});
        }, 1000);
      },
      { threshold: [0.5] },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [postId, enabled]);

  return ref;
}

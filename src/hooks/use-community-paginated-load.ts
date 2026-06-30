"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PageResult<T> = {
  items: T[];
  nextCursor: string | null;
};

/**
 * Pagination infinie communauté — refs stables pour éviter les boucles
 * IntersectionObserver ↔ loadMore quand loading/done/cursor changent.
 */
export function useCommunityPaginatedLoad<T>(options: {
  loadPage: (cursor: string | null) => Promise<PageResult<T>>;
  resetKey: string;
}) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  const loadingRef = useRef(false);
  const doneRef = useRef(false);
  const cursorRef = useRef<string | null>(null);
  const loadPageRef = useRef(options.loadPage);
  loadPageRef.current = options.loadPage;

  const loadMore = useCallback(async (reset = false) => {
    if (loadingRef.current) return;
    if (doneRef.current && !reset) return;

    loadingRef.current = true;
    setLoading(true);
    try {
      const cursor = reset ? null : cursorRef.current;
      const { items: batch, nextCursor } = await loadPageRef.current(cursor);
      setItems((prev) => (reset ? batch : [...prev, ...batch]));
      cursorRef.current = nextCursor;
      const finished = nextCursor === null;
      doneRef.current = finished;
      setDone(finished);
    } catch {
      doneRef.current = true;
      setDone(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  useEffect(() => {
    cursorRef.current = null;
    doneRef.current = false;
    setDone(false);
    setItems([]);
    void loadMoreRef.current(true);
  }, [options.resetKey]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMoreRef.current(false);
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { items, setItems, loading, done, sentinelRef };
}

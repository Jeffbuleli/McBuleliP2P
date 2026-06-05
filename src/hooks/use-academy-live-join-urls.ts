"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import type { LiveJoinMode } from "@/lib/academy-live";

type JoinUrls = {
  learner: string;
  host: string;
  audio: string;
};

export function useAcademyLiveJoinUrls(args: {
  editionSlug: string;
  sessionSlug: string;
  programSlug: string;
  enabled: boolean;
}) {
  const [urls, setUrls] = useState<JoinUrls | null>(null);
  const [gateError, setGateError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMode = useCallback(
    async (q: URLSearchParams, mode: LiveJoinMode, retry: boolean) => {
      const res = await fetchWithDeadline(
        `/api/academy/live/join-token?${q}&mode=${mode}`,
        { credentials: "include", cache: "no-store" },
        20_000,
      );
      const j = await res.json().catch(() => ({}));
      if (res.status === 401 && retry) {
        await fetch("/api/auth/session", { credentials: "same-origin" }).catch(
          () => undefined,
        );
        return fetchMode(q, mode, false);
      }
      return {
        mode,
        ok: res.ok,
        url: j.url as string | undefined,
        error: j.error as string | undefined,
      };
    },
    [],
  );

  const load = useCallback(async () => {
    if (!args.enabled) {
      setUrls(null);
      setGateError(null);
      return;
    }
    setLoading(true);
    const q = new URLSearchParams({
      editionSlug: args.editionSlug,
      sessionSlug: args.sessionSlug,
      program: args.programSlug,
    });
    try {
      await fetch("/api/auth/session", { credentials: "same-origin" }).catch(
        () => undefined,
      );
      const modes: LiveJoinMode[] = ["learner", "host", "audio"];
      const results = await Promise.all(
        modes.map((mode) => fetchMode(q, mode, true)),
      );
      const firstErr = results.find((r) => !r.ok);
      if (firstErr && firstErr.mode === "learner") {
        setGateError(firstErr.error ?? "academy_live_account_required");
        setUrls(null);
        return;
      }
      const learner = results.find((r) => r.mode === "learner");
      const host = results.find((r) => r.mode === "host");
      const audio = results.find((r) => r.mode === "audio");
      if (!learner?.url) {
        setGateError(learner?.error ?? "academy_live_account_required");
        setUrls(null);
        return;
      }
      setUrls({
        learner: learner.url,
        host: host?.url ?? learner.url,
        audio: audio?.url ?? learner.url,
      });
      setGateError(null);
    } finally {
      setLoading(false);
    }
  }, [args.editionSlug, args.enabled, args.programSlug, args.sessionSlug, fetchMode]);

  useEffect(() => {
    void load();
  }, [load]);

  return { urls, gateError, loading, reload: load };
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { RenderAssistantMarkdown } from "@/lib/assistant/render-markdown";
import { topicIllustration, normalizeTopicSlug } from "@/lib/academy-topic-path";
import { academyCls } from "@/components/academy/academy-ui";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";

type Module = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  visualKey: string;
  ecosystemHref: string | null;
  completed: boolean;
};

export function AcademyModuleClient({
  editionSlug,
  moduleSlug,
  programSlug,
}: {
  editionSlug: string;
  moduleSlug: string;
  programSlug: string;
}) {
  const { t } = useI18n();
  const [mod, setMod] = useState<Module | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const q = `?program=${encodeURIComponent(programSlug)}`;
  const cohortHref = `/app/academy/${editionSlug}${q}`;

  const load = useCallback(async () => {
    const res = await fetchWithDeadline(
      `/api/academy/editions/${editionSlug}/modules${q}`,
      { credentials: "include", cache: "no-store" },
      15_000,
    );
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(
        j.error === "academy_module_locked"
          ? t("academy_module_locked")
          : t("academy_error_load"),
      );
      return;
    }
    const found = (j.modules as Module[] | undefined)?.find((m) => m.slug === moduleSlug);
    if (!found) {
      setErr(t("academy_module_not_found"));
      return;
    }
    setMod(found);
    setDone(found.completed);
    setErr(null);
  }, [editionSlug, moduleSlug, programSlug, q, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function complete() {
    setBusy(true);
    try {
      const res = await fetchWithDeadline(
        `/api/academy/editions/${editionSlug}/modules/${moduleSlug}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ programSlug }),
        },
        15_000,
      );
      if (!res.ok) {
        setErr(t("academy_module_complete_error"));
        return;
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  if (err && !mod) {
    return (
      <div className={`pb-6 ${academyCls.root}`}>
        <p className="text-sm text-rose-700">{err}</p>
        <Link href={cohortHref} className="mt-3 inline-block text-sm font-bold text-[color:var(--fd-primary)]">
          ← {t("academy_title")}
        </Link>
      </div>
    );
  }

  if (!mod) {
    return <p className="text-sm text-[color:var(--fd-muted)]">…</p>;
  }

  const visual = normalizeTopicSlug(mod.visualKey);
  const img = visual ? topicIllustration(visual) : "/academy/topic-crypto.svg";

  return (
    <div className={`space-y-4 pb-8 ${academyCls.root}`}>
      <Link href={cohortHref} className="text-sm font-semibold text-[color:var(--fd-primary)]">
        ← {t("academy_title")}
      </Link>

      <div className="flex justify-center">
        <Image src={img} alt="" width={80} height={80} className="h-20 w-20 rounded-2xl" />
      </div>

      <header className="text-center">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#305f33]">
          {t("academy_module_badge")}
        </p>
        <h1 className="mt-1 text-xl font-black">{mod.title}</h1>
        <p className="mt-1 text-sm text-[color:var(--fd-muted)]">{mod.summary}</p>
      </header>

      <article className="rounded-2xl border border-[color:var(--fd-border)] bg-white p-4 text-sm leading-relaxed">
        <RenderAssistantMarkdown text={mod.body} variant="light" />
      </article>

      {mod.ecosystemHref ? (
        <Link
          href={mod.ecosystemHref}
          className="flex w-full justify-center rounded-xl border-2 border-[color:var(--fd-primary)] py-2.5 text-sm font-bold text-[color:var(--fd-primary)]"
        >
          {t("academy_module_practice")} →
        </Link>
      ) : null}

      {done ? (
        <p className="text-center text-sm font-bold text-[#305f33]">✓ {t("academy_module_done")}</p>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => void complete()}
          className="w-full rounded-xl bg-[#305f33] py-3 text-sm font-extrabold text-white disabled:opacity-60"
        >
          {busy ? "…" : t("academy_module_complete")}
        </button>
      )}
    </div>
  );
}

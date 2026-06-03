"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import {
  ACADEMY_TOPIC_ORDER,
  normalizeTopicSlug,
  topicIllustration,
  type AcademyTopicSlug,
} from "@/lib/academy-topic-path";

const TOPIC_HINT_KEYS: Record<
  AcademyTopicSlug,
  "academy_topic_hint_crypto" | "academy_topic_hint_trading" | "academy_topic_hint_ia" | "academy_topic_hint_p2p"
> = {
  crypto: "academy_topic_hint_crypto",
  trading: "academy_topic_hint_trading",
  ia: "academy_topic_hint_ia",
  p2p: "academy_topic_hint_p2p",
};

const TOPIC_LABEL_KEYS: Record<
  AcademyTopicSlug,
  "academy_topic_crypto" | "academy_topic_trading" | "academy_topic_ia" | "academy_topic_p2p"
> = {
  crypto: "academy_topic_crypto",
  trading: "academy_topic_trading",
  ia: "academy_topic_ia",
  p2p: "academy_topic_p2p",
};

export function AcademyTopicPath({
  topics,
  editionSlug,
  programSlug,
}: {
  topics: string[];
  editionSlug: string;
  programSlug: string;
}) {
  const { t } = useI18n();
  const ordered = ACADEMY_TOPIC_ORDER.filter((slug) =>
    topics.some((raw) => normalizeTopicSlug(raw) === slug),
  );
  if (ordered.length === 0) return null;

  const q = `?program=${encodeURIComponent(programSlug)}`;

  return (
    <section>
      <h2 className="text-sm font-bold text-[color:var(--fd-text)]">
        {t("academy_path_title")}
      </h2>
      <p className="mt-0.5 text-[10px] text-[color:var(--fd-muted)]">
        {t("academy_path_hint")}
      </p>
      <ul className="mt-2 grid grid-cols-2 gap-2">
        {ordered.map((slug, i) => (
          <li key={slug}>
            <Link
              href={`/app/academy/${editionSlug}/module/${slug}${q}`}
              className="flex gap-2 rounded-xl border border-[color:var(--fd-border)] bg-white p-2.5 shadow-sm transition hover:border-[#305f33]/40"
            >
              <Image
                src={topicIllustration(slug)}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-lg"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#305f33]">
                  {i + 1} · {t(TOPIC_LABEL_KEYS[slug])}
                </p>
                <p className="mt-0.5 text-[10px] leading-snug text-[color:var(--fd-muted)]">
                  {t(TOPIC_HINT_KEYS[slug])}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

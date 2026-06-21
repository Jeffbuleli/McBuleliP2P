"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function EventLivePage() {
  const { slug } = useParams<{ slug: string }>();
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    void fetch(`/api/events/${slug}/live`)
      .then((r) => r.json())
      .then((d) => {
        if (d.url) setUrl(d.url);
        else setErr(d.error ?? "live_unavailable");
      })
      .catch(() => setErr("live_unavailable"));
  }, [slug]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
        McBuleli Live
      </p>
      {url ? (
        <a
          href={url}
          className="rounded-xl bg-[color:var(--fd-primary)] px-6 py-3 text-sm font-bold text-white"
        >
          Rejoindre le Live
        </a>
      ) : (
        <p className="text-sm text-[color:var(--fd-muted)]">{err ?? "…"}</p>
      )}
      <Link href={`/app/events/${slug}`} className="text-sm text-[color:var(--fd-primary)]">
        ← Détail formation
      </Link>
    </div>
  );
}

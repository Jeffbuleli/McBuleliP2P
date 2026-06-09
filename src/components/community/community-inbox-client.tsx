"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  AdminGoldBadge,
  BlueCheckBadge,
  KycVerifiedBadge,
} from "@/components/community/community-badges";
import type { DmThreadListItem } from "@/lib/community/dm-service";

function PeerBadges({
  peer,
  fr,
}: {
  peer: DmThreadListItem["peer"];
  fr: boolean;
}) {
  return (
    <span className="ml-1 inline-flex gap-0.5 align-middle">
      {peer.isAdmin ? <AdminGoldBadge fr={fr} /> : null}
      {peer.showKycBadge ? <KycVerifiedBadge fr={fr} /> : null}
      {peer.verifiedBlue ? <BlueCheckBadge fr={fr} /> : null}
    </span>
  );
}

function threadsFingerprint(list: DmThreadListItem[]): string {
  return list
    .map(
      (t) =>
        `${t.id}:${t.lastMessageAt}:${t.unreadCount ?? 0}:${t.peer.online ? 1 : 0}`,
    )
    .join("|");
}

export function CommunityInboxClient() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [threads, setThreads] = useState<DmThreadListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const fpRef = useRef("");
  const initialLoad = useRef(true);

  useEffect(() => {
    const load = () => {
      fetch("/api/community/dm/threads")
        .then((r) => r.json())
        .then((d: { threads?: DmThreadListItem[] }) => {
          const next = d.threads ?? [];
          const fp = threadsFingerprint(next);
          if (fp !== fpRef.current) {
            fpRef.current = fp;
            setThreads(next);
          }
        })
        .finally(() => {
          if (initialLoad.current) {
            initialLoad.current = false;
            setLoading(false);
          }
        });
    };
    load();
    const t = window.setInterval(load, 8000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-28 pt-3">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link href="/app/community" className="text-sm font-semibold text-[#305f33]">
            ← {fr ? "Communauté" : "Community"}
          </Link>
          <h1 className="mt-1 text-lg font-bold text-[#0c0a09]">
            {fr ? "Messages" : "Inbox"}
          </h1>
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-[#78716c]">…</p>
      ) : threads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e8f3ee] bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-sm font-medium text-[#57534e]">
            {fr ? "Aucune conversation" : "No conversations yet"}
          </p>
          <p className="mt-1 text-xs text-[#a8a29e]">
            {fr
              ? "Visitez un profil et appuyez sur Message."
              : "Visit a profile and tap Message."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {threads.map((t) => (
            <li key={t.id}>
              <Link
                href={`/app/community/inbox/${t.id}`}
                className="flex items-center gap-3 rounded-2xl border border-[#f0f4f2] bg-white px-4 py-3 shadow-[0_2px_12px_rgba(12,10,9,0.04)] active:scale-[0.99]"
              >
                <div className="relative shrink-0">
                  {t.peer.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.peer.avatarUrl}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f3ee] text-sm font-bold text-[#305f33]">
                      {t.peer.displayName.slice(0, 1)}
                    </div>
                  )}
                  {t.peer.online ? (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#22c55e]" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-[#0c0a09]">
                      {t.peer.displayName}
                      <PeerBadges peer={t.peer} fr={fr} />
                    </p>
                    <time className="shrink-0 text-[10px] text-[#a8a29e]">
                      {new Date(t.lastMessageAt).toLocaleTimeString(
                        fr ? "fr-FR" : "en-US",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </time>
                  </div>
                  <p className="truncate text-xs text-[#78716c]">
                    @{t.peer.handle}
                    {t.isRequest
                      ? fr
                        ? " · Demande"
                        : " · Request"
                      : ""}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[#57534e]">
                    {t.lastMessagePreview ?? "—"}
                  </p>
                </div>
                {t.unreadCount > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c41e3a] px-1.5 text-[10px] font-bold text-white">
                    {t.unreadCount}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

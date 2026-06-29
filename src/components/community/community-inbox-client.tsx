"use client";

import Link from "next/link";
import { CommunityAvatar } from "@/components/community/community-avatar";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  AdminGoldBadge,
  BlueCheckBadge,
  KycVerifiedBadge,
} from "@/components/community/community-badges";
import {
  COMMUNITY_AVATAR_RING,
  COMMUNITY_BACK_LINK,
  COMMUNITY_EMPTY_BOX,
  COMMUNITY_LIST_ROW,
  COMMUNITY_MODULE_TITLE,
} from "@/lib/community/community-ui";
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
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-4 pt-3">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link href="/app/community" className={COMMUNITY_BACK_LINK}>
            ← {fr ? "Communauté" : "Community"}
          </Link>
          <h1 className={`mt-1 ${COMMUNITY_MODULE_TITLE}`}>
            {fr ? "Messages" : "Inbox"}
          </h1>
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-stone-400">…</p>
      ) : threads.length === 0 ? (
        <div className={COMMUNITY_EMPTY_BOX}>
          <p className="text-sm font-medium text-stone-300">
            {fr ? "Aucune conversation" : "No conversations yet"}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {fr
              ? "Visitez un profil et appuyez sur Message."
              : "Visit a profile and tap Message."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {threads.map((t) => (
            <li key={t.id}>
              <Link href={`/app/community/inbox/${t.id}`} className={COMMUNITY_LIST_ROW}>
                <div className={`relative shrink-0 ${COMMUNITY_AVATAR_RING} rounded-full`}>
                  <CommunityAvatar
                    label={t.peer.displayName}
                    avatarUrl={t.peer.avatarUrl}
                    sizeClass="h-12 w-12"
                  />
                  {t.peer.online ? (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#0a1018] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-stone-50">
                      {t.peer.displayName}
                      <PeerBadges peer={t.peer} fr={fr} />
                    </p>
                    <time className="shrink-0 text-[10px] text-stone-500">
                      {new Date(t.lastMessageAt).toLocaleTimeString(
                        fr ? "fr-FR" : "en-US",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </time>
                  </div>
                  <p className="truncate text-xs text-stone-400">
                    @{t.peer.handle}
                    {t.isRequest
                      ? fr
                        ? " · Demande"
                        : " · Request"
                      : ""}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-stone-300">
                    {t.lastMessagePreview ?? "-"}
                  </p>
                </div>
                {t.unreadCount > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-[0_0_12px_rgba(244,63,94,0.45)]">
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

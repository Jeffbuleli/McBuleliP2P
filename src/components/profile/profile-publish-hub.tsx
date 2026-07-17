"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CommunityPostComposer } from "@/components/community/community-post-composer";
import { CommunityStoryComposer } from "@/components/community/community-stories-strip";
import { useI18n } from "@/components/i18n-provider";

export function ProfilePublishHub({
  email,
  avatarUrl,
  displayName,
}: {
  email: string;
  avatarUrl: string | null;
  displayName: string;
}) {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const router = useRouter();
  const [storyOpen, setStoryOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <>
      {toast ? (
        <div className="fixed left-1/2 top-20 z-[100] -translate-x-1/2 rounded-full bg-[#305f33] px-4 py-2 text-xs font-bold text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <section className="rounded-2xl border border-[var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[var(--fd-muted)]">
          {fr ? "Publier" : "Publish"}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setStoryOpen(true)}
            className="flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl bg-[#305f33] px-2 py-2 text-white active:scale-[0.98]"
          >
            <span className="text-xs font-bold uppercase tracking-wide">
              {fr ? "Statut" : "Status"}
            </span>
            <span className="text-[10px] text-white/80">24h</span>
          </button>
          <button
            type="button"
            onClick={() => setPostOpen(true)}
            className="flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl border border-[#305f33]/40 bg-[#eaf5ee] px-2 py-2 text-[#305f33] active:scale-[0.98]"
          >
            <span className="text-xs font-bold uppercase tracking-wide">
              {fr ? "Publier" : "Publish"}
            </span>
            <span className="text-[10px] text-[#305f33]/75">
              {fr ? "Post / média" : "Post / media"}
            </span>
          </button>
        </div>
      </section>

      {storyOpen ? (
        <CommunityStoryComposer
          fr={fr}
          avatarUrl={avatarUrl}
          label={displayName || email}
          onClose={() => setStoryOpen(false)}
          onPosted={(bp) => {
            setStoryOpen(false);
            setToast(
              bp > 0
                ? fr
                  ? `+${bp} BP - statut publié !`
                  : `+${bp} BP - status posted!`
                : fr
                  ? "Statut publié"
                  : "Status posted",
            );
            window.setTimeout(() => setToast(null), 2800);
            router.refresh();
          }}
        />
      ) : null}

      <CommunityPostComposer
        fr={fr}
        open={postOpen}
        onClose={() => setPostOpen(false)}
        onPublished={() => {
          setPostOpen(false);
          setToast(fr ? "Publication envoyée" : "Post published");
          window.setTimeout(() => setToast(null), 2800);
          router.refresh();
        }}
      />
    </>
  );
}

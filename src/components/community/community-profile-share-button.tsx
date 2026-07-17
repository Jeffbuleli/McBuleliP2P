"use client";

import { useEffect, useState } from "react";
import { IconShare } from "@/components/community/community-icons";
import { communityProfileShareUrl } from "@/lib/community/share-url";

type ShareTarget = "whatsapp" | "x" | "facebook" | "telegram" | "copy" | "native";

function shareHref(
  target: ShareTarget,
  url: string,
  text: string,
): string | null {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  switch (target) {
    case "whatsapp":
      return `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
    case "x":
      return `https://twitter.com/intent/tweet?text=${t}&url=${u}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case "telegram":
      return `https://t.me/share/url?url=${u}&text=${t}`;
    default:
      return null;
  }
}

const CHANNELS: {
  id: ShareTarget;
  label: string;
  className: string;
}[] = [
  { id: "whatsapp", label: "WhatsApp", className: "text-[#128C7E]" },
  { id: "x", label: "X", className: "text-[#0c0a09]" },
  { id: "facebook", label: "Facebook", className: "text-[#1877F2]" },
  { id: "telegram", label: "Telegram", className: "text-[#229ED9]" },
  { id: "copy", label: "Copier", className: "text-[#305f33]" },
];

/** Minimal profile share sheet — native share + RS deep links. */
export function CommunityProfileShareButton({
  handle,
  displayName,
  fr,
}: {
  handle: string;
  displayName: string;
  fr: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [canNative, setCanNative] = useState(false);

  useEffect(() => {
    setCanNative(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const url = communityProfileShareUrl(handle);
  const text = fr
    ? `Profil de ${displayName} (@${handle}) sur McBuleli`
    : `${displayName} (@${handle}) on McBuleli`;

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const run = async (target: ShareTarget) => {
    if (target === "native") {
      try {
        await navigator.share({ title: "McBuleli", text, url });
        setOpen(false);
      } catch {
        /* cancelled */
      }
      return;
    }
    if (target === "copy") {
      try {
        await navigator.clipboard.writeText(url);
        flash(fr ? "Lien copié" : "Link copied");
        setOpen(false);
      } catch {
        flash(fr ? "Échec" : "Failed");
      }
      return;
    }
    const href = shareHref(target, url, text);
    if (href) {
      window.open(href, "_blank", "noopener,noreferrer");
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[#e8f3ee] bg-white px-3 py-1.5 text-[11px] font-bold text-[#305f33] active:scale-[0.98]"
        aria-label={fr ? "Partager le profil" : "Share profile"}
      >
        <IconShare size={14} />
        {fr ? "Partager" : "Share"}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-20 cursor-default"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-2xl border border-[#f0f4f2] bg-white py-1 shadow-lg">
            {canNative ? (
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-[#0c0a09]"
                onClick={() => void run("native")}
              >
                <IconShare size={14} />
                {fr ? "Partager…" : "Share…"}
              </button>
            ) : null}
            {CHANNELS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`flex w-full px-3 py-2.5 text-left text-xs font-semibold ${c.className}`}
                onClick={() => void run(c.id)}
              >
                {c.id === "copy" ? (fr ? "Copier le lien" : "Copy link") : c.label}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {toast ? (
        <div className="absolute right-0 top-full z-40 mt-2 whitespace-nowrap rounded-full bg-[#305f33] px-3 py-1 text-[10px] font-bold text-white shadow">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

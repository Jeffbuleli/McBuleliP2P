"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { UserAvatarMark } from "@/components/profile/user-avatar-mark";

export function ProfileAvatarEditor({
  email,
  initialAvatarUrl,
}: {
  email: string;
  initialAvatarUrl: string | null;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function mapErr(code: string): string {
    switch (code) {
      case "avatar_too_large":
        return t("profile_avatar_err_large");
      case "avatar_invalid_type":
        return t("profile_avatar_err_type");
      case "avatar_no_file":
        return t("profile_avatar_err_generic");
      default:
        return t("profile_avatar_err_generic");
    }
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || file.size < 1) return;

    setErr(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(
          mapErr(typeof data.error === "string" ? data.error : ""),
        );
        return;
      }
      const next =
        typeof data.avatarUrl === "string" ? data.avatarUrl : null;
      setAvatarUrl(next);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(t("profile_avatar_err_generic"));
        return;
      }
      setAvatarUrl(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:items-start">
      <div className="relative">
        <UserAvatarMark
          email={email}
          avatarUrl={avatarUrl}
          sizeClass="h-20 w-20"
          textClass="text-2xl"
        />
        {busy ? (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-stone-950/60 text-xs font-semibold text-white">
            {t("profile_avatar_uploading")}
          </span>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(ev) => void onPick(ev)}
      />
      <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-xl border border-emerald-600/50 bg-emerald-950/40 px-4 py-2 text-sm font-semibold text-emerald-100 disabled:opacity-40"
        >
          {t("profile_avatar_upload")}
        </button>
        {avatarUrl ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void remove()}
            className="rounded-xl border border-stone-600 px-4 py-2 text-sm font-semibold text-stone-300 disabled:opacity-40"
          >
            {t("profile_avatar_remove")}
          </button>
        ) : null}
      </div>
      <p className="max-w-xs text-center text-[11px] leading-snug text-stone-500 sm:text-left">
        {t("profile_avatar_hint")}
      </p>
      {err ? (
        <p className="max-w-xs text-center text-xs text-rose-300 sm:text-left">{err}</p>
      ) : null}
    </div>
  );
}

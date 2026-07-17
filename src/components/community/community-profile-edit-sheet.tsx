"use client";

import { useRef, useState } from "react";
import { CommunityCoverCropper } from "@/components/community/community-cover-cropper";
import { profileLinkHref } from "@/lib/community/profile-meta";
import type { CommunityProfileLinks } from "@/lib/community/profile-meta";
import type { PublicProfileView } from "@/lib/community/profile-service";

function IconCam({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8h3l2-2h6l2 2h3v11H4V8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function SocialIcon({
  kind,
}: {
  kind: "website" | "x" | "facebook" | "tiktok" | "youtube" | "whatsapp" | "telegram" | "location";
}) {
  const c = "h-4 w-4";
  if (kind === "location") {
    return (
      <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 21s7-5.2 7-11a7 7 0 10-14 0c0 5.8 7 11 7 11z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  if (kind === "website") {
    return (
      <svg className={c} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  if (kind === "x") {
    return (
      <svg className={c} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M18.2 3H21l-6.6 7.6L22 21h-5.7l-4.5-5.9L6.5 21H3.7l7-8.1L2 3h5.8l4 5.4L18.2 3z" />
      </svg>
    );
  }
  if (kind === "facebook") {
    return (
      <svg className={c} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H7v3h3v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z" />
      </svg>
    );
  }
  if (kind === "tiktok") {
    return (
      <svg className={c} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M16 3c.4 2.4 1.9 4.1 4.2 4.5v2.7c-1.5.1-2.9-.3-4.2-1.2v6.5A5.8 5.8 0 1112.5 10v2.8a3 3 0 103 2.9V3h.5z" />
      </svg>
    );
  }
  if (kind === "youtube") {
    return (
      <svg className={c} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M23 12.2s0-3.1-.4-4.5c-.2-.9-.9-1.6-1.8-1.8C19.4 5.5 12 5.5 12 5.5s-7.4 0-8.8.4c-.9.2-1.6.9-1.8 1.8C1 9.1 1 12.2 1 12.2s0 3.1.4 4.5c.2.9.9 1.6 1.8 1.8 1.4.4 8.8.4 8.8.4s7.4 0 8.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.5.4-4.5zM9.8 15.5v-6.6l6.3 3.3-6.3 3.3z" />
      </svg>
    );
  }
  if (kind === "whatsapp") {
    return (
      <svg className={c} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 3a9 9 0 00-7.8 13.5L3 21l4.7-1.2A9 9 0 1012 3zm4.7 12.6c-.2.6-1.1 1-1.7 1.1-.5.1-1 .2-3-.4-2.5-.8-4.1-3.4-4.2-3.5-.1-.2-1-1.3-1-2.5s.6-1.8.9-2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .5.4l.8 1.9c.1.2 0 .4-.1.5l-.3.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.4.3.1.5.1.7-.1l.9-1.1c.2-.2.4-.2.6-.1l1.9.9c.2.1.4.2.4.4 0 .2 0 .9-.4 1.4z" />
      </svg>
    );
  }
  if (kind === "telegram") {
    return (
      <svg className={c} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M21.5 3.5L2.8 11.1c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 1.8 5.6c.2.7.4.9 1 .9.6 0 .9-.3 1.2-.6l2.8-2.7 5.8 4.3c1.1.6 1.8.3 2.1-1l3.5-16.5c.4-1.5-.5-2.2-1.9-1.6zM9.7 14.6l-.3 3.7-1.3-4.4L18.5 7.2 9.7 14.6z" />
      </svg>
    );
  }
  return null;
}

export function ProfileSocialLinksRow({
  links,
}: {
  links: CommunityProfileLinks;
}) {
  const items: {
    kind: "website" | "x" | "facebook" | "tiktok" | "youtube" | "whatsapp" | "telegram";
    value: string;
  }[] = [];
  if (links.website) items.push({ kind: "website", value: links.website });
  if (links.x) items.push({ kind: "x", value: links.x });
  if (links.facebook) items.push({ kind: "facebook", value: links.facebook });
  if (links.tiktok) items.push({ kind: "tiktok", value: links.tiktok });
  if (links.youtube) items.push({ kind: "youtube", value: links.youtube });
  if (links.whatsapp) items.push({ kind: "whatsapp", value: links.whatsapp });
  if (links.telegram) items.push({ kind: "telegram", value: links.telegram });

  if (!links.location && items.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-[#57534e]">
      {links.location ? (
        <span className="inline-flex items-center gap-1">
          <SocialIcon kind="location" />
          {links.location}
        </span>
      ) : null}
      {items.map((it) => (
        <a
          key={it.kind}
          href={profileLinkHref(it.kind, it.value)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-[#305f33] hover:underline"
        >
          <SocialIcon kind={it.kind} />
          <span className="max-w-[9rem] truncate">
            {it.kind === "website"
              ? it.value.replace(/^https?:\/\//i, "").replace(/\/$/, "")
              : it.value.replace(/^@/, "")}
          </span>
        </a>
      ))}
    </div>
  );
}

type EditState = {
  bio: string;
  location: string;
  website: string;
  x: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  whatsapp: string;
  telegram: string;
};

export function CommunityProfileEditSheet({
  profile,
  fr,
  onSaved,
  onClose,
}: {
  profile: PublicProfileView;
  fr: boolean;
  onSaved: (next: Partial<PublicProfileView>) => void;
  onClose: () => void;
}) {
  const coverRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<EditState>({
    bio: profile.bio ?? "",
    location: profile.links?.location ?? "",
    website: profile.links?.website ?? "",
    x: profile.links?.x ?? "",
    facebook: profile.links?.facebook ?? "",
    tiktok: profile.links?.tiktok ?? "",
    youtube: profile.links?.youtube ?? "",
    whatsapp: profile.links?.whatsapp ?? "",
    telegram: profile.links?.telegram ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropKind, setCropKind] = useState<"cover" | "avatar" | null>(null);

  async function uploadCover(file: File) {
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("kind", "covers");
      const up = await fetch("/api/community/media/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const uj = (await up.json().catch(() => ({}))) as {
        id?: string;
        url?: string;
        error?: string;
      };
      if (!up.ok || !uj.id) {
        setErr(fr ? "Upload échoué" : "Upload failed");
        return;
      }
      const res = await fetch("/api/profile/community", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverMediaId: uj.id }),
      });
      if (!res.ok) {
        setErr(fr ? "Couverture non enregistrée" : "Cover not saved");
        return;
      }
      onSaved({ coverUrl: uj.url ?? null });
      setCropFile(null);
      setCropKind(null);
    } finally {
      setBusy(false);
    }
  }

  async function uploadAvatar(file: File) {
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        avatarUrl?: string;
        error?: string;
      };
      if (!res.ok) {
        setErr(fr ? "Photo non enregistrée" : "Photo not saved");
        return;
      }
      onSaved({
        avatarUrl:
          typeof data.avatarUrl === "string" ? data.avatarUrl : null,
      });
      setCropFile(null);
      setCropKind(null);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/profile/community", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: form.bio,
          location: form.location,
          website: form.website,
          x: form.x,
          facebook: form.facebook,
          tiktok: form.tiktok,
          youtube: form.youtube,
          whatsapp: form.whatsapp,
          telegram: form.telegram,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        profile?: {
          bio: string;
          links: CommunityProfileLinks;
        };
      };
      if (!res.ok || !data.profile) {
        setErr(
          data.error === "profile_invalid_website"
            ? fr
              ? "Lien website invalide"
              : "Invalid website"
            : data.error === "profile_invalid_whatsapp"
              ? fr
                ? "WhatsApp invalide"
                : "Invalid WhatsApp"
              : fr
                ? "Erreur"
                : "Error",
        );
        return;
      }
      onSaved({
        bio: data.profile.bio || null,
        links: data.profile.links,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const field = (
    label: string,
    key: keyof EditState,
    ph: string,
  ) => (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wide text-[#a8a29e]">
        {label}
      </span>
      {key === "bio" ? (
        <textarea
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          maxLength={280}
          rows={3}
          placeholder={ph}
          className="mt-1 w-full resize-none rounded-xl border border-[#e8f3ee] bg-white px-3 py-2 text-sm outline-none focus:border-[#305f33]"
        />
      ) : (
        <input
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          placeholder={ph}
          className="mt-1 w-full rounded-xl border border-[#e8f3ee] bg-white px-3 py-2 text-sm outline-none focus:border-[#305f33]"
        />
      )}
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-4 shadow-xl sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-base font-bold text-[#0c0a09]">
            {fr ? "Modifier le profil" : "Edit profile"}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-sm font-bold text-[#78716c]"
          >
            ✕
          </button>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => avatarRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#d6d3d1] bg-[#fafaf9] py-3 text-xs font-bold text-[#57534e]"
          >
            <IconCam />
            {fr ? "Photo de profil" : "Profile photo"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => coverRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#d6d3d1] bg-[#fafaf9] py-3 text-xs font-bold text-[#57534e]"
          >
            <IconCam />
            {fr ? "Couverture" : "Cover"}
          </button>
        </div>
        <input
          ref={avatarRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) {
              setCropKind("avatar");
              setCropFile(f);
            }
          }}
        />
        <input
          ref={coverRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) {
              setCropKind("cover");
              setCropFile(f);
            }
          }}
        />

        {cropFile && cropKind === "cover" ? (
          <CommunityCoverCropper
            file={cropFile}
            fr={fr}
            busy={busy}
            onCancel={() => {
              setCropFile(null);
              setCropKind(null);
            }}
            onConfirm={(cropped) => void uploadCover(cropped)}
          />
        ) : null}
        {cropFile && cropKind === "avatar" ? (
          <CommunityCoverCropper
            file={cropFile}
            fr={fr}
            busy={busy}
            aspectRatio={1}
            outputWidth={400}
            round
            fileSuffix="avatar"
            title={fr ? "Ajuster la photo" : "Adjust photo"}
            subtitle={
              fr
                ? "Glisse pour cadrer ton avatar"
                : "Drag to frame your avatar"
            }
            onCancel={() => {
              setCropFile(null);
              setCropKind(null);
            }}
            onConfirm={(cropped) => void uploadAvatar(cropped)}
          />
        ) : null}

        <div className="space-y-3">
          {field("Bio", "bio", fr ? "Qui es-tu ?" : "Who are you?")}
          {field(
            fr ? "Ville" : "Location",
            "location",
            fr ? "Kinshasa" : "City",
          )}
          {field("Website", "website", "https://…")}
          {field("X", "x", "@handle")}
          {field("Facebook", "facebook", "username")}
          {field("TikTok", "tiktok", "@handle")}
          {field("YouTube", "youtube", "@channel")}
          {field("WhatsApp", "whatsapp", "+indicatif…")}
          {field("Telegram", "telegram", "@handle")}
        </div>

        {err ? (
          <p className="mt-3 text-xs font-semibold text-rose-700">{err}</p>
        ) : null}

        <div className="mt-4">
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#305f33] text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? "…" : fr ? "Enregistrer" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export { IconCam };

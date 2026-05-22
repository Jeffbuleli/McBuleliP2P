"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { avecCls } from "@/components/groups/avec-ui";
import { clientErrorText } from "@/lib/client-error-text";

export function AvecProfileForm({
  groupId,
  initial,
  onSaved,
}: {
  groupId: string;
  initial: {
    name: string;
    logoUrl: string | null;
    address: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    publicDescription: string | null;
  };
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(initial.name);
  const [address, setAddress] = useState(initial.address ?? "");
  const [phone, setPhone] = useState(initial.contactPhone ?? "");
  const [email, setEmail] = useState(initial.contactEmail ?? "");
  const [desc, setDesc] = useState(initial.publicDescription ?? "");
  const [logoPreview, setLogoPreview] = useState(initial.logoUrl);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setName(initial.name);
    setAddress(initial.address ?? "");
    setPhone(initial.contactPhone ?? "");
    setEmail(initial.contactEmail ?? "");
    setDesc(initial.publicDescription ?? "");
    setLogoPreview(initial.logoUrl);
  }, [initial]);

  async function onLogoFile(file: File | null) {
    if (!file) return;
    const buf = await file.arrayBuffer();
    const b64 = btoa(
      new Uint8Array(buf).reduce((s, byte) => s + String.fromCharCode(byte), ""),
    );
    const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
    setLogoPreview(`data:${mime};base64,${b64}`);
  }

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          logoUrl: logoPreview,
          address: address || null,
          contactPhone: phone || null,
          contactEmail: email || null,
          publicDescription: desc || null,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`${avecCls.section} space-y-3`}>
      <p className={avecCls.sectionTitle}>{t("avec_profile_title")}</p>
      <div className="flex items-center gap-3">
        {logoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoPreview} alt="" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--fd-mint)] text-sm font-black text-[color:var(--fd-primary)]">
            {name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <label className="text-xs font-semibold text-[color:var(--fd-primary)]">
          {t("avec_profile_logo")}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="mt-1 block text-[10px]"
            onChange={(e) => void onLogoFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
      <label className="block">
        <span className={avecCls.sectionTitle}>{t("group_field_name")}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className={avecCls.input} />
      </label>
      <label className="block">
        <span className={avecCls.sectionTitle}>{t("avec_profile_address")}</span>
        <input value={address} onChange={(e) => setAddress(e.target.value)} className={avecCls.input} />
      </label>
      <label className="block">
        <span className={avecCls.sectionTitle}>{t("avec_profile_phone")}</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className={avecCls.input} />
      </label>
      <label className="block">
        <span className={avecCls.sectionTitle}>{t("avec_profile_email")}</span>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className={avecCls.input} />
      </label>
      <label className="block">
        <span className={avecCls.sectionTitle}>{t("avec_profile_desc")}</span>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className={`${avecCls.input} min-h-[72px]`} />
      </label>
      {err ? <p className="text-xs text-rose-700">{clientErrorText(t, err)}</p> : null}
      <button type="button" disabled={busy} onClick={() => void save()} className={avecCls.btnPrimary}>
        {t("group_settings_save")}
      </button>
    </div>
  );
}

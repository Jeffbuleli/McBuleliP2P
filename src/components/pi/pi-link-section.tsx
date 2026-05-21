"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { clientErrorText } from "@/lib/client-error-text";
import { piInit } from "@/lib/pi-browser";

export function PiLinkSection() {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const errMsg = useMemo(() => (err ? clientErrorText(t, err) : null), [err, t]);

  async function link() {
    setErr(null);
    setOk(false);
    setBusy(true);
    try {
      const Pi = await piInit();
      const res = await Promise.resolve(
        Pi.authenticate(["username"], async () => {}),
      );
      const accessToken = (res as unknown as { accessToken?: unknown })?.accessToken;
      if (typeof accessToken !== "string" || !accessToken.trim()) {
        setErr("pi_auth_failed");
        return;
      }

      const apiRes = await fetch("/api/auth/pi/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });
      const data = await apiRes.json().catch(() => ({}));
      if (!apiRes.ok) {
        setErr(typeof data.error === "string" ? data.error : "pi_auth_failed");
        return;
      }
      setOk(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="fd-card p-5">
      <div className="flex items-center gap-3">
        <Image
          src="/assets/crypto/pi.png"
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 rounded-full"
        />
        <div>
          <h2 className="text-sm font-bold text-[color:var(--fd-text)]">Pi Network</h2>
          <p className="mt-0.5 text-xs text-[color:var(--fd-muted)]">{t("profile_link_pi")}</p>
        </div>
      </div>
      {errMsg ? (
        <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{errMsg}</p>
      ) : null}
      {ok ? (
        <p className="mt-3 rounded-xl bg-[color:var(--fd-mint)] px-3 py-2 text-sm font-semibold text-[color:var(--fd-primary)]">
          {t("profile_link_pi_done")}
        </p>
      ) : null}
      <button
        type="button"
        disabled={busy || ok}
        onClick={() => void link()}
        className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[color:var(--fd-primary)] px-4 text-sm font-bold text-white disabled:opacity-40"
      >
        <Image src="/assets/crypto/pi.png" alt="" width={22} height={22} className="rounded-full" />
        {busy ? "…" : t("profile_link_pi")}
      </button>
    </section>
  );
}

"use client";

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
        Pi.authenticate(["username"], async () => {
          // no-op (server-side link uses access token)
        }),
      );
      // Pi SDK stores access token internally; we need it from the returned object in most SDKs.
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
    <section className="rounded-2xl border border-stone-700/50 bg-stone-900/40 p-4">
      <h2 className="text-sm font-bold text-stone-200">Pi</h2>
      <p className="mt-2 text-xs leading-relaxed text-stone-400">
        {t("profile_link_pi")}
      </p>
      {errMsg ? (
        <p className="mt-3 rounded-lg bg-rose-950/50 px-3 py-2 text-sm text-rose-100">{errMsg}</p>
      ) : null}
      {ok ? (
        <p className="mt-3 rounded-lg bg-emerald-950/40 px-3 py-2 text-sm text-emerald-100">
          {t("profile_link_pi_done")}
        </p>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void link()}
        className="mt-3 w-full rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold text-stone-950 disabled:opacity-40"
      >
        {busy ? "…" : t("profile_link_pi")}
      </button>
    </section>
  );
}


"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { McBuleliPoweredFooter } from "@/components/brand/mcbuleli-powered-footer";
import { clientErrorText } from "@/lib/client-error-text";

function JoinContent() {
  const { t } = useI18n();
  const sp = useSearchParams();
  const router = useRouter();
  const code = sp.get("code")?.trim().toUpperCase() ?? "";
  const [manual, setManual] = useState(code);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function join() {
    const inviteCode = (manual || code).trim().toUpperCase();
    if (!inviteCode) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      const groupId = (j as { groupId?: string }).groupId;
      if (groupId) router.replace(`/app/wallet/groups/${groupId}`);
      else router.replace("/app/wallet/groups");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-2 pb-10">
      <h1 className="text-lg font-bold text-[color:var(--fd-text)]">{t("avec_join_title")}</h1>
      <p className="mt-1 text-xs text-[color:var(--fd-muted)]">{t("avec_join_sub")}</p>
      <input
        value={manual}
        onChange={(e) => setManual(e.target.value.toUpperCase())}
        placeholder="XXXXXXXX"
        className="mt-4 w-full rounded-xl border border-[color:var(--fd-border)] px-3 py-3 text-center font-mono text-sm tracking-widest"
        maxLength={16}
      />
      {err ? (
        <p className="mt-2 text-sm text-rose-700">{clientErrorText(t, err)}</p>
      ) : null}
      <button
        type="button"
        disabled={busy || manual.length < 6}
        onClick={() => void join()}
        className="mt-4 w-full rounded-xl bg-[color:var(--fd-primary)] py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {t("avec_join_cta")}
      </button>
      <McBuleliPoweredFooter />
    </div>
  );
}

export default function AvecJoinPage() {
  return (
    <Suspense fallback={<p className="p-4 text-[color:var(--fd-muted)]">…</p>}>
      <JoinContent />
    </Suspense>
  );
}

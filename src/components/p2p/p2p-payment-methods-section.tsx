"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { clientErrorText } from "@/lib/client-error-text";

type Def = { code: string; label: string; countryCode: string };
type Mine = {
  id: string;
  methodCode: string;
  accountName: string;
  accountNumberOrPhone: string;
  active: boolean;
  updatedAt: string;
};

export function P2pPaymentMethodsSection() {
  const { t } = useI18n();
  const [defs, setDefs] = useState<Def[]>([]);
  const [mine, setMine] = useState<Mine[]>([]);
  const [countryCode, setCountryCode] = useState("CD");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const [methodCode, setMethodCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumberOrPhone, setAccountNumberOrPhone] = useState("");

  const errMsg = useMemo(() => (err ? clientErrorText(t, err) : null), [err, t]);

  async function loadMe() {
    const res = await fetch("/api/p2p/me/payment-methods");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(typeof data.error === "string" ? data.error : "Unauthorized");
      return;
    }
    setErr(null);
    setCountryCode(typeof data.countryCode === "string" ? data.countryCode : "CD");
    setMine((data.methods as Mine[]) ?? []);
  }

  async function loadDefs(cc: string) {
    const res = await fetch(`/api/p2p/payment-methods?country=${encodeURIComponent(cc)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      setDefs([]);
      return;
    }
    const list = (data.methods as Def[]) ?? [];
    setDefs(list);
    if (!methodCode && list.length) setMethodCode(list[0]!.code);
  }

  useEffect(() => {
    void loadMe();
  }, []);

  useEffect(() => {
    void loadDefs(countryCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode]);

  async function add() {
    setErr(null);
    setOk(false);
    setBusy(true);
    try {
      const res = await fetch("/api/p2p/me/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          methodCode,
          accountName: accountName.trim(),
          accountNumberOrPhone: accountNumberOrPhone.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "p2p_action_not_allowed");
        return;
      }
      setAccountName("");
      setAccountNumberOrPhone("");
      setOk(true);
      await loadMe();
    } finally {
      setBusy(false);
    }
  }

  async function toggle(id: string, active: boolean) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/p2p/me/payment-methods", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "p2p_action_not_allowed");
        return;
      }
      await loadMe();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-stone-700/50 bg-stone-900/40 p-4">
      <h2 className="text-sm font-bold text-stone-200">{t("p2p_payment_methods_title")}</h2>
      <p className="mt-2 text-xs leading-relaxed text-stone-400">{t("p2p_payment_methods_intro")}</p>

      {errMsg ? (
        <p className="mt-3 rounded-lg bg-rose-950/50 px-3 py-2 text-sm text-rose-100">{errMsg}</p>
      ) : null}
      {ok ? (
        <p className="mt-3 rounded-lg bg-emerald-950/40 px-3 py-2 text-sm text-emerald-100">
          {t("p2p_payment_method_saved")}
        </p>
      ) : null}

      <div className="mt-4 grid gap-2">
        <label className="text-xs font-semibold text-stone-300">
          {t("p2p_payment_method_code")}
          <select
            value={methodCode}
            onChange={(e) => setMethodCode(e.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-950/60 px-3 py-2 text-sm text-stone-100 outline-none"
          >
            {defs.map((d) => (
              <option key={d.code} value={d.code}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-stone-300">
          {t("p2p_payment_method_name")}
          <input
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-950/60 px-3 py-2 text-sm text-stone-100 outline-none"
          />
        </label>
        <label className="text-xs font-semibold text-stone-300">
          {t("p2p_payment_method_number")}
          <input
            value={accountNumberOrPhone}
            onChange={(e) => setAccountNumberOrPhone(e.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-700 bg-stone-950/60 px-3 py-2 text-sm text-stone-100 outline-none"
          />
        </label>
        <button
          type="button"
          disabled={busy || !methodCode || accountName.trim().length < 2 || accountNumberOrPhone.trim().length < 3}
          onClick={() => void add()}
          className="mt-1 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
        >
          {t("p2p_payment_methods_add")}
        </button>
      </div>

      <div className="mt-5">
        {!mine.length ? (
          <p className="text-sm text-stone-500">—</p>
        ) : (
          <ul className="space-y-2">
            {mine.map((m) => (
              <li
                key={m.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-stone-700 bg-stone-950/40 p-3 text-sm text-stone-100"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-stone-200">
                    {m.methodCode} · {m.accountName}
                  </p>
                  <p className="mt-1 font-mono text-xs text-stone-400">{m.accountNumberOrPhone}</p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void toggle(m.id, !m.active)}
                  className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-40 ${
                    m.active
                      ? "border border-rose-500/60 text-rose-100"
                      : "border border-emerald-500/40 text-emerald-100"
                  }`}
                >
                  {m.active ? "Disable" : "Enable"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}


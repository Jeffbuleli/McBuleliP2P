"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { countryLabel } from "@/lib/country-label";
import { clientErrorText } from "@/lib/client-error-text";
import { getP2pCatalogMethodKind } from "@/lib/p2p-payment-method-catalog";

type Def = { code: string; label: string; countryCode: string };
type Mine = {
  id: string;
  methodCode: string;
  accountName: string;
  accountNumberOrPhone: string;
  active: boolean;
  updatedAt: string;
};

const fieldCls =
  "w-full rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-2.5 text-sm text-[color:var(--fd-text)] outline-none ring-[color:var(--fd-primary)]/25 focus:ring-2 disabled:opacity-45";

function kindTone(kind: string | null): string {
  if (kind === "bank") return "bg-sky-100 text-sky-800";
  if (kind === "wallet") return "bg-violet-100 text-violet-800";
  return "bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]";
}

export function P2pPaymentMethodsSection() {
  const { t, locale } = useI18n();
  const [defs, setDefs] = useState<Def[]>([]);
  const [mine, setMine] = useState<Mine[]>([]);
  const [countryCode, setCountryCode] = useState("CD");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [methodCode, setMethodCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumberOrPhone, setAccountNumberOrPhone] = useState("");

  const errMsg = useMemo(() => (err ? clientErrorText(t, err) : null), [err, t]);
  const defLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of defs) m.set(d.code, d.label);
    return (code: string) => m.get(code) ?? code;
  }, [defs]);

  const regionLabel = countryLabel(locale, countryCode);

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
      setMethodCode("");
      return;
    }
    const list = (data.methods as Def[]) ?? [];
    setDefs(list);
    setMethodCode((prev) => {
      if (!list.length) return "";
      if (!prev || !list.some((d) => d.code === prev)) return list[0]!.code;
      return prev;
    });
  }

  useEffect(() => {
    void loadMe();
  }, []);

  useEffect(() => {
    void loadDefs(countryCode);
  }, [countryCode]);

  function resetForm() {
    setAccountName("");
    setAccountNumberOrPhone("");
    setEditId(null);
    if (defs.length) setMethodCode(defs[0]!.code);
  }

  function startEdit(m: Mine) {
    setEditId(m.id);
    setMethodCode(m.methodCode);
    setAccountName(m.accountName);
    setAccountNumberOrPhone(m.accountNumberOrPhone);
    setShowAdd(true);
    setErr(null);
  }

  async function save() {
    setErr(null);
    setBusy(true);
    try {
      if (editId) {
        const res = await fetch("/api/p2p/me/payment-methods", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editId,
            accountName: accountName.trim(),
            accountNumberOrPhone: accountNumberOrPhone.trim(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setErr(typeof data.error === "string" ? data.error : "p2p_action_not_allowed");
          return;
        }
      } else {
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
      }
      resetForm();
      setShowAdd(false);
      await loadMe();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/p2p/me/payment-methods", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "p2p_action_not_allowed");
        return;
      }
      if (editId === id) {
        resetForm();
        setShowAdd(false);
      }
      await loadMe();
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(m: Mine) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/p2p/me/payment-methods", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: m.id, active: !m.active }),
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

  const canSave =
    defs.length > 0 &&
    methodCode &&
    accountName.trim().length >= 2 &&
    accountNumberOrPhone.trim().length >= 3;

  const activeMethods = mine.filter((m) => m.active);
  const inactiveMethods = mine.filter((m) => !m.active);

  return (
    <section className="fd-card overflow-hidden p-0">
      <div className="flex items-center justify-between gap-2 border-b border-[color:var(--fd-border)] bg-stone-50/80 px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-[color:var(--fd-text)]">
            {t("p2p_payment_methods_title")}
          </h2>
          <p className="text-[10px] text-[color:var(--fd-muted)]">{regionLabel}</p>
        </div>
        {!showAdd && defs.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowAdd(true);
            }}
            className="rounded-xl bg-[color:var(--fd-primary)] px-3 py-2 text-xs font-bold text-white active:scale-[0.98]"
          >
            +
          </button>
        ) : null}
      </div>

      <div className="p-4">
        {errMsg ? (
          <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
            {errMsg}
          </p>
        ) : null}

        {!defs.length ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
            {t("p2p_payment_methods_no_networks")}
          </p>
        ) : null}

        {mine.length === 0 && !showAdd ? (
          <p className="py-6 text-center text-xs text-[color:var(--fd-muted)]">
            {t("p2p_payment_methods_empty")}
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[color:var(--fd-border)]">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-stone-100/90 text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
                  <th className="px-3 py-2">{t("p2p_payment_col_method")}</th>
                  <th className="px-3 py-2">{t("p2p_payment_method_name")}</th>
                  <th className="w-24 px-2 py-2 text-right" />
                </tr>
              </thead>
              <tbody>
                {[...activeMethods, ...inactiveMethods].map((m) => {
                  const kind = getP2pCatalogMethodKind(countryCode, m.methodCode);
                  return (
                    <tr
                      key={m.id}
                      className={`border-t border-[color:var(--fd-border)] ${
                        m.active ? "bg-white" : "bg-stone-50/80 opacity-60"
                      }`}
                    >
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${kindTone(kind)}`}
                        >
                          {defLabel(m.methodCode)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-[color:var(--fd-text)]">{m.accountName}</p>
                        <p className="font-mono text-[10px] tabular-nums text-[color:var(--fd-muted)]">
                          {m.accountNumberOrPhone}
                        </p>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => startEdit(m)}
                            className="rounded-lg border border-[color:var(--fd-border)] px-2 py-1 text-[10px] font-bold text-[color:var(--fd-primary)]"
                          >
                            {t("p2p_payment_edit")}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void remove(m.id)}
                            className="rounded-lg border border-rose-200 px-2 py-1 text-[10px] font-bold text-rose-700"
                          >
                            {t("p2p_payment_delete")}
                          </button>
                        </div>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void toggleActive(m)}
                          className="mt-1 w-full text-right text-[9px] font-semibold text-[color:var(--fd-muted)] underline"
                        >
                          {m.active ? t("p2p_payment_disable") : t("p2p_payment_enable")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {showAdd ? (
          <div className="mt-4 space-y-2 rounded-2xl border border-[color:var(--fd-border)] bg-stone-50/50 p-3">
            <p className="text-xs font-bold text-[color:var(--fd-text)]">
              {editId ? t("p2p_payment_edit_title") : t("p2p_payment_add_title")}
            </p>
            <select
              value={methodCode}
              onChange={(e) => setMethodCode(e.target.value)}
              disabled={Boolean(editId) || !defs.length}
              className={fieldCls}
            >
              {defs.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.label}
                </option>
              ))}
            </select>
            <input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder={t("p2p_payment_method_name")}
              className={fieldCls}
            />
            <input
              value={accountNumberOrPhone}
              onChange={(e) => setAccountNumberOrPhone(e.target.value)}
              placeholder={t("p2p_payment_method_number")}
              className={fieldCls}
              inputMode="tel"
            />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={busy || !canSave}
                onClick={() => void save()}
                className="flex-1 rounded-xl bg-[color:var(--fd-primary)] py-2.5 text-sm font-bold text-white disabled:opacity-40"
              >
                {t("p2p_payment_save")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  resetForm();
                  setShowAdd(false);
                }}
                className="rounded-xl border border-[color:var(--fd-border)] px-4 py-2.5 text-sm font-bold text-[color:var(--fd-muted)]"
              >
                {t("p2p_payment_cancel")}
              </button>
            </div>
          </div>
        ) : defs.length > 0 && mine.length === 0 ? (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowAdd(true);
            }}
            className="mt-4 flex w-full items-center justify-center rounded-2xl border-2 border-dashed border-[color:var(--fd-border)] py-4 text-sm font-bold text-[color:var(--fd-primary)]"
          >
            {t("p2p_payment_methods_add")}
          </button>
        ) : null}
      </div>
    </section>
  );
}

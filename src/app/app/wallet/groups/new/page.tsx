"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";

export default function GroupCreatePage() {
  const { t } = useI18n();
  const router = useRouter();
  const [type, setType] = useState<"likelimba" | "avec">("likelimba");
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [minMembers, setMinMembers] = useState("5");
  const [maxMembers, setMaxMembers] = useState("15");
  const [amount, setAmount] = useState("10");
  const [cycleDays, setCycleDays] = useState("30");
  const [rules, setRules] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const parsed = useMemo(() => {
    const min = Number(minMembers);
    const max = Number(maxMembers);
    const a = Number(amount.replace(",", "."));
    const cd = Number(cycleDays);
    return { min, max, a, cd };
  }, [minMembers, maxMembers, amount, cycleDays]);

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name,
          countryCode: countryCode.trim() || null,
          minMembers: parsed.min,
          maxMembers: parsed.max,
          contributionAmountUsdt: parsed.a,
          cycleDurationDays: parsed.cd,
          paymentRules: rules.trim() || null,
        }),
      });
      const j = (await res.json()) as { error?: string; groupId?: string };
      if (!res.ok) {
        setErr(j.error ?? "error");
        return;
      }
      router.replace(`/app/wallet/groups/${j.groupId}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 pb-10">
      <div>
        <h1 className="text-lg font-bold text-stone-900 dark:text-stone-50">
          {t("group_new_title")}
        </h1>
        <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
          {t("group_new_sub")}
        </p>
      </div>

      {err ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950/50 dark:text-rose-200">
          {err}
        </p>
      ) : null}

      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs font-semibold text-stone-600 dark:text-stone-400">
            {t("group_field_type")}
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "likelimba" | "avec")}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-50"
            >
              <option value="likelimba">{t("group_type_likelimba")}</option>
              <option value="avec">{t("group_type_avec")}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-stone-600 dark:text-stone-400">
            {t("group_field_country")}
            <input
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              placeholder="CD"
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-50"
            />
          </label>
          <label className="col-span-2 flex flex-col gap-1 text-xs font-semibold text-stone-600 dark:text-stone-400">
            {t("group_field_name")}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("group_field_name_ph")}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-50"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-stone-600 dark:text-stone-400">
            {t("group_field_min_members")}
            <input
              value={minMembers}
              onChange={(e) => setMinMembers(e.target.value)}
              inputMode="numeric"
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-50"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-stone-600 dark:text-stone-400">
            {t("group_field_max_members")}
            <input
              value={maxMembers}
              onChange={(e) => setMaxMembers(e.target.value)}
              inputMode="numeric"
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-50"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-stone-600 dark:text-stone-400">
            {t("group_field_amount")}
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-50"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-stone-600 dark:text-stone-400">
            {t("group_field_cycle_days")}
            <input
              value={cycleDays}
              onChange={(e) => setCycleDays(e.target.value)}
              inputMode="numeric"
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-50"
            />
          </label>
          <label className="col-span-2 flex flex-col gap-1 text-xs font-semibold text-stone-600 dark:text-stone-400">
            {t("group_field_rules")}
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder={t("group_field_rules_ph")}
              className="min-h-[90px] rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-50"
            />
          </label>
        </div>

        <p className="mt-3 text-[11px] leading-snug text-stone-500">
          {t("group_new_fee_note")}
        </p>

        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="mt-4 w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {t("group_new_submit")}
        </button>
      </div>
    </div>
  );
}


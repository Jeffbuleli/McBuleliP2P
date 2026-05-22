"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AvecHeroIllustration } from "@/components/groups/avec-icons";
import { avecCls } from "@/components/groups/avec-ui";
import { useI18n } from "@/components/i18n-provider";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import { APP_COUNTRY_CODES } from "@/lib/country-codes";
import { countryLabel } from "@/lib/country-label";
import {
  AVEC_DEFAULT_CYCLE_DAYS,
  AVEC_DEFAULT_MAX_MEMBERS,
  AVEC_DEFAULT_MIN_MEMBERS,
  AVEC_DEFAULT_SHARE_VALUE_USDT,
  AVEC_MAX_SHARES_PER_MEETING,
} from "@/lib/group-savings-types";
import { clientErrorText } from "@/lib/client-error-text";

export default function AvecCreatePage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("CD");
  const [minMembers, setMinMembers] = useState(String(AVEC_DEFAULT_MIN_MEMBERS));
  const [maxMembers, setMaxMembers] = useState(String(AVEC_DEFAULT_MAX_MEMBERS));
  const [shareValue, setShareValue] = useState(String(AVEC_DEFAULT_SHARE_VALUE_USDT));
  const [cycleDays, setCycleDays] = useState(String(AVEC_DEFAULT_CYCLE_DAYS));
  const [meetingDays, setMeetingDays] = useState("7");
  const [maxShares, setMaxShares] = useState(String(AVEC_MAX_SHARES_PER_MEETING));
  const [socialFund, setSocialFund] = useState("0");
  const [rules, setRules] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const parsed = useMemo(() => {
    const min = Number(minMembers);
    const max = Number(maxMembers);
    const share = Number(shareValue.replace(",", "."));
    const cd = Number(cycleDays);
    const md = Number(meetingDays);
    const ms = Number(maxShares);
    const sf = Number(socialFund.replace(",", "."));
    return { min, max, share, cd, md, ms, sf };
  }, [minMembers, maxMembers, shareValue, cycleDays, meetingDays, maxShares, socialFund]);

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          countryCode: countryCode.trim() || null,
          minMembers: parsed.min,
          maxMembers: parsed.max,
          contributionAmountUsdt: parsed.share,
          cycleDurationDays: parsed.cd,
          maxSharesPerMeeting: parsed.ms,
          meetingIntervalDays: parsed.md,
          socialFundUsdt: parsed.sf,
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
      <WalletSubpageHeader title={t("group_new_title")} subtitle={t("group_new_sub")} />

      {err ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {clientErrorText(t, err)}
        </p>
      ) : null}

      <div className={avecCls.hero}>
        <div className="text-[color:var(--fd-primary)]">
          <AvecHeroIllustration />
        </div>
        <ul className="min-w-0 flex-1 space-y-1 text-[11px] leading-snug text-[color:var(--fd-muted)]">
          <li>{t("avec_principle_1")}</li>
          <li>{t("avec_principle_2")}</li>
          <li>{t("avec_principle_3")}</li>
        </ul>
      </div>

      <div className={`${avecCls.section} grid grid-cols-2 gap-2`}>
        <label className="col-span-2 flex flex-col gap-1">
          <span className={avecCls.sectionTitle}>{t("group_field_name")}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("group_field_name_ph")}
            className={avecCls.input}
          />
        </label>
        <label className="col-span-2 flex flex-col gap-1">
          <span className={avecCls.sectionTitle}>{t("group_field_country")}</span>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className={avecCls.input}
          >
            {APP_COUNTRY_CODES.map((c) => (
              <option key={c} value={c}>
                {countryLabel(locale, c)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={avecCls.sectionTitle}>{t("group_field_min_members")}</span>
          <input
            value={minMembers}
            onChange={(e) => setMinMembers(e.target.value)}
            inputMode="numeric"
            className={avecCls.input}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={avecCls.sectionTitle}>{t("group_field_max_members")}</span>
          <input
            value={maxMembers}
            onChange={(e) => setMaxMembers(e.target.value)}
            inputMode="numeric"
            className={avecCls.input}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={avecCls.sectionTitle}>{t("group_field_share_value")}</span>
          <input
            value={shareValue}
            onChange={(e) => setShareValue(e.target.value)}
            inputMode="decimal"
            className={avecCls.input}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={avecCls.sectionTitle}>{t("group_field_cycle_days")}</span>
          <input
            value={cycleDays}
            onChange={(e) => setCycleDays(e.target.value)}
            inputMode="numeric"
            className={avecCls.input}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={avecCls.sectionTitle}>{t("group_field_meeting_days")}</span>
          <input
            value={meetingDays}
            onChange={(e) => setMeetingDays(e.target.value)}
            inputMode="numeric"
            className={avecCls.input}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={avecCls.sectionTitle}>{t("group_field_max_shares")}</span>
          <input
            value={maxShares}
            onChange={(e) => setMaxShares(e.target.value)}
            inputMode="numeric"
            className={avecCls.input}
          />
        </label>
        <label className="col-span-2 flex flex-col gap-1">
          <span className={avecCls.sectionTitle}>{t("group_field_social_fund")}</span>
          <input
            value={socialFund}
            onChange={(e) => setSocialFund(e.target.value)}
            inputMode="decimal"
            className={avecCls.input}
          />
        </label>
        <label className="col-span-2 flex flex-col gap-1">
          <span className={avecCls.sectionTitle}>{t("group_field_rules")}</span>
          <textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder={t("group_field_rules_ph")}
            className={`${avecCls.input} min-h-[72px]`}
          />
        </label>
      </div>

      <p className="text-center text-[10px] text-[color:var(--fd-muted)]">{t("group_new_fee_note")}</p>

      <button type="button" disabled={busy} onClick={() => void submit()} className={avecCls.btnPrimary}>
        {t("group_new_submit")}
      </button>
    </div>
  );
}

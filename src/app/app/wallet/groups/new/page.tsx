"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AvecHeroIllustration } from "@/components/groups/avec-icons";
import { avecCls } from "@/components/groups/avec-ui";
import { useI18n } from "@/components/i18n-provider";
import { ServiceFeeConsent } from "@/components/wallet/service-fee-consent";
import { TransactionStepper } from "@/components/wallet/transaction-progress";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import { APP_COUNTRY_CODES } from "@/lib/country-codes";
import { countryLabel } from "@/lib/country-label";
import { clientErrorText } from "@/lib/client-error-text";
import { groupCreationProgressSteps } from "@/lib/group-create-progress";
import {
  AVEC_DEFAULT_CYCLE_DAYS,
  AVEC_DEFAULT_MAX_MEMBERS,
  AVEC_DEFAULT_MIN_MEMBERS,
  AVEC_DEFAULT_SHARE_VALUE_USDT,
  AVEC_MAX_SHARES_PER_MEETING,
  GROUP_SUBSCRIPTION_FEE_USDT,
} from "@/lib/group-savings-types";

const FETCH_TIMEOUT_MS = 45_000;

async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  ms: number,
): Promise<{ res: Response; body: Record<string, unknown> }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    const text = await res.text();
    let body: Record<string, unknown> = {};
    if (text) {
      try {
        body = JSON.parse(text) as Record<string, unknown>;
      } catch {
        body = { error: "group_create_failed" };
      }
    }
    return { res, body };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return { res: new Response(null, { status: 408 }), body: { error: "group_create_timeout" } };
    }
    return { res: new Response(null, { status: 0 }), body: { error: "group_create_failed" } };
  } finally {
    clearTimeout(timer);
  }
}

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
  const [publicDesc, setPublicDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [feeChecked, setFeeChecked] = useState(false);
  const [feeWaived, setFeeWaived] = useState(false);
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);
  const [createdStatus, setCreatedStatus] = useState<string | null>(null);

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

  useEffect(() => {
    void fetch("/api/groups/fee-preview", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { feeWaived?: boolean }) => {
        if (j.feeWaived) setFeeWaived(true);
      })
      .catch(() => {});
  }, []);

  function validateClient(): string | null {
    const n = name.trim();
    if (n.length < 2) return "group_invalid_name";
    if (!Number.isFinite(parsed.min) || parsed.min < 2) return "group_invalid_members";
    if (!Number.isFinite(parsed.max) || parsed.max < parsed.min) return "group_invalid_members";
    if (!Number.isFinite(parsed.share) || parsed.share <= 0) return "group_invalid_contribution";
    if (!Number.isFinite(parsed.cd) || parsed.cd < 7 || parsed.cd > 365) return "group_invalid_cycle";
    if (!Number.isFinite(parsed.sf) || parsed.sf < 0) return "group_invalid_social_fund";
    const maxSf = parsed.share * (Number.isFinite(parsed.ms) && parsed.ms > 0 ? parsed.ms : 5);
    if (parsed.sf > maxSf) return "group_social_fund_too_high";
    return null;
  }

  async function submit() {
    const clientErr = validateClient();
    if (clientErr) {
      setErr(clientErr);
      return;
    }
    if (!feeWaived && !feeChecked) {
      setErr("group_fee_consent_required");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const { res, body } = await fetchJsonWithTimeout(
        "/api/groups",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            countryCode: countryCode.trim() || null,
            minMembers: parsed.min,
            maxMembers: parsed.max,
            contributionAmountUsdt: parsed.share,
            cycleDurationDays: parsed.cd,
            maxSharesPerMeeting: parsed.ms,
            meetingIntervalDays: parsed.md,
            socialFundUsdt: parsed.sf,
            paymentRules: rules.trim() || null,
            publicDescription: publicDesc.trim() || null,
            feeConsentAuthorized: true,
          }),
        },
        FETCH_TIMEOUT_MS,
      );
      if (!res.ok) {
        setErr(typeof body.error === "string" ? body.error : "group_create_failed");
        return;
      }
      const groupId = typeof body.groupId === "string" ? body.groupId : null;
      if (!groupId) {
        setErr("group_create_failed");
        return;
      }
      const status = typeof body.status === "string" ? body.status : "pending";
      if (body.feeWaived === true) setFeeWaived(true);
      setCreatedGroupId(groupId);
      setCreatedStatus(status);
      if (status === "active") {
        router.replace(`/app/wallet/groups/${groupId}`);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  const progressSteps = groupCreationProgressSteps(createdStatus ?? "pending");

  if (createdGroupId && createdStatus !== "active") {
    return (
      <div className="space-y-4 pb-10">
        <WalletSubpageHeader title={t("group_create_progress_title")} />
        <TransactionStepper steps={progressSteps} />
        <p className="text-center text-sm text-[color:var(--fd-muted)]">{t("group_create_pending_note")}</p>
        <button
          type="button"
          className={avecCls.btnPrimary}
          onClick={() => router.replace(`/app/wallet/groups/${createdGroupId}?created=1`)}
        >
          {t("group_create_view_avec")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      <WalletSubpageHeader title={t("group_new_title")} subtitle={t("group_new_sub")} />

      {err ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {clientErrorText(t, err)}
        </p>
      ) : null}

      {busy ? (
        <div className="space-y-3">
          <TransactionStepper steps={groupCreationProgressSteps("pending")} />
          <p className="text-center text-xs text-[color:var(--fd-muted)]">{t("group_create_submitting")}</p>
        </div>
      ) : null}

      {!busy ? (
        <>
          <div className={avecCls.hero}>
            <div className="text-[color:var(--fd-primary)]">
              <AvecHeroIllustration />
            </div>
            <p className="min-w-0 flex-1 text-[11px] leading-snug text-[color:var(--fd-muted)]">
              {t("avec_create_hint")}
            </p>
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
              <span className="text-[10px] text-[color:var(--fd-muted)]">
                {t("group_field_social_fund_hint")}
              </span>
            </label>
            <label className="col-span-2 flex flex-col gap-1">
              <span className={avecCls.sectionTitle}>{t("group_field_public_desc")}</span>
              <textarea
                value={publicDesc}
                onChange={(e) => setPublicDesc(e.target.value)}
                placeholder={t("group_field_public_desc_ph")}
                className={`${avecCls.input} min-h-[56px]`}
                maxLength={2000}
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

          <ServiceFeeConsent
            compact={!feeWaived}
            lines={[
              {
                label: t("service_fee_line_mcbuleli"),
                amount: String(GROUP_SUBSCRIPTION_FEE_USDT),
                asset: "USDT/mo",
              },
            ]}
            totalLabel={t("service_fee_total")}
            totalAmount={String(GROUP_SUBSCRIPTION_FEE_USDT)}
            note={feeWaived ? undefined : t("service_fee_note_treasury")}
            waived={feeWaived}
            checked={feeChecked}
            onCheckedChange={setFeeChecked}
          />

          <button
            type="button"
            disabled={busy || name.trim().length < 2 || (!feeWaived && !feeChecked)}
            onClick={() => void submit()}
            className={avecCls.btnPrimary}
          >
            {busy ? t("group_create_submitting") : t("group_new_submit")}
          </button>
        </>
      ) : null}
    </div>
  );
}

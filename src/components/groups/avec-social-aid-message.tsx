"use client";

import { useI18n } from "@/components/i18n-provider";
import type { Messages } from "@/i18n/messages";
import { AvecIconSolidarity } from "@/components/groups/avec-icons";

export type SocialAidMessageMeta = {
  requestId?: string;
  amountUsdt: number;
  requesterDisplay?: string;
  aidType?: string;
  aidMode?: string;
};

export function parseSocialAidMeta(
  meta: Record<string, unknown> | null,
  body?: string,
): SocialAidMessageMeta | null {
  if (meta && typeof meta.amountUsdt === "number") {
    return meta as unknown as SocialAidMessageMeta;
  }
  if (body?.startsWith("SOCIAL_AID_REQUEST") || body?.startsWith("SOCIAL_AID_PAID")) {
    const p = body.split("|");
    const amount = Number(p[2]);
    if (!Number.isFinite(amount)) return null;
    return {
      requestId: p[1],
      amountUsdt: amount,
      aidType: p[3],
    };
  }
  return null;
}

function aidTypeLabel(t: (k: keyof Messages) => string, aidType?: string): string {
  if (!aidType) return "";
  const key = `avec_social_aid_type_${aidType}` as keyof Messages;
  return t(key);
}

export function AvecSocialAidRequestedMessage({
  meta,
  createdAt,
  locale,
}: {
  meta: SocialAidMessageMeta | null;
  createdAt: string;
  locale: string;
}) {
  const { t } = useI18n();
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  if (!meta) {
    return (
      <p className="text-center text-[10px] text-[color:var(--fd-muted)]">
        {t("avec_chat_social_aid_fallback")}
      </p>
    );
  }
  return (
    <div className="w-full max-w-sm rounded-2xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-center shadow-sm">
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
        <AvecIconSolidarity className="h-5 w-5" />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-amber-900">
        {t("avec_chat_social_aid_requested")}
      </p>
      <p className="mt-1 text-sm font-black tabular-nums text-amber-950">
        {meta.amountUsdt.toFixed(2)} USDT
      </p>
      {meta.requesterDisplay ? (
        <p className="mt-0.5 text-xs font-semibold text-[color:var(--fd-text)]">
          {meta.requesterDisplay}
        </p>
      ) : null}
      {meta.aidType ? (
        <p className="mt-0.5 text-[10px] text-amber-800">{aidTypeLabel(t, meta.aidType)}</p>
      ) : null}
      <p className="mt-2 text-[10px] font-semibold text-violet-800">
        {t("group_gov_vote_in_dialogue")}
      </p>
      <p className="mt-1 text-[9px] text-[color:var(--fd-muted)]">
        {new Date(createdAt).toLocaleString(loc)}
      </p>
    </div>
  );
}

export function AvecSocialAidPaidMessage({
  meta,
  createdAt,
  locale,
}: {
  meta: SocialAidMessageMeta | null;
  createdAt: string;
  locale: string;
}) {
  const { t } = useI18n();
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  if (!meta) {
    return (
      <p className="text-center text-[10px] text-[color:var(--fd-muted)]">
        {t("avec_chat_social_aid_fallback")}
      </p>
    );
  }
  return (
    <div className="w-full max-w-sm rounded-2xl border border-emerald-200/90 bg-emerald-50/90 px-4 py-3 text-center shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">
        {t("avec_chat_social_aid_paid")}
      </p>
      <p className="mt-1 text-sm font-black tabular-nums text-emerald-950">
        {meta.amountUsdt.toFixed(2)} USDT
      </p>
      {meta.requesterDisplay ? (
        <p className="mt-0.5 text-xs font-semibold text-[color:var(--fd-text)]">
          {meta.requesterDisplay}
        </p>
      ) : null}
      {meta.aidType ? (
        <p className="mt-0.5 text-[10px] text-emerald-800">{aidTypeLabel(t, meta.aidType)}</p>
      ) : null}
      <p className="mt-1 text-[9px] text-[color:var(--fd-muted)]">
        {new Date(createdAt).toLocaleString(loc)}
      </p>
    </div>
  );
}

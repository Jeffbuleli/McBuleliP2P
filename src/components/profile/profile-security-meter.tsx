"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProfileIconChevronRight, ProfileIconShield } from "@/components/icons/profile-icons";
import { profileChipClass } from "@/components/profile/profile-vibrant-styles";
import { useI18n } from "@/components/i18n-provider";

type SecurityStatus = {
  emailVerified: boolean;
  totpEnabled: boolean;
  passkeyCount: number;
  whatsAppVerified: boolean;
};

type SecurityLevel = "high" | "medium" | "low";

function computeLevel(s: SecurityStatus): SecurityLevel {
  const score =
    (s.emailVerified ? 40 : 0) +
    (s.totpEnabled ? 30 : 0) +
    (s.passkeyCount > 0 ? 20 : 0) +
    (s.whatsAppVerified ? 10 : 0);
  if (score >= 70) return "high";
  if (s.emailVerified) return "medium";
  return "low";
}

function filledSegments(level: SecurityLevel): number {
  if (level === "high") return 3;
  if (level === "medium") return 2;
  return 1;
}

export function ProfileSecurityMeter() {
  const { t } = useI18n();
  const [status, setStatus] = useState<SecurityStatus | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/auth/security");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    setStatus({
      emailVerified: Boolean(data.emailVerified),
      totpEnabled: Boolean(data.totpEnabled),
      passkeyCount: Number(data.passkeyCount ?? 0),
      whatsAppVerified: Boolean(data.whatsAppVerified),
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const level = useMemo(
    () => (status ? computeLevel(status) : ("low" as SecurityLevel)),
    [status],
  );
  const segments = filledSegments(level);

  const levelLabel =
    level === "high"
      ? t("profile_security_level_high")
      : level === "medium"
        ? t("profile_security_level_medium")
        : t("profile_security_level_low");

  const cta =
    level === "high"
      ? t("profile_security_meter_manage")
      : t("profile_security_meter_cta");

  const barColor =
    level === "high"
      ? "bg-[color:var(--fd-primary)]"
      : level === "medium"
        ? "bg-amber-500"
        : "bg-rose-500";

  return (
    <Link
      href="/app/profile/security"
      className="fd-card flex items-center gap-3.5 p-4 active:scale-[0.99]"
    >
      <span className={`${profileChipClass.forest} flex h-11 w-11 shrink-0 items-center justify-center`}>
        <ProfileIconShield />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--fd-muted)]">
          {t("profile_security_meter_title")}
        </p>
        <div className="mt-2 flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i < segments ? barColor : "bg-[rgba(74,103,79,0.15)]"
              }`}
            />
          ))}
        </div>
        <p className="mt-1.5 text-xs font-semibold text-[#1c1917]">{levelLabel}</p>
        <p className="mt-0.5 text-[11px] text-[var(--fd-muted)]">{cta}</p>
      </div>
      <ProfileIconChevronRight />
    </Link>
  );
}

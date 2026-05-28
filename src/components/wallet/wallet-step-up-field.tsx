"use client";

import { useI18n } from "@/components/i18n-provider";

type Props = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
};

/** 2FA code input when TOTP is enabled on the account. */
export function WalletStepUpField({ value, onChange, id = "wallet-step-up-code" }: Props) {
  const { t } = useI18n();
  return (
    <label className="mt-3 block" htmlFor={id}>
      <span className="text-xs font-bold text-[color:var(--fd-text)]">
        {t("withdraw_2fa_label")}
      </span>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 8))}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder={t("sec_totp_code_ph")}
        className="mt-1.5 w-full rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-2.5 text-center font-mono text-lg tracking-widest outline-none focus:ring-2 focus:ring-[color:var(--fd-primary)]/30"
      />
    </label>
  );
}

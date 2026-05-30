import { hasBinanceWalletKeys } from "@/lib/env";

export function walletCronSecret(): string {
  return (
    process.env.WALLET_CRON_SECRET ??
    process.env.CRON_SECRET ??
    process.env.MCBULELI_CRON_SECRET ??
    ""
  ).trim();
}

export function walletAutomationEnabled(): boolean {
  return String(process.env.WALLET_AUTOMATION_ENABLED ?? "1").trim() !== "0";
}

export function walletDepositAutoEnabled(): boolean {
  return String(process.env.WALLET_AUTO_DEPOSIT_ENABLED ?? "1").trim() !== "0";
}

export function walletWithdrawAutoEnabled(): boolean {
  if (String(process.env.WALLET_AUTO_WITHDRAW_ENABLED ?? "1").trim() === "0") {
    return false;
  }
  if (String(process.env.WALLET_AUTOMATION_ENABLED ?? "1").trim() === "0") {
    return false;
  }
  return hasBinanceWalletKeys();
}

export function walletDepositSessionMinutes(): number {
  const n = Number(process.env.WALLET_DEPOSIT_SESSION_MINUTES ?? "30");
  return Number.isFinite(n) && n >= 5 && n <= 180 ? n : 30;
}

export function walletDepositGraceMinutes(): number {
  const n = Number(process.env.WALLET_DEPOSIT_GRACE_MINUTES ?? "90");
  return Number.isFinite(n) && n >= 15 && n <= 720 ? n : 90;
}

export function walletWithdrawalBatchDelayMinMinutes(): number {
  const n = Number(process.env.WALLET_WITHDRAW_BATCH_MIN_MINUTES ?? "5");
  return Number.isFinite(n) && n >= 1 && n <= 120 ? n : 5;
}

export function walletWithdrawalBatchDelayMaxMinutes(): number {
  const n = Number(process.env.WALLET_WITHDRAW_BATCH_MAX_MINUTES ?? "30");
  return Number.isFinite(n) && n >= 1 && n <= 240 ? n : 30;
}

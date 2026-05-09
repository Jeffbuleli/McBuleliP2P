import { isFiatDepositWithdrawPaused } from "@/lib/fiat-deposit-withdraw-paused";
import WalletFiatWithdrawClient from "./wallet-fiat-withdraw-client";

export default function WalletFiatWithdrawPage() {
  return (
    <WalletFiatWithdrawClient fiatPaused={isFiatDepositWithdrawPaused()} />
  );
}

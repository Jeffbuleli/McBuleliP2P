import type { Messages } from "@/i18n/messages";
import { REWARD_GRANT } from "@/lib/reward-points-config";

type TFn = (
  k: keyof Messages,
  vars?: Record<string, string | number>,
) => string;

export function rewardLedgerLabel(
  t: TFn,
  row: { grantType: string | null; note: string | null },
): string {
  if (row.grantType === REWARD_GRANT.KYC_APPROVED) {
    return t("points_ledger_kyc_approved");
  }
  if (row.grantType === REWARD_GRANT.EMAIL_VERIFIED) {
    return t("points_ledger_email_verified");
  }
  if (row.grantType === REWARD_GRANT.BOT_FIRST_SUBSCRIPTION) {
    return t("points_ledger_bot_first");
  }
  if (row.grantType === REWARD_GRANT.STAKING_OPENED) {
    return t("points_ledger_staking_opened");
  }
  if (row.grantType === REWARD_GRANT.STAKING_MATURED) {
    return t("points_ledger_staking_matured");
  }
  if (row.grantType === REWARD_GRANT.P2P_TRADE_COMPLETED) {
    return t("points_ledger_p2p_trade");
  }
  if (row.grantType === REWARD_GRANT.TRAINING_ENROLLED) {
    return t("points_ledger_training_enrolled");
  }
  if (row.grantType === REWARD_GRANT.TRAINING_SESSION_ATTENDED) {
    return t("points_ledger_training_session");
  }
  if (row.grantType === REWARD_GRANT.TRAINING_QUIZ_PASSED) {
    return t("points_ledger_training_quiz");
  }
  if (row.note === "spend:p2p_fee_discount_15") {
    return t("points_ledger_spend_p2p_fee");
  }
  if (row.note === "spend:bot_renewal_discount_10") {
    return t("points_ledger_spend_bot_renewal");
  }
  if (row.note?.startsWith("mcb_claim_refund:")) {
    return t("points_ledger_mcb_refund");
  }
  if (row.note?.startsWith("mcb_claim:")) {
    return t("points_ledger_mcb_claim");
  }
  if (row.note?.trim()) return row.note.trim();
  return t("points_ledger_other");
}

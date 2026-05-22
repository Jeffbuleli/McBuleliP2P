import type { Messages } from "@/i18n/messages";

/** Turn system chat / notification preview strings into readable text. */
export function formatGroupMessagePreview(
  t: (k: keyof Messages, vars?: Record<string, string | number>) => string,
  preview: string,
  messageType?: string,
): string {
  const raw = preview?.trim() ?? "";
  if (!raw) return "—";

  if (
    raw.startsWith("PAYOUT_PENDING") ||
    messageType === "payout_pending"
  ) {
    const sep = raw.includes("|") ? "|" : ":";
    const p = raw.startsWith("PAYOUT_PENDING") ? raw.split(sep) : [];
    const amount = p[2] ?? "";
    const beneficiary = p[3] ?? "";
    const count = p[6] ?? "0";
    const required = p[5] ?? "2";
    if (amount && beneficiary) {
      return t("notif_avec_payout_pending", {
        amount,
        name: beneficiary,
        count,
        required,
      });
    }
  }

  if (raw.startsWith("PAYOUT_EXECUTED|") || messageType === "payout_decision") {
    const p = raw.startsWith("PAYOUT_EXECUTED|") ? raw.split("|") : [];
    const amount = p[1] ?? "";
    const beneficiary = p[2] ?? "";
    if (amount && beneficiary) {
      return t("notif_avec_payout_executed", { amount, name: beneficiary });
    }
  }

  if (raw.startsWith("LOAN_DISBURSED|") || messageType === "loan_decision") {
    const p = raw.startsWith("LOAN_DISBURSED|") ? raw.split("|") : [];
    const amount = p[1] ?? "";
    const borrower = p[2] ?? "";
    if (amount && borrower) {
      return t("notif_avec_loan_disbursed", { amount, name: borrower });
    }
  }

  if (raw.startsWith("CYCLE_CLOSED|") || messageType === "closure_decision") {
    const p = raw.startsWith("CYCLE_CLOSED|") ? raw.split("|") : [];
    const cycle = p[1] ?? "";
    const amount = p[2] ?? "";
    if (cycle && amount) {
      return t("notif_avec_cycle_closed", { cycle, amount });
    }
  }

  if (raw.startsWith("PAYOUT_REJECTED|")) {
    const [, amount, beneficiary, reason] = raw.split("|");
    return t("notif_avec_payout_rejected", {
      amount: amount ?? "",
      name: beneficiary ?? "",
      reason: reason ?? "—",
    });
  }

  if (raw.startsWith("LOAN_REJECTED|")) {
    const [, amount, borrower, reason] = raw.split("|");
    return t("notif_avec_loan_rejected", {
      amount: amount ?? "",
      name: borrower ?? "",
      reason: reason ?? "—",
    });
  }

  if (raw.startsWith("LOAN_REQUESTED|")) {
    const [, amount, borrower] = raw.split("|");
    return t("notif_avec_loan_requested", {
      amount: amount ?? "",
      name: borrower ?? "",
    });
  }

  return raw.length > 120 ? `${raw.slice(0, 117)}…` : raw;
}

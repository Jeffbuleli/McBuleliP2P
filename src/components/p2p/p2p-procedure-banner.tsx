"use client";

import { useI18n } from "@/components/i18n-provider";
import {
  P2pIllusBuy,
  P2pIllusDispute,
  P2pIllusEscrow,
  P2pIllusPayFiat,
  P2pIllusSell,
  P2pIllusVerify,
} from "@/components/p2p/p2p-illustrations";

type ProcedureCtx = {
  status: string;
  youArePayer: boolean;
  youAreSeller: boolean;
  youAreBuyer: boolean;
  cryptoQuote?: boolean;
};

function bannerClass(variant: "buy" | "sell" | "info" | "warn"): string {
  return `p2p-procedure-banner p2p-procedure-banner--${variant}`;
}

/** Contextual “what to do now” banner for each order phase. */
export function P2pProcedureBanner({ ctx }: { ctx: ProcedureCtx }) {
  const { t } = useI18n();
  if (ctx.cryptoQuote) return null;

  let variant: "buy" | "sell" | "info" | "warn" = "info";
  let Illus = P2pIllusEscrow;
  let title = "";
  let sub = "";

  switch (ctx.status) {
    case "awaiting_payment":
      if (ctx.youArePayer) {
        variant = "buy";
        Illus = P2pIllusPayFiat;
        title = t("p2p_proc_pay_title");
        sub = t("p2p_proc_pay_sub");
      } else {
        variant = "info";
        Illus = P2pIllusEscrow;
        title = t("p2p_proc_wait_pay_title");
        sub = t("p2p_proc_wait_pay_sub");
      }
      break;
    case "paid":
      if (ctx.youAreSeller) {
        variant = "warn";
        Illus = P2pIllusVerify;
        title = t("p2p_proc_verify_title");
        sub = t("p2p_proc_verify_sub");
      } else if (ctx.youAreBuyer) {
        variant = "buy";
        Illus = P2pIllusBuy;
        title = t("p2p_proc_wait_release_title");
        sub = t("p2p_proc_wait_release_sub");
      }
      break;
    case "disputed":
      variant = "warn";
      Illus = P2pIllusDispute;
      title = t("p2p_proc_dispute_title");
      sub = t("p2p_proc_dispute_sub");
      break;
    case "released":
      variant = "buy";
      Illus = P2pIllusBuy;
      title = t("p2p_proc_done_title");
      sub = t("p2p_proc_done_sub");
      break;
    case "cancelled":
    case "expired":
    case "refunded":
      variant = "sell";
      Illus = P2pIllusSell;
      title = t("p2p_proc_closed_title");
      sub = t("p2p_proc_closed_sub");
      break;
    default:
      return null;
  }

  if (!title) return null;

  return (
    <div className={bannerClass(variant)}>
      <div className="p2p-procedure-banner__illus">
        <Illus className="h-8 w-8" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-[color:var(--fd-text)]">{title}</p>
        <p className="mt-0.5 text-[10px] leading-snug text-[color:var(--fd-muted)]">{sub}</p>
      </div>
    </div>
  );
}

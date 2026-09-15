import { and, eq, sql } from "drizzle-orm";
import {
  getDb,
  groupAvecLoans,
  groupSavingsGroups,
  groupSavingsMemberships,
  groupWalletLedgerEntries,
} from "@/db";
import { getMyMembershipOrNull } from "@/lib/group-savings-permissions";
import { numFromNumeric } from "@/lib/wallet-types";
import { computeLoanCharges } from "@/lib/avec/loan-terms";
import {
  assistantOpenAiEnabled,
  completeChatJson,
} from "@/lib/assistant/openai-client";

export type FinancialInsight = {
  id: string;
  textEn: string;
  textFr: string;
  source: string;
  confidence: "high" | "medium" | "low";
};

export type GroupFinancialSnapshot = {
  groupId: string;
  groupName: string;
  memberCount: number;
  totalSavingsUsdt: number;
  activeLoans: number;
  outstandingLoansUsdt: number;
  repaidLoans: number;
  overdueLoans: number;
  contributionCount: number;
  cycleNumber: number;
  recentContributionTrendPct: number | null;
};

async function loadGroupSnapshot(
  groupId: string,
): Promise<GroupFinancialSnapshot | null> {
  const db = getDb();
  const [g] = await db
    .select()
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.id, groupId))
    .limit(1);
  if (!g) return null;

  const [memberRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(groupSavingsMemberships)
    .where(
      and(
        eq(groupSavingsMemberships.groupId, groupId),
        eq(groupSavingsMemberships.status, "approved"),
      ),
    );

  const contrib = await db
    .select({
      amount: groupWalletLedgerEntries.amount,
      createdAt: groupWalletLedgerEntries.createdAt,
    })
    .from(groupWalletLedgerEntries)
    .where(
      and(
        eq(groupWalletLedgerEntries.groupId, groupId),
        eq(groupWalletLedgerEntries.entryType, "group_contribution_in"),
      ),
    );

  let totalSavingsUsdt = 0;
  let recent = 0;
  let older = 0;
  const now = Date.now();
  const day30 = 30 * 86400000;
  const day60 = 60 * 86400000;
  for (const row of contrib) {
    const amt = numFromNumeric(row.amount?.toString());
    totalSavingsUsdt += amt;
    const age = now - row.createdAt.getTime();
    if (age <= day30) recent += amt;
    else if (age <= day60) older += amt;
  }

  let recentContributionTrendPct: number | null = null;
  if (older > 0) {
    recentContributionTrendPct = Math.round(((recent - older) / older) * 100);
  } else if (recent > 0) {
    recentContributionTrendPct = 100;
  }

  const loans = await db
    .select()
    .from(groupAvecLoans)
    .where(eq(groupAvecLoans.groupId, groupId));

  let activeLoans = 0;
  let outstandingLoansUsdt = 0;
  let repaidLoans = 0;
  let overdueLoans = 0;
  for (const loan of loans) {
    if (loan.status === "repaid") repaidLoans += 1;
    if (loan.status === "disbursed") {
      activeLoans += 1;
      outstandingLoansUsdt += numFromNumeric(loan.outstandingUsdt?.toString());
      if (computeLoanCharges(loan).isOverdue) overdueLoans += 1;
    }
  }

  return {
    groupId,
    groupName: g.name,
    memberCount: memberRow?.n ?? 0,
    totalSavingsUsdt: Math.round(totalSavingsUsdt * 100) / 100,
    activeLoans,
    outstandingLoansUsdt: Math.round(outstandingLoansUsdt * 100) / 100,
    repaidLoans,
    overdueLoans,
    contributionCount: contrib.length,
    cycleNumber: g.cycleNumber ?? 1,
    recentContributionTrendPct,
  };
}

/** Deterministic insights from structured aggregates — never invents numbers. */
export function buildDeterministicInsights(
  snap: GroupFinancialSnapshot,
): FinancialInsight[] {
  const insights: FinancialInsight[] = [];

  insights.push({
    id: "treasury",
    textEn: `Group savings total ${snap.totalSavingsUsdt.toFixed(2)} USDT across ${snap.memberCount} members (cycle ${snap.cycleNumber}).`,
    textFr: `Épargne du groupe : ${snap.totalSavingsUsdt.toFixed(2)} USDT pour ${snap.memberCount} membres (cycle ${snap.cycleNumber}).`,
    source: "group_wallet_ledger_entries.group_contribution_in",
    confidence: "high",
  });

  if (snap.activeLoans > 0) {
    insights.push({
      id: "loans_active",
      textEn: `${snap.activeLoans} active loan(s); outstanding principal ${snap.outstandingLoansUsdt.toFixed(2)} USDT.`,
      textFr: `${snap.activeLoans} crédit(s) actif(s) ; capital restant ${snap.outstandingLoansUsdt.toFixed(2)} USDT.`,
      source: "group_avec_loans.status=disbursed",
      confidence: "high",
    });
  } else {
    insights.push({
      id: "loans_none",
      textEn: "No active loans in this group right now.",
      textFr: "Aucun crédit actif dans ce groupe pour le moment.",
      source: "group_avec_loans",
      confidence: "high",
    });
  }

  if (snap.overdueLoans > 0) {
    insights.push({
      id: "overdue",
      textEn: `Watch risk: ${snap.overdueLoans} loan(s) are past the penalty window.`,
      textFr: `Risque à surveiller : ${snap.overdueLoans} crédit(s) en retard (fenêtre de pénalité).`,
      source: "computeLoanCharges.isOverdue",
      confidence: "high",
    });
  } else if (snap.repaidLoans > 0) {
    insights.push({
      id: "repay_ok",
      textEn: `${snap.repaidLoans} loan(s) fully repaid; no overdue loans detected.`,
      textFr: `${snap.repaidLoans} crédit(s) remboursé(s) ; aucun retard détecté.`,
      source: "group_avec_loans + loan-terms",
      confidence: "high",
    });
  }

  if (snap.recentContributionTrendPct != null) {
    const t = snap.recentContributionTrendPct;
    insights.push({
      id: "trend",
      textEn:
        t >= 0
          ? `Savings contributions rose about ${t}% vs the prior 30 days.`
          : `Savings contributions fell about ${Math.abs(t)}% vs the prior 30 days.`,
      textFr:
        t >= 0
          ? `Les contributions d'épargne ont augmenté d'environ ${t} % vs les 30 jours précédents.`
          : `Les contributions d'épargne ont baissé d'environ ${Math.abs(t)} % vs les 30 jours précédents.`,
      source: "ledger contributions last 60 days",
      confidence: snap.contributionCount >= 4 ? "medium" : "low",
    });
  }

  return insights;
}

export async function getGroupFinancialInsights(args: {
  groupId: string;
  userId: string;
  locale?: "en" | "fr";
}): Promise<
  | {
      ok: true;
      snapshot: GroupFinancialSnapshot;
      insights: FinancialInsight[];
      mode: "deterministic" | "llm_enriched";
    }
  | { ok: false; message: string }
> {
  const m = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.userId,
  });
  if (!m || m.status !== "approved") {
    return { ok: false, message: "group_forbidden" };
  }

  const snapshot = await loadGroupSnapshot(args.groupId);
  if (!snapshot) return { ok: false, message: "group_not_found" };

  let insights = buildDeterministicInsights(snapshot);
  let mode: "deterministic" | "llm_enriched" = "deterministic";

  if (assistantOpenAiEnabled()) {
    try {
      const raw = await completeChatJson({
        systemPrompt: `You are eAVEC Financial AI. You ONLY rephrase provided JSON facts into short committee insights.
Never invent numbers or names. Return JSON: {"extras":[{"id":"string","textEn":"...","textFr":"...","confidence":"high|medium|low"}]}
Max 2 extras. No PII. No credit approval language.`,
        userMessage: JSON.stringify({
          snapshot: {
            memberCount: snapshot.memberCount,
            totalSavingsUsdt: snapshot.totalSavingsUsdt,
            activeLoans: snapshot.activeLoans,
            outstandingLoansUsdt: snapshot.outstandingLoansUsdt,
            overdueLoans: snapshot.overdueLoans,
            repaidLoans: snapshot.repaidLoans,
            recentContributionTrendPct: snapshot.recentContributionTrendPct,
            cycleNumber: snapshot.cycleNumber,
          },
        }),
        maxTokens: 400,
        temperature: 0.2,
      });
      const parsed = JSON.parse(raw) as {
        extras?: Array<{
          id?: string;
          textEn?: string;
          textFr?: string;
          confidence?: "high" | "medium" | "low";
        }>;
      };
      const extras = (parsed.extras ?? []).slice(0, 2).map((e, i) => ({
        id: `llm_${e.id ?? i}`,
        textEn: String(e.textEn ?? "").slice(0, 280),
        textFr: String(e.textFr ?? e.textEn ?? "").slice(0, 280),
        source: "openai_rephrase_of_snapshot",
        confidence: (e.confidence ?? "low") as FinancialInsight["confidence"],
      })).filter((e) => e.textEn.length > 8);
      if (extras.length > 0) {
        insights = [...insights, ...extras];
        mode = "llm_enriched";
      }
    } catch {
      /* keep deterministic */
    }
  }

  return { ok: true, snapshot, insights, mode };
}

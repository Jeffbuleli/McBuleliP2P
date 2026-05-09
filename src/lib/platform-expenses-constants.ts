export const PLATFORM_EXPENSE_STATUSES = [
  "draft",
  "submitted",
  "approved",
  "rejected",
  "paid",
] as const;
export type PlatformExpenseStatus = (typeof PLATFORM_EXPENSE_STATUSES)[number];

export const PLATFORM_EXPENSE_CATEGORIES = [
  "servers",
  "payroll_agents",
  "equipment",
  "software",
  "marketing",
  "compliance",
  "other",
] as const;
export type PlatformExpenseCategory = (typeof PLATFORM_EXPENSE_CATEGORIES)[number];

export function isPlatformExpenseCategory(s: string): s is PlatformExpenseCategory {
  return (PLATFORM_EXPENSE_CATEGORIES as readonly string[]).includes(s);
}

export function daysUntil(dateIso: string, now = new Date()): number {
  const d = new Date(dateIso);
  const ms = d.getTime() - now.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export function isReminderDay(daysUntilBilling: number): boolean {
  return daysUntilBilling === 3 || daysUntilBilling === 1;
}


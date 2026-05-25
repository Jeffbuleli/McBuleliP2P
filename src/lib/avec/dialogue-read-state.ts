const PREFIX = "avec-dialogue-read-";

export function getDialogueReadAt(groupId: string): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(`${PREFIX}${groupId}`);
  if (!raw) return 0;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : 0;
}

export function markDialogueRead(groupId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${PREFIX}${groupId}`, new Date().toISOString());
}

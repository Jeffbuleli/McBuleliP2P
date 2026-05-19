/** Split stored payment snapshot into display lines (`Label: detail`). */
export function parsePaymentSnapshotLines(snapshot: string): string[] {
  return snapshot
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function paymentSnapshotLineLabel(line: string): string {
  const i = line.indexOf(":");
  if (i <= 0) return line;
  return line.slice(0, i).trim();
}

export function paymentSnapshotLineDetail(line: string): string {
  const i = line.indexOf(":");
  if (i <= 0) return "";
  return line.slice(i + 1).trim();
}

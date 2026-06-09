export function formatRelativeTime(iso: string, fr: boolean): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.max(0, Math.floor(diff / 1000));
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (sec < 45) return fr ? "à l'instant" : "now";
  if (min < 60) return fr ? `${min} min` : `${min}m`;
  if (hr < 24) return fr ? `${hr} h` : `${hr}h`;
  if (day < 7) return fr ? `${day} j` : `${day}d`;
  return new Date(iso).toLocaleDateString(fr ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
  });
}

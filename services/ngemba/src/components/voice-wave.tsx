export function VoiceWave({
  levels,
  className = "",
}: {
  levels: number[];
  className?: string;
}) {
  return (
    <div
      className={`flex h-11 min-w-0 flex-1 items-center gap-[3px] overflow-hidden rounded-2xl px-3 ${className}`}
      aria-hidden
    >
      {levels.map((level, index) => (
        <span
          key={index}
          className="w-[3px] shrink-0 rounded-full bg-current"
          style={{ height: `${Math.max(16, Math.min(100, level))}%` }}
        />
      ))}
    </div>
  );
}

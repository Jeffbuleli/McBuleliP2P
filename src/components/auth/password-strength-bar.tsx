"use client";

function scorePassword(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  return Math.min(4, score);
}

const SEGMENT_COLORS = ["#E5E7EB", "#FCA5A5", "#FCD34D", "#86EFAC", "#305F33"] as const;

export function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null;

  const score = scorePassword(password);
  const activeColor = SEGMENT_COLORS[score];

  return (
    <div className="flex flex-col gap-1.5" aria-hidden>
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <svg key={i} className="h-1.5 flex-1" viewBox="0 0 40 6" preserveAspectRatio="none">
            <rect
              width="40"
              height="6"
              rx="3"
              fill={i < score ? activeColor : SEGMENT_COLORS[0]}
            />
          </svg>
        ))}
      </div>
    </div>
  );
}

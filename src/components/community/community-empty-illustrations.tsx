import type { ReactNode } from "react";

type Props = { className?: string };

const stroke = "#305f33";
const muted = "#a8a29e";

export function EmptyNewsIllustration({ className = "h-24 w-24" }: Props) {
  return (
    <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden>
      <rect x="16" y="20" width="64" height="48" rx="8" stroke={muted} strokeWidth="2" />
      <path d="M28 36h40M28 48h28M28 56h36" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <circle cx="72" cy="28" r="10" fill="#e8f3ee" stroke={stroke} strokeWidth="1.5" />
      <path d="M68 28h8M72 24v8" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyDiscussionIllustration({ className = "h-24 w-24" }: Props) {
  return (
    <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden>
      <path
        d="M20 24h48a6 6 0 016 6v22a6 6 0 01-6 6H40l-12 10V30a6 6 0 016-6z"
        stroke={muted}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M32 40h32M32 50h20" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.45" />
      <circle cx="68" cy="58" r="12" fill="#e8f3ee" stroke={stroke} strokeWidth="1.5" />
      <path d="M64 58c0-2.2 1.8-4 4-4" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyTrainingIllustration({ className = "h-24 w-24" }: Props) {
  return (
    <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden>
      <rect x="14" y="26" width="52" height="36" rx="6" stroke={muted} strokeWidth="2" />
      <path d="M66 38l16-8v32l-16-8V38z" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="40" cy="44" r="8" fill="#e8f3ee" stroke={stroke} strokeWidth="1.5" />
      <path d="M36 56h24" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export function EmptyBlogIllustration({ className = "h-24 w-24" }: Props) {
  return (
    <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden>
      <rect x="24" y="14" width="48" height="68" rx="6" stroke={muted} strokeWidth="2" />
      <path d="M34 30h28M34 42h28M34 54h18" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

export function EmptyQuestionIllustration({ className = "h-24 w-24" }: Props) {
  return (
    <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden>
      <circle cx="48" cy="48" r="30" stroke={muted} strokeWidth="2" />
      <path
        d="M48 34c-6 0-10 4-10 9 0 4 3 6 6 7v3"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="48" cy="66" r="2.5" fill={stroke} />
    </svg>
  );
}

export function EmptyCommentIllustration({ className = "h-20 w-20" }: Props) {
  return (
    <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden>
      <path
        d="M22 28h44a5 5 0 015 5v18a5 5 0 01-5 5H38l-10 8V33a5 5 0 015-5z"
        stroke={muted}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M32 40h24M32 48h14" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export function EmptySignalIllustration({ className = "h-24 w-24" }: Props) {
  return (
    <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden>
      <path d="M12 68L32 36l16 16 20-40 16 56" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
      <line x1="12" y1="72" x2="84" y2="72" stroke={muted} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CommunityEmptyState({
  illustration,
  title,
  body,
  action,
}: {
  illustration: ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="fd-card flex flex-col items-center px-6 py-10 text-center">
      {illustration}
      <p className="mt-4 text-sm font-bold text-[#0c0a09]">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-[#78716c]">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

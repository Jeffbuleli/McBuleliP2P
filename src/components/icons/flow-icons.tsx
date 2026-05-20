/** Standard SVG icons for wallet flows (no emoji). */

const S = "h-5 w-5 shrink-0";

export function IconClose({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconBell({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3a5 5 0 00-5 5v2.59l-1.3 1.3A1 1 0 006 13h12a1 1 0 00.7-1.71L18 10.59V8a5 5 0 00-5-5zM12 21a2 2 0 01-2-2h4a2 2 0 01-2 2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCopy({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M5 15V5a2 2 0 012-2h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconCheck({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconX({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 10l4 4m0-4l-4 4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconClock({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconArrowDown({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconArrowUp({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconArrowLeft({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconArrowRight({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconSend({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSwap({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconList({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconInbox({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 4h16v16H4zM4 9h4l2 3h4l2-3h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconAlert({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 9v4m0 4h.01M10.3 4.3l-8 14a2 2 0 001.7 3h16a2 2 0 001.7-3l-8-14a2 2 0 00-3.4 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconSpinner({ className = "h-5 w-5 animate-spin" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function NotifKindIcon({ kind, className = "h-5 w-5" }: { kind: string; className?: string }) {
  switch (kind) {
    case "deposit_confirmed":
      return <IconArrowDown className={className} />;
    case "deposit_validation_pending":
      return <IconClock className={className} />;
    case "withdrawal_completed":
      return <IconCheck className={className} />;
    case "withdrawal_rejected":
      return <IconX className={className} />;
    case "withdrawal_claimed":
      return <IconArrowRight className={className} />;
    case "p2p_order_created":
      return <IconInbox className={className} />;
    case "p2p_order_paid":
    case "p2p_order_proof":
      return <IconClock className={className} />;
    case "p2p_order_released":
    case "p2p_order_dispute_released":
    case "p2p_order_dispute_refunded":
      return <IconCheck className={className} />;
    case "p2p_order_cancelled":
    case "p2p_order_expired":
      return <IconX className={className} />;
    case "p2p_order_disputed":
      return <IconAlert className={className} />;
    case "p2p_order_message":
    case "p2p_order_support_message":
    case "support_message":
      return <IconSend className={className} />;
    case "admin_deposit_order":
      return <IconArrowDown className={className} />;
    case "admin_deposit_review":
      return <IconClock className={className} />;
    case "admin_withdrawal_order":
      return <IconArrowUp className={className} />;
    default:
      return <IconArrowUp className={className} />;
  }
}

export function IconP2P({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 8h10M7 12h6M7 16h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M5 6h14v12H5zM9 6V4h6v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HistoryVisualIcon({
  visual,
  className = "h-5 w-5",
}: {
  visual: "receive" | "send" | "withdraw" | "p2p" | "swap" | "other";
  className?: string;
}) {
  switch (visual) {
    case "receive":
      return <IconArrowDown className={className} />;
    case "send":
      return <IconSend className={className} />;
    case "withdraw":
      return <IconArrowUp className={className} />;
    case "p2p":
      return <IconP2P className={className} />;
    case "swap":
      return <IconSwap className={className} />;
    default:
      return <IconList className={className} />;
  }
}

export function HistoryEntryIcon({
  entryType,
  className = "h-5 w-5",
}: {
  entryType: string;
  className?: string;
}) {
  if (entryType.startsWith("p2p_")) return <IconP2P className={className} />;
  if (entryType === "transfer_out") return <IconSend className={className} />;
  if (entryType === "transfer_in") return <IconArrowDown className={className} />;
  if (entryType.includes("swap")) return <IconSwap className={className} />;
  if (entryType.includes("deposit") || entryType.endsWith("_in")) {
    return <IconArrowDown className={className} />;
  }
  if (entryType.includes("withdraw") || entryType.endsWith("_out")) {
    return <IconArrowUp className={className} />;
  }
  return <IconList className={className} />;
}

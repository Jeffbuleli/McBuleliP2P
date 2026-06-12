import type { LifestyleStage } from "@/lib/game/progression";
import { IconAlert, IconCheck, IconClose } from "@/components/icons/flow-icons";

const S = "h-8 w-8 shrink-0";

export function IconGamePickaxe({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 4l6 6-3 3-2-2-5 5 2 2-3 3-6-6 3-3 2 2 5-5-2-2 3-3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M3 21l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconGameHelmet({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 14a8 8 0 0116 0v3H4v-3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 6V4M8 8l-1-2M16 8l1-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconGameMotorcycle({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="6" cy="17" r="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="17" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M9 17h6M6 17l2-5h5l2 3h3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconGameFactory({ className = S }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 21V9l5 3V9l5 3V5l8 4v12H3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 13v2M13 11v2M17 15v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function GameStageIcon({
  stage,
  className = S,
}: {
  stage: LifestyleStage | string;
  className?: string;
}) {
  switch (stage) {
    case "rising":
      return <IconGameHelmet className={className} />;
    case "operator":
      return <IconGameMotorcycle className={className} />;
    case "mogul":
      return <IconGameFactory className={className} />;
    default:
      return <IconGamePickaxe className={className} />;
  }
}

export function IconGameCheckSm({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return <IconCheck className={className} />;
}

export function IconGameWarningSm({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return <IconAlert className={className} />;
}

export function IconGameCloseSm({ className = "h-4 w-4" }: { className?: string }) {
  return <IconClose className={className} />;
}

export function IconGameMapPin({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function IconGameTruck({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7v-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="7" cy="17" r="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17" cy="17" r="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

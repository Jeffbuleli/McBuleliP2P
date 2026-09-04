import type { ReactElement, ReactNode, SVGProps } from "react";
import type { YouthScenarioId } from "@/lib/youth/scenarios";

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function Base({
  title,
  className = "size-6",
  children,
  ...rest
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden={title ? undefined : true}
      className={className}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function IconYouthConsent(props: IconProps) {
  return (
    <Base {...props}>
      <path
        d="M8 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M4.5 19c.6-2.4 2.6-4 5.5-4 .9 0 1.7.2 2.4.5M19.5 19c-.6-2.4-2.6-4-5.5-4-.7 0-1.4.1-2 .3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M12 13.5v4M10.2 15.5h3.6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Base>
  );
}

export function IconYouthCyber(props: IconProps) {
  return (
    <Base {...props}>
      <rect
        x="7"
        y="3.5"
        width="10"
        height="17"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M10 17.5h4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M9.5 8.5h5M9.5 11.5h3.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="17.5" cy="7.5" r="2.2" fill="currentColor" />
    </Base>
  );
}

export function IconYouthCorruption(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="7.25" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 8.2v7.6M9.8 10.2c.5-1 1.5-1.6 2.2-1.6 1.4 0 2.2.8 2.2 1.8s-.9 1.7-2.4 2.1c-1.4.4-2.3 1-2.3 2.1 0 1.1 1 1.9 2.5 1.9.9 0 1.8-.4 2.3-1.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Base>
  );
}

export function IconYouthBullying(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M4.5 18.5c.5-2.2 2.3-3.5 4.5-3.5s4 1.3 4.5 3.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M15.5 7.5 19 5.5M15.5 10.5 19 12.5M15.5 9h4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Base>
  );
}

export function IconYouthViolence(props: IconProps) {
  return (
    <Base {...props}>
      <path
        d="M7 8.5 4.5 12 7 15.5M17 8.5 19.5 12 17 15.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12h5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M12 5.5v2M12 16.5v2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Base>
  );
}

export function IconYouthDiscrimination(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="8" cy="8.5" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="16" cy="8.5" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M4.5 18c.4-2 2-3.2 3.5-3.2M19.5 18c-.4-2-2-3.2-3.5-3.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M10.5 12.5h3M12 11v5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Base>
  );
}

export function IconYouthSextortion(props: IconProps) {
  return (
    <Base {...props}>
      <rect
        x="5"
        y="8"
        width="14"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M9 8V6.5a3 3 0 0 1 6 0V8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="12" cy="13.5" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 15.2v1.6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Base>
  );
}

export function IconYouthPeerPressure(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="7.5" r="2.4" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="6.5" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="17.5" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M8.5 17.5c.6-1.8 2-2.8 3.5-2.8s2.9 1 3.5 2.8M4.8 16.8c.4-1.3 1.4-2.1 2.5-2.1M19.2 16.8c-.4-1.3-1.4-2.1-2.5-2.1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Base>
  );
}

export function IconYouthAbuse(props: IconProps) {
  return (
    <Base {...props}>
      <path
        d="M12 3.5 5.5 6.5v4.8c0 3.8 2.6 7.1 6.5 8.4 3.9-1.3 6.5-4.6 6.5-8.4V6.5L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M12 9v3.5M12 15.2v.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Base>
  );
}

export function IconYouthFriendSos(props: IconProps) {
  return (
    <Base {...props}>
      <path
        d="M8 14.5c0-2.2 1.8-3.5 4-3.5s4 1.3 4 3.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="12" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5 12.5c1.2-1.2 2.6-1.5 3.6-.9M19 12.5c-1.2-1.2-2.6-1.5-3.6-.9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M7.5 18.5h9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Base>
  );
}

export const YOUTH_SCENARIO_ICONS: Record<
  YouthScenarioId,
  (props: IconProps) => ReactElement
> = {
  consent: IconYouthConsent,
  cyberbullying: IconYouthCyber,
  corruption: IconYouthCorruption,
  bullying: IconYouthBullying,
  violence: IconYouthViolence,
  discrimination: IconYouthDiscrimination,
  sextortion: IconYouthSextortion,
  peer_pressure: IconYouthPeerPressure,
  abuse: IconYouthAbuse,
  friend_sos: IconYouthFriendSos,
};

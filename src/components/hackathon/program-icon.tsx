import type { ReactNode } from "react";
import type { ProgramIconId } from "@/lib/hackathon/event-content";

const PATHS: Record<ProgramIconId, ReactNode> = {
  welcome: (
    <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" fill="none" />
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </>
  ),
  partners: (
    <>
      <circle cx="8" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <circle cx="16" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <path d="M4.5 18c.8-2.2 2.6-3.5 3.5-3.5S11.7 15.8 12 18M12 18c.3-2.2 2.2-3.5 3.5-3.5S17.2 15.8 18 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </>
  ),
  coffee: (
    <>
      <path d="M6 8h10v6a4 4 0 0 1-4 4H8a2 2 0 0 1-2-2V8Z" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <path d="M16 10h1.5a2 2 0 0 1 0 4H16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M8 4v2M12 4v2M16 4v2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </>
  ),
  brain: (
    <path d="M12 4c-2 0-3.5 1.5-3.5 3.2 0 .8.3 1.5.8 2.1-1 .3-1.8 1.2-1.8 2.4 0 1.4 1.1 2.5 2.5 2.5.3 0 .6 0 .9-.1.5 1.2 1.7 2 3.1 2s2.6-.8 3.1-2c.3.1.6.1.9.1 1.4 0 2.5-1.1 2.5-2.5 0-1.2-.8-2.1-1.8-2.4.5-.6.8-1.3.8-2.1C15.5 5.5 14 4 12 4Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" fill="none" />
  ),
  code: (
    <>
      <path d="m8 9-3 3 3 3M16 9l3 3-3 3M13 7l-2 10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <path d="M9.5 9.2a2.5 2.5 0 0 1 4.3 1.7c0 1.6-2.8 1.6-2.8 3.1M12 16.5h.01" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </>
  ),
  team: (
    <>
      <circle cx="9" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <circle cx="16" cy="10" r="2" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <path d="M4.5 18c.6-2 2-3 4.5-3s3.9 1 4.5 3M14 18c.4-1.4 1.5-2.5 3.5-2.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </>
  ),
  build: (
    <>
      <path d="M14 4 20 10l-8 8-4-4L14 4Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" fill="none" />
      <path d="M6 20h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <path d="M12 8v4l2.5 2.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </>
  ),
  presentation: (
    <>
      <rect x="4" y="5" width="16" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <path d="M8 19h8M12 15v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </>
  ),
  jury: (
    <>
      <path d="M12 3 14.5 8.5 20.5 9.2 16 13l1 6-5-2.8L7 19l1-6-4.5-3.8 6-.7L12 3Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" fill="none" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="5" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <path d="M8.5 14 7 21l5-2.5L17 21l-1.5-7" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" fill="none" />
    </>
  ),
  network: (
    <>
      <circle cx="6" cy="12" r="2" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <circle cx="18" cy="6" r="2" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <path d="M8 11.2 16 7M8 12.8 16 17" stroke="currentColor" strokeWidth="1.75" />
    </>
  ),
  media: (
    <>
      <rect x="4" y="6" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <path d="M16 10.5 20 8v8l-4-2.5V10.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" fill="none" />
    </>
  ),
};

export function ProgramIcon({ id }: { id: ProgramIconId }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      {PATHS[id]}
    </svg>
  );
}

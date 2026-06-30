/** Curved bidirectional swap arrows — uses currentColor for pill harmony. */
export function IconSwapBrand({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 9.5c0-1.4 1.2-2.5 2.7-2.5h8.1c1.2 0 2.2.8 2.5 2l.7 2.5H20l-3-2.3 3-2.3h-1.1l-.7 2.5c-.3 1-.9 1.6-1.8 1.6H7.7c-.7 0-1.2-.6-1.2-1.3V9.5z"
        fill="currentColor"
      />
      <path
        d="M19 14.5c0 1.4-1.2 2.5-2.7 2.5H8.2c-1.2 0-2.2-.8-2.5-2l-.7-2.5H4l3 2.3-3 2.3h1.1l.7-2.5c.3-1 .9-1.6 1.8-1.6h8.1c.7 0 1.2.6 1.2 1.3v.1z"
        fill="currentColor"
      />
    </svg>
  );
}

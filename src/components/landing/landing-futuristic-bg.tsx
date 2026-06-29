/** Shared HUD background for landing + about futuristic theme. */
export function LandingFuturisticBg() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.035)_1px,transparent_1px)] bg-size-[40px_40px]" />
      <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-[100px]" />
      <div className="absolute -right-20 top-1/4 h-80 w-80 rounded-full bg-fuchsia-600/10 blur-[90px]" />
      <div className="absolute bottom-0 left-1/4 h-64 w-[80%] rounded-full bg-emerald-500/8 blur-[110px]" />
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-400/40 to-transparent" />
    </div>
  );
}

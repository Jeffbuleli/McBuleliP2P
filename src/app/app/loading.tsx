export default function AppLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/10 ring-1 ring-emerald-900/10 dark:bg-stone-900 dark:ring-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo.png" alt="" className="h-12 w-12" />
      </div>
      <p className="text-sm font-medium text-stone-500 dark:text-stone-400">
        McBuleli
      </p>
    </div>
  );
}

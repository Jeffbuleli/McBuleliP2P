/** Lightweight root loading (avoid heavy splash on every navigation). */
export default function RootLoading() {
  return (
    <div
      className="flex min-h-[30vh] items-center justify-center"
      role="status"
      aria-busy="true"
    >
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-[#305F33]" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

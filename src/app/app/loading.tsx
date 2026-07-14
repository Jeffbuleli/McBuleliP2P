/** Ultra-light route fallback — no images, no client JS. */
export default function AppLoading() {
  return (
    <div
      className="flex min-h-[40vh] items-center justify-center"
      role="status"
      aria-busy="true"
    >
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#305F33]/25 border-t-[#305F33]" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

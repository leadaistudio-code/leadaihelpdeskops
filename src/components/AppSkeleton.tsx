// Dark-themed loading skeleton shown while a route's server data resolves.
// Matches the app's glass-panel / aurora aesthetic so navigation never blanks.
export default function AppSkeleton() {
  return (
    <div className="p-8 space-y-8 animate-pulse">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <div className="h-7 w-64 rounded-lg bg-white/10" />
          <div className="h-4 w-40 rounded bg-white/5" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-white/10" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-panel rounded-3xl border border-white/10 p-6 space-y-4">
            <div className="h-3 w-24 rounded bg-white/10" />
            <div className="h-10 w-28 rounded-lg bg-white/10" />
            <div className="h-3 w-32 rounded bg-white/5" />
          </div>
        ))}
      </div>

      {/* Table / list block */}
      <div className="glass-panel rounded-3xl border border-white/10 p-6 space-y-4">
        <div className="h-4 w-48 rounded bg-white/10" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-white/10 shrink-0" />
            <div className="h-4 flex-1 rounded bg-white/5" />
            <div className="h-4 w-24 rounded bg-white/5" />
            <div className="h-6 w-16 rounded-full bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

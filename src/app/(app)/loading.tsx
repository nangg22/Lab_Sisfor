export default function AppLoading() {
  return (
    <div className="space-y-5 animate-pulse" aria-busy="true" aria-label="Memuat halaman…">
      {/* Hero skeleton */}
      <div className="neo-card-flat h-28 bg-slate-100 rounded-[14px]" />
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="neo-card-flat h-24 bg-slate-100 rounded-[14px]" />
        ))}
      </div>
      {/* Table */}
      <div className="neo-card-flat h-64 bg-slate-100 rounded-[14px]" />
    </div>
  )
}

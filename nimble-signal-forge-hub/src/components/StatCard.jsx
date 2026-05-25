export default function StatCard({ label, value, hint, accent }) {
  return (
    <div className="border border-[#1A1814]/10 rounded-lg p-6 bg-white/40 hover:bg-white/70 transition-colors">
      <div className="text-[10px] uppercase tracking-[0.22em] text-[#1A1814]/50">{label}</div>
      <div className="font-serif text-4xl mt-3 leading-none tracking-tight" style={accent ? { color: accent } : {}}>{value}</div>
      {hint && <div className="text-xs text-[#1A1814]/55 mt-3">{hint}</div>}
    </div>
  );
}
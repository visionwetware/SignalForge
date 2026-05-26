import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export default function StatCard({ label, value, hint, accent, to }) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10px] uppercase tracking-[0.22em] text-[#1A1814]/50">{label}</div>
        {to && <ArrowUpRight className="w-3.5 h-3.5 text-[#1A1814]/30 group-hover:text-[#1A1814] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />}
      </div>
      <div className="font-serif text-4xl mt-3 leading-none tracking-tight" style={accent ? { color: accent } : {}}>{value}</div>
      {hint && <div className="text-xs text-[#1A1814]/55 mt-3">{hint}</div>}
    </>
  );

  const className = "group block text-left w-full border border-[#1A1814]/10 rounded-lg p-6 bg-white/40 hover:bg-white hover:border-[#1A1814]/30 transition-all";

  if (to) {
    return <Link to={to} className={className}>{content}</Link>;
  }
  return <div className={className}>{content}</div>;
}
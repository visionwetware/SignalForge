import { ArrowUpRight, ArrowDownRight, Minus, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const DIR = {
  up: { Icon: ArrowUpRight, color: "#3F6B3F" },
  down: { Icon: ArrowDownRight, color: "#A14545" },
  flat: { Icon: Minus, color: "#1A1814" },
};

export default function TopicCard({ topic }) {
  const dir = DIR[topic.trend_direction] || DIR.flat;
  const Icon = dir.Icon;

  return (
    <Link
      to={`/topics?focus=${topic.id}`}
      className="group block border border-[#1A1814]/10 rounded-lg p-5 bg-white/40 hover:bg-white hover:border-[#1A1814]/30 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1814]/50">{topic.category}</div>
          <div className="font-serif text-xl mt-1.5 truncate">{topic.name}</div>
        </div>
        {topic.anomaly_flag && (
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-[#B8860B] bg-[#B8860B]/10 px-2 py-1 rounded">
            <AlertTriangle className="w-3 h-3" /> Anomaly
          </div>
        )}
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1814]/50">Signal</div>
          <div className="font-serif text-2xl">{Math.round(topic.current_value)}</div>
        </div>
        <div className="flex items-center gap-1 text-sm" style={{ color: dir.color }}>
          <Icon className="w-4 h-4" />
          <span className="font-medium">{topic.momentum > 0 ? "+" : ""}{topic.momentum?.toFixed(1)}</span>
        </div>
      </div>
    </Link>
  );
}
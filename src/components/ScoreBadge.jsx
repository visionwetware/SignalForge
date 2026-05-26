// SkyScan-inspired score visualization
const VERDICT_STYLES = {
  authentic: { color: "#3F6B3F", label: "Authentic" },
  suspicious: { color: "#B8860B", label: "Suspicious" },
  manipulated: { color: "#A14545", label: "Manipulated" },
  inconclusive: { color: "#1A1814", label: "Inconclusive" },
};

export default function ScoreBadge({ score, verdict, size = "md" }) {
  const v = VERDICT_STYLES[verdict] || VERDICT_STYLES.inconclusive;
  const radius = size === "lg" ? 64 : size === "sm" ? 24 : 40;
  const stroke = size === "lg" ? 6 : size === "sm" ? 3 : 4;
  const c = 2 * Math.PI * radius;
  const offset = c - (score / 100) * c;
  const wh = (radius + stroke) * 2;
  const fontSize = size === "lg" ? "text-3xl" : size === "sm" ? "text-[10px]" : "text-lg";

  return (
    <div className="flex items-center gap-3">
      <div className="relative" style={{ width: wh, height: wh }}>
        <svg width={wh} height={wh} className="-rotate-90">
          <circle cx={wh / 2} cy={wh / 2} r={radius} stroke="#1A1814" strokeOpacity="0.08" strokeWidth={stroke} fill="none" />
          <circle
            cx={wh / 2} cy={wh / 2} r={radius}
            stroke={v.color} strokeWidth={stroke} fill="none"
            strokeDasharray={c} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 800ms cubic-bezier(0.16,1,0.3,1)" }}
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center font-serif ${fontSize}`}>{Math.round(score)}</div>
      </div>
      {size !== "sm" && (
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1814]/50">Verdict</div>
          <div className="font-serif text-lg" style={{ color: v.color }}>{v.label}</div>
        </div>
      )}
    </div>
  );
}
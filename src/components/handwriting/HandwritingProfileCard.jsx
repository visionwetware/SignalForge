import { PenTool } from 'lucide-react';

export default function HandwritingProfileCard({ profile, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(profile)}
      className={`w-full text-left border rounded-lg p-4 transition min-w-0 ${selected ? 'border-[#00F5FF]/70 bg-[#00F5FF]/10' : 'border-[#E6F7FF]/10 bg-[#0D1026]/70 hover:border-[#E6F7FF]/25'}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-md bg-[#E6F7FF]/5 flex items-center justify-center shrink-0">
          <PenTool className="w-4 h-4 text-[#00F5FF]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-serif text-lg truncate">{profile.name}</div>
          <p className="text-xs text-[#E6F7FF]/55 mt-1 line-clamp-2">{profile.summary}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {[profile.slant, profile.spacing, profile.stroke_weight].filter(Boolean).map((tag) => (
              <span key={tag} className="text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 rounded bg-[#E6F7FF]/5 text-[#E6F7FF]/60">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}
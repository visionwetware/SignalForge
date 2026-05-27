import { Calendar, Star } from 'lucide-react';
import { format } from 'date-fns';

export default function PokedexCard({ card, onOpen, onFavorite }) {
  const terms = Array.from(new Set((card.keywords || []).map((keyword) => keyword.term))).slice(0, 4);
  const score = Math.round(card.scan?.score || 0);
  const status = card.scan?.status || 'queued';
  const sourceLabel = card.source_type === 'scan' ? 'Scan' : 'Curio';

  return (
    <button onClick={onOpen} className="group text-left rounded-xl border border-[#E6F7FF]/10 bg-white/55 hover:bg-white hover:border-[#E6F7FF]/25 overflow-hidden transition">
      <div className="aspect-[4/3] bg-[#E6F7FF]/5 overflow-hidden relative">
        <img src={card.image.image_url} alt={card.image.title || 'Scanned source'} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        {card.source_type === 'curio' && (
          <button onClick={(e) => { e.stopPropagation(); onFavorite?.(); }} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/85 flex items-center justify-center shadow-sm">
            <Star className={`w-4 h-4 ${card.image.favorite ? 'fill-[#D97706] text-[#D97706]' : 'text-[#E6F7FF]/40'}`} />
          </button>
        )}
        <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-white/85 text-[10px] uppercase tracking-[0.14em] text-[#080A18] shadow-sm">{sourceLabel}</div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="font-serif text-lg leading-tight line-clamp-2">{card.page?.title || card.image.title || 'Source image'}</div>
          <div className="font-serif text-2xl text-[#D97706]">{score}</div>
        </div>
        <div className="mt-2 text-[10px] uppercase tracking-[0.16em] text-[#E6F7FF]/45">{sourceLabel} · {status}</div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {terms.map((term) => <span key={term} className="px-2 py-0.5 rounded bg-[#E6F7FF]/5 text-[10px]">{term}</span>)}
        </div>
        <div className="mt-4 flex items-center gap-1.5 text-xs text-[#E6F7FF]/45"><Calendar className="w-3 h-3" />{format(new Date(card.scan?.scanned_at || card.image.created_date), 'MMM d, yyyy')}</div>
      </div>
    </button>
  );
}
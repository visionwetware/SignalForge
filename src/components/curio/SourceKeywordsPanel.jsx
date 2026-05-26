import { ExternalLink, Tag } from 'lucide-react';

export default function SourceKeywordsPanel({ keywords }) {
  if (!keywords?.length) {
    return <div className="border border-dashed border-[#1A1814]/15 rounded-lg p-6 text-sm text-[#1A1814]/50">No source keywords yet.</div>;
  }

  return (
    <section className="border border-[#1A1814]/10 rounded-lg bg-white/50 p-6">
      <div className="flex items-center gap-2 mb-4"><Tag className="w-4 h-4" /><h2 className="font-serif text-xl">Source Keywords</h2></div>
      <div className="flex flex-wrap gap-2">
        {keywords.slice(0, 40).map((keyword) => (
          <a key={keyword.id} href={keyword.image_url || keyword.source_url || '#'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1A1814]/5 hover:bg-[#1A1814]/10 text-xs">
            {keyword.term}<ExternalLink className="w-3 h-3 opacity-50" />
          </a>
        ))}
      </div>
    </section>
  );
}
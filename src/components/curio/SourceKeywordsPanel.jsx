import { ExternalLink, Tag } from 'lucide-react';

export default function SourceKeywordsPanel({ keywords }) {
  if (!keywords?.length) {
    return <div className="border border-dashed border-[#E6F7FF]/15 rounded-lg p-6 text-sm text-[#E6F7FF]/50">No source keywords yet.</div>;
  }

  return (
    <section className="w-full min-w-0 overflow-hidden border border-[#E6F7FF]/10 rounded-lg bg-[#0D1026]/70 p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4"><Tag className="w-4 h-4" /><h2 className="font-serif text-xl">Source Keywords</h2></div>
      <div className="flex flex-wrap gap-2">
        {keywords.slice(0, 40).map((keyword) => (
          <a key={keyword.id} href={keyword.image_url || keyword.source_url || '#'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E6F7FF]/5 hover:bg-[#E6F7FF]/10 text-xs">
            {keyword.term}<ExternalLink className="w-3 h-3 opacity-50" />
          </a>
        ))}
      </div>
    </section>
  );
}
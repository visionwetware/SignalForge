import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import PokedexCard from '@/components/pokedex/PokedexCard';
import PokedexModal from '@/components/pokedex/PokedexModal';
import { buildGalleryCards, loadGalleryData } from '@/services/scanOrchestrator';
import { Search } from 'lucide-react';

export default function PokedexGallery() {
  const [data, setData] = useState({ images: [], scans: [], pages: [], keywords: [], albums: [], albumItems: [] });
  const [query, setQuery] = useState('');
  const [keyword, setKeyword] = useState('all');
  const [date, setDate] = useState('all');
  const [sort, setSort] = useState('newest');
  const [selectedIndex, setSelectedIndex] = useState(null);

  const load = async () => setData(await loadGalleryData());
  useEffect(() => { load(); }, []);

  const cards = useMemo(() => buildGalleryCards(data), [data]);
  const allKeywords = useMemo(() => Array.from(new Set(data.keywords.map((item) => item.term))).filter(Boolean).sort().slice(0, 80), [data.keywords]);

  const filtered = useMemo(() => {
    const now = Date.now();
    return cards
      .filter((card) => {
        const haystack = `${card.page?.title || ''} ${card.scan?.topics?.join(' ') || ''} ${card.keywords.map((item) => item.term).join(' ')}`.toLowerCase();
        const matchesQuery = !query || haystack.includes(query.toLowerCase());
        const matchesKeyword = keyword === 'all' || card.keywords.some((item) => item.term === keyword);
        const scannedDate = new Date(card.scan?.scanned_at || card.image.created_date).getTime();
        const matchesDate = date === 'all' || (date === 'week' && now - scannedDate < 7 * 86400000) || (date === 'month' && now - scannedDate < 31 * 86400000);
        return matchesQuery && matchesKeyword && matchesDate;
      })
      .sort((a, b) => sort === 'score' ? (b.scan?.score || 0) - (a.scan?.score || 0) : new Date(b.image.created_date) - new Date(a.image.created_date));
  }, [cards, query, keyword, date, sort]);

  const selected = selectedIndex === null ? null : filtered[selectedIndex];
  const toggleFavorite = async (card) => {
    await base44.entities.SourceImage.update(card.image.id, { favorite: !card.image.favorite });
    load();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 pb-24">
      <PageHeader
        eyebrow="SignalDex"
        title="Pokedex gallery"
        description="A living album of extracted source images, scan scores, keywords, provenance links, favorites, and collections."
      />

      <div className="grid md:grid-cols-[1fr_auto_auto_auto] gap-3 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1814]/35" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Quick search" className="w-full pl-10 pr-4 py-3 rounded-md bg-white border border-[#1A1814]/15 focus:outline-none focus:border-[#1A1814]" />
        </div>
        <select value={keyword} onChange={(e) => setKeyword(e.target.value)} className="px-4 py-3 rounded-md bg-white border border-[#1A1814]/15">
          <option value="all">All keywords</option>
          {allKeywords.map((term) => <option key={term} value={term}>{term}</option>)}
        </select>
        <select value={date} onChange={(e) => setDate(e.target.value)} className="px-4 py-3 rounded-md bg-white border border-[#1A1814]/15">
          <option value="all">Any date</option>
          <option value="week">Past week</option>
          <option value="month">Past month</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-4 py-3 rounded-md bg-white border border-[#1A1814]/15">
          <option value="newest">Newest</option>
          <option value="score">Highest score</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-[#1A1814]/15 rounded-lg p-12 text-center text-[#1A1814]/50">No scanned source images yet. Ingest a Source URL from Curio Capture.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((card, index) => <PokedexCard key={card.image.id} card={card} onOpen={() => setSelectedIndex(index)} onFavorite={() => toggleFavorite(card)} />)}
        </div>
      )}

      <PokedexModal
        card={selected}
        albums={data.albums}
        onClose={() => setSelectedIndex(null)}
        onPrev={() => setSelectedIndex((value) => value === 0 ? filtered.length - 1 : value - 1)}
        onNext={() => setSelectedIndex((value) => value === filtered.length - 1 ? 0 : value + 1)}
        onAlbumChanged={load}
      />
    </div>
  );
}
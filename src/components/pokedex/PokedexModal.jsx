import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, ExternalLink, Folder, X } from 'lucide-react';
import ROIAnnotationPanel from '@/components/pokedex/ROIAnnotationPanel';

export default function PokedexModal({ card, albums, onClose, onNext, onPrev, onAlbumChanged }) {
  const [albumName, setAlbumName] = useState('');
  if (!card) return null;

  const addToAlbum = async (albumId) => {
    if (!albumId || card.source_type !== 'curio') return;
    await base44.entities.AlbumItem.create({ album_id: albumId, source_image_id: card.image.id });
    onAlbumChanged?.();
  };

  const createAlbum = async () => {
    if (!albumName.trim()) return;
    if (card.source_type !== 'curio') return;
    const album = await base44.entities.Album.create({ name: albumName.trim(), cover_image_url: card.image.image_url });
    await addToAlbum(album.id);
    setAlbumName('');
  };

  const tags = Array.from(new Set((card.keywords || []).map((keyword) => keyword.term))).slice(0, 20);

  return (
    <div className="fixed inset-0 z-50 bg-[#E6F7FF]/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[92vh] overflow-auto rounded-xl bg-[#FAF7F2] shadow-2xl border border-white/20">
        <div className="sticky top-0 z-10 bg-[#FAF7F2]/95 backdrop-blur flex items-center justify-between p-4 border-b border-[#E6F7FF]/10">
          <button onClick={onPrev} className="p-2 rounded-md hover:bg-[#E6F7FF]/5"><ChevronLeft className="w-5 h-5" /></button>
          <div className="font-serif text-xl">SignalDex Entry</div>
          <div className="flex items-center gap-1"><button onClick={onNext} className="p-2 rounded-md hover:bg-[#E6F7FF]/5"><ChevronRight className="w-5 h-5" /></button><button onClick={onClose} className="p-2 rounded-md hover:bg-[#E6F7FF]/5"><X className="w-5 h-5" /></button></div>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-0">
          <div className="p-5"><img src={card.image.image_url} alt="" className="w-full rounded-lg border border-[#E6F7FF]/10 bg-white" /></div>
          <div className="p-5 lg:border-l border-[#E6F7FF]/10">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#E6F7FF]/50">{card.source_type === 'scan' ? 'Scan upload' : 'Curio source'}</div>
            <h2 className="font-serif text-3xl mt-1 leading-tight">{card.page?.title || card.image.title || 'Captured image'}</h2>
            <a href={card.page?.canonical_url || card.image.image_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#E6F7FF]/60 hover:underline">{card.source_type === 'scan' ? 'Open image' : 'Open source'} <ExternalLink className="w-3.5 h-3.5" /></a>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <Metric label="Score" value={Math.round(card.scan?.score || 0)} />
              <Metric label="Status" value={card.scan?.status || 'queued'} />
            </div>

            {card.scan?.notes && <p className="mt-5 text-sm leading-relaxed text-[#E6F7FF]/70">{card.scan.notes}</p>}

            <div className="mt-6">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#E6F7FF]/50 mb-2">Keywords</div>
              <div className="flex flex-wrap gap-2">{tags.map((tag) => <span key={tag} className="px-2.5 py-1 rounded-full bg-[#E6F7FF]/5 text-xs">{tag}</span>)}</div>
            </div>

            <ROIAnnotationPanel card={card} />

            {card.source_type === 'curio' && (
              <div className="mt-7 rounded-lg border border-[#E6F7FF]/10 p-4 bg-white/40">
                <div className="flex items-center gap-2 font-medium mb-3"><Folder className="w-4 h-4" />Collection</div>
                <select onChange={(e) => addToAlbum(e.target.value)} defaultValue="" className="w-full px-3 py-2 rounded-md border border-[#E6F7FF]/15 bg-white text-sm">
                  <option value="">Add to existing album…</option>
                  {albums.map((album) => <option key={album.id} value={album.id}>{album.name}</option>)}
                </select>
                <div className="flex gap-2 mt-2">
                  <input value={albumName} onChange={(e) => setAlbumName(e.target.value)} placeholder="New album name" className="flex-1 px-3 py-2 rounded-md border border-[#E6F7FF]/15 bg-white text-sm" />
                  <button onClick={createAlbum} className="px-3 py-2 rounded-md bg-[#E6F7FF] text-[#FAF7F2] text-sm">Create</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return <div className="rounded-md bg-white/60 border border-[#E6F7FF]/10 p-3"><div className="text-[10px] uppercase tracking-[0.16em] text-[#E6F7FF]/45">{label}</div><div className="font-serif text-2xl mt-1 capitalize">{value}</div></div>;
}
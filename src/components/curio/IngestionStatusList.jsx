import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw } from 'lucide-react';

export default function IngestionStatusList({ refreshKey }) {
  const [pages, setPages] = useState([]);
  const [scans, setScans] = useState([]);

  const load = async () => {
    const [nextPages, nextScans] = await Promise.all([
      base44.entities.SourcePage.list('-created_date', 8),
      base44.entities.ScanResult.list('-created_date', 30),
    ]);
    setPages(nextPages);
    setScans(nextScans);
  };

  useEffect(() => { load(); }, [refreshKey]);

  return (
    <section className="w-full min-w-0 overflow-hidden border border-[#E6F7FF]/10 rounded-lg bg-[#0D1026]/70 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl">Ingestion jobs</h2>
        <button onClick={load} className="text-xs inline-flex items-center gap-1 text-[#E6F7FF]/60 hover:text-[#E6F7FF]"><RefreshCw className="w-3 h-3" />Refresh</button>
      </div>
      {pages.length === 0 ? <div className="text-sm text-[#E6F7FF]/50">No ingest jobs yet.</div> : (
        <div className="space-y-3">
          {pages.map((page) => {
            const pageScans = scans.filter((scan) => scan.source_url === page.canonical_url || scan.source_url === page.url);
            return (
              <div key={page.id} className="rounded-md border border-[#E6F7FF]/10 bg-[#121735]/80 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{page.title || page.url}</div>
                    <a href={page.canonical_url || page.url} target="_blank" rel="noreferrer" className="text-xs text-[#E6F7FF]/50 hover:underline truncate block">{page.canonical_url || page.url}</a>
                  </div>
                  <StatusBadge status={page.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#E6F7FF]/60">
                  <span>{pageScans.length} image scans</span>
                  <span>{pageScans.filter((scan) => scan.status === 'done').length} done</span>
                  <span>{pageScans.filter((scan) => scan.status === 'failed').length} failed</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }) {
  const tone = status === 'done' ? 'bg-[#2F6F4E]/10 text-[#2F6F4E]' : status === 'failed' ? 'bg-[#FF3B6B]/10 text-[#FF3B6B]' : 'bg-[#FF2BD6]/10 text-[#8A6508]';
  return <span className={`text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded ${tone}`}>{status || 'queued'}</span>;
}
import { useState } from 'react';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import { ingestSourceUrl } from '@/services/webIngestService';

export default function SourceIngestForm({ onIngested }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const data = await ingestSourceUrl(url.trim());
      setResult(data);
      setUrl('');
      onIngested?.(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Ingest failed.');
    }
    setLoading(false);
  };

  return (
    <section className="border border-[#1A1814]/10 rounded-lg bg-white/50 p-6 md:p-7">
      <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1814]/50">SignalForge Ingest</div>
      <h2 className="font-serif text-2xl mt-1">Capture a source page</h2>
      <p className="text-sm text-[#1A1814]/60 mt-2">Submit a webpage URL to extract text, meaningful images, provenance metadata, keywords, and image scans.</p>

      <form onSubmit={submit} className="mt-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1814]/35" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/source-page" className="w-full pl-10 pr-4 py-3 bg-white border border-[#1A1814]/15 rounded-md focus:outline-none focus:border-[#1A1814]" />
        </div>
        <button disabled={loading} className="px-6 py-3 rounded-md bg-[#1A1814] text-[#FAF7F2] disabled:opacity-50 inline-flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}Ingest
        </button>
      </form>

      {error && <div className="mt-4 text-sm text-[#A14545] bg-[#A14545]/8 rounded-md p-3">{error}</div>}
      {result && <div className="mt-4 text-sm bg-[#1A1814]/5 rounded-md p-3">Captured <strong>{result.imageCount}</strong> images from <strong>{result.title}</strong>.</div>}
    </section>
  );
}
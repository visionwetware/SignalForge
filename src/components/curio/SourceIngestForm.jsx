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
    <section className="w-full min-w-0 overflow-hidden border border-[#E6F7FF]/10 rounded-lg bg-[#0D1026]/70 p-4 md:p-7">
      <div className="text-[10px] uppercase tracking-[0.18em] text-[#E6F7FF]/50">Curio Ingest</div>
      <h2 className="font-serif text-2xl mt-1">Capture a source page</h2>
      <p className="text-sm text-[#E6F7FF]/60 mt-2">Submit a webpage URL to extract text, meaningful images, provenance metadata, keywords, and image scans.</p>

      <form onSubmit={submit} className="mt-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E6F7FF]/35" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/source-page" className="w-full pl-10 pr-4 py-3 bg-[#0D1026] border border-[#E6F7FF]/15 rounded-md focus:outline-none focus:border-[#E6F7FF]" />
        </div>
        <button disabled={loading} className="px-6 py-3 rounded-md bg-[#E6F7FF] text-[#080A18] disabled:opacity-50 inline-flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}Ingest
        </button>
      </form>

      {error && <div className="mt-4 text-sm text-[#FF3B6B] bg-[#FF3B6B]/8 rounded-md p-3">{error}</div>}
      {result && <div className="mt-4 text-sm bg-[#E6F7FF]/5 rounded-md p-3">Captured <strong>{result.imageCount}</strong> images from <strong>{result.title}</strong>.</div>}
    </section>
  );
}
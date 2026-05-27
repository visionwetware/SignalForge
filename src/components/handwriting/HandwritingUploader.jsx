import { Image, Loader2, Sparkles, Upload } from 'lucide-react';

export default function HandwritingUploader({ files, setFiles, onAnalyze, analyzing }) {
  return (
    <section className="w-full min-w-0 border border-[#E6F7FF]/10 rounded-lg bg-[#0D1026]/70 p-4 md:p-7">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-md bg-[#00F5FF]/10 flex items-center justify-center shrink-0">
          <Image className="w-5 h-5 text-[#00F5FF]" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#E6F7FF]/50">Handwriting samples</div>
          <h2 className="font-serif text-2xl mt-1">Upload handwriting</h2>
          <p className="text-sm text-[#E6F7FF]/60 mt-2">Use clear photos of natural handwriting. More samples help Curio estimate a more consistent reading style.</p>
        </div>
      </div>

      <label className="flex flex-col items-center justify-center gap-3 px-5 py-10 border border-dashed border-[#E6F7FF]/20 rounded-lg cursor-pointer hover:border-[#00F5FF]/60 transition bg-[#080A18]/50">
        <Upload className="w-5 h-5 text-[#E6F7FF]/50" />
        <div className="text-sm text-[#E6F7FF]/70 text-center">Tap to add handwriting images</div>
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
      </label>

      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="text-xs text-[#E6F7FF]/60 rounded-md border border-[#E6F7FF]/10 p-3 truncate bg-[#080A18]/50">
              {file.name}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onAnalyze}
        disabled={analyzing || files.length === 0}
        className="mt-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-[#E6F7FF] text-[#080A18] disabled:opacity-50"
      >
        {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {analyzing ? 'Analyzing handwriting…' : 'Create handwriting profile'}
      </button>
    </section>
  );
}
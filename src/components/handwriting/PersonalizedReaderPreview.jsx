import { FileText, Type } from 'lucide-react';

const SAMPLE_TEXT = 'Reading should feel familiar. This preview adapts spacing, slant, stroke weight, and rhythm to approximate the uploaded handwriting profile.';

export default function PersonalizedReaderPreview({ profile }) {
  const css = profile?.recommended_css || {};
  const previewStyle = {
    letterSpacing: css.letterSpacing || (profile?.spacing === 'wide' ? '0.08em' : profile?.spacing === 'tight' ? '0.01em' : '0.04em'),
    lineHeight: css.lineHeight || '1.9',
    fontWeight: css.fontWeight || (profile?.stroke_weight === 'heavy' ? 700 : profile?.stroke_weight === 'light' ? 400 : 500),
    transform: profile?.slant === 'right' ? 'skewX(-3deg)' : profile?.slant === 'left' ? 'skewX(3deg)' : 'none',
    fontFamily: css.fontFamily || 'Fraunces, Georgia, serif',
  };

  return (
    <section className="w-full min-w-0 border border-[#E6F7FF]/10 rounded-lg bg-[#0D1026]/70 p-4 md:p-7">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-md bg-[#FF2BD6]/10 flex items-center justify-center shrink-0">
          <Type className="w-5 h-5 text-[#FF2BD6]" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#E6F7FF]/50">Personalized reader</div>
          <h2 className="font-serif text-2xl mt-1">Own-font preview</h2>
          <p className="text-sm text-[#E6F7FF]/60 mt-2">This approximates the reader’s handwriting traits for more familiar document reading.</p>
        </div>
      </div>

      {profile ? (
        <div className="rounded-lg border border-[#E6F7FF]/10 bg-[#080A18]/70 p-5 overflow-hidden">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#E6F7FF]/45 mb-4">
            <FileText className="w-3.5 h-3.5" /> Preview document
          </div>
          <p className="text-xl md:text-2xl text-[#E6F7FF] break-words" style={previewStyle}>{SAMPLE_TEXT}</p>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#E6F7FF]/15 bg-[#080A18]/50 p-8 text-center text-sm text-[#E6F7FF]/50">
          Upload handwriting samples to generate a personalized reading preview.
        </div>
      )}
    </section>
  );
}
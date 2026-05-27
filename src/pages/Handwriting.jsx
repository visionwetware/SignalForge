import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import HandwritingUploader from '@/components/handwriting/HandwritingUploader';
import HandwritingProfileCard from '@/components/handwriting/HandwritingProfileCard';
import PersonalizedReaderPreview from '@/components/handwriting/PersonalizedReaderPreview';

const PROFILE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    summary: { type: 'string' },
    letter_shape_notes: { type: 'string' },
    slant: { type: 'string', enum: ['left', 'neutral', 'right'] },
    spacing: { type: 'string', enum: ['tight', 'balanced', 'wide'] },
    stroke_weight: { type: 'string', enum: ['light', 'medium', 'heavy'] },
    roundness: { type: 'number' },
    baseline_variation: { type: 'number' },
    recommended_css: {
      type: 'object',
      properties: {
        letterSpacing: { type: 'string' },
        lineHeight: { type: 'string' },
        fontWeight: { type: 'number' },
        fontFamily: { type: 'string' }
      }
    }
  },
  required: ['name', 'summary', 'letter_shape_notes', 'slant', 'spacing', 'stroke_weight', 'roundness', 'baseline_variation', 'recommended_css']
};

export default function Handwriting() {
  const [files, setFiles] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const loadProfiles = async () => {
    const next = await base44.entities.HandwritingProfile.list('-created_date', 12);
    setProfiles(next);
    setSelected((current) => current || next[0] || null);
  };

  useEffect(() => { loadProfiles(); }, []);

  const analyze = async () => {
    setError('');
    setAnalyzing(true);
    const uploaded = await Promise.all(files.map((file) => base44.integrations.Core.UploadFile({ file })));
    const imageUrls = uploaded.map((item) => item.file_url);

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: 'Analyze these handwriting samples for a dyslexia-friendly personalized reading profile. Estimate the average typeface traits: slant, spacing, stroke weight, roundness, baseline variation, and clear letter-shape notes. Return practical CSS-like reading settings that approximate the handwriting feel without claiming to generate an exact font.',
      file_urls: imageUrls,
      response_json_schema: PROFILE_SCHEMA
    });

    const saved = await base44.entities.HandwritingProfile.create({
      ...analysis,
      sample_image_urls: imageUrls,
      name: analysis.name || `Handwriting profile ${new Date().toLocaleDateString()}`
    });

    setProfiles((current) => [saved, ...current]);
    setSelected(saved);
    setFiles([]);
    setAnalyzing(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-12 pb-24 overflow-x-hidden">
      <PageHeader
        eyebrow="Assistive reading"
        title="Handwriting typeface"
        description="Upload handwriting samples so Curio can annotate the reader’s natural letterforms and create a familiar reading preview for online documents."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-4 md:gap-6 min-w-0">
        <div className="space-y-4 md:space-y-6 min-w-0">
          <HandwritingUploader files={files} setFiles={setFiles} onAnalyze={analyze} analyzing={analyzing} />
          {error && <div className="text-sm text-[#FF3B6B] bg-[#FF3B6B]/8 rounded-md p-3">{error}</div>}
          <PersonalizedReaderPreview profile={selected} />
        </div>

        <section className="w-full min-w-0 border border-[#E6F7FF]/10 rounded-lg bg-[#0D1026]/70 p-4 md:p-6">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#E6F7FF]/50 mb-2">Saved profiles</div>
          <h2 className="font-serif text-2xl mb-5">Average typefaces</h2>
          {profiles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#E6F7FF]/15 bg-[#080A18]/50 p-8 text-center text-sm text-[#E6F7FF]/50">No handwriting profiles yet.</div>
          ) : (
            <div className="space-y-3">
              {profiles.map((profile) => (
                <HandwritingProfileCard key={profile.id} profile={profile} selected={selected?.id === profile.id} onSelect={setSelected} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
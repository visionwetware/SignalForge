import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import CurioRecorderPanel from '@/components/curio/CurioRecorderPanel';
import SourceIngestForm from '@/components/curio/SourceIngestForm';
import IngestionStatusList from '@/components/curio/IngestionStatusList';
import SourceKeywordsPanel from '@/components/curio/SourceKeywordsPanel';

export default function Curio() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [keywords, setKeywords] = useState([]);

  const refreshKeywords = async () => {
    const next = await base44.entities.Keyword.list('-created_date', 60);
    setKeywords(next);
  };

  useEffect(() => { refreshKeywords(); }, [refreshKey]);

  const refresh = () => setRefreshKey((value) => value + 1);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-12 pb-24 overflow-x-hidden">
      <PageHeader
        eyebrow="Curio Capture"
        title="Capture, transcribe, ingest"
        description="Record voice notes and submit source pages into Curio with provenance, keywords, image scans, and gallery-ready artifacts."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-4 md:gap-6 mb-6 min-w-0">
        <div className="space-y-4 md:space-y-6 min-w-0">
          <CurioRecorderPanel onTranscriptSaved={refresh} />
          <SourceIngestForm onIngested={refresh} />
        </div>
        <div className="space-y-4 md:space-y-6 min-w-0">
          <IngestionStatusList refreshKey={refreshKey} />
          <SourceKeywordsPanel keywords={keywords} />
        </div>
      </div>
    </div>
  );
}
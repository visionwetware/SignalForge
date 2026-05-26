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
    <div className="max-w-6xl mx-auto px-6 md:px-12 py-12 pb-24">
      <PageHeader
        eyebrow="Curio Capture"
        title="Capture, transcribe, ingest"
        description="Record voice notes and submit source pages into SignalForge with provenance, keywords, image scans, and gallery-ready artifacts."
      />

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 mb-6">
        <div className="space-y-6">
          <CurioRecorderPanel onTranscriptSaved={refresh} />
          <SourceIngestForm onIngested={refresh} />
        </div>
        <div className="space-y-6">
          <IngestionStatusList refreshKey={refreshKey} />
          <SourceKeywordsPanel keywords={keywords} />
        </div>
      </div>
    </div>
  );
}
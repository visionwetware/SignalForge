import { base44 } from '@/api/base44Client';

export async function transcribeAudio({ blob, durationSec, mimeType, sessionId }) {
  const file = new File([blob], `curio-recording-${Date.now()}.webm`, { type: mimeType || blob.type || 'audio/webm' });
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  const text = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url });
  const user = await base44.auth.me();

  return base44.entities.Transcript.create({
    user_id: user.id,
    audio_url: file_url,
    duration_sec: durationSec,
    mime_type: mimeType || blob.type,
    text,
    language: 'auto',
    session_id: sessionId,
    metadata: { provider: 'base44-core', created_at: new Date().toISOString() },
  });
}

export async function saveTranscriptKeywords(transcript) {
  const terms = (transcript.text.toLowerCase().match(/[a-z0-9][a-z0-9-]{3,}/g) || [])
    .filter((term, index, array) => array.indexOf(term) === index)
    .slice(0, 16);

  if (!terms.length) return [];

  return base44.entities.Keyword.bulkCreate(terms.map((term) => ({
    term,
    weight: 1,
    source_type: 'transcript',
    transcript_id: transcript.id,
    evidence_snippet: transcript.text.slice(0, 240),
  })));
}
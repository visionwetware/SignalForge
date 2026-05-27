import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, Mic, Pause, Play, Square } from 'lucide-react';
import { createRecorder, formatDuration, isRecordingSupported, validateAudioBlob } from '@/services/recordingService';
import { saveTranscriptKeywords, transcribeAudio } from '@/services/transcriptionService';

export default function CurioRecorderPanel({ onTranscriptSaved }) {
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState(null);
  const recorderRef = useRef(null);
  const startedAtRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => () => cleanup(), []);

  const cleanup = () => {
    clearInterval(timerRef.current);
    recorderRef.current?.stopTracks?.();
  };

  const start = async () => {
    setError('');
    setTranscript(null);
    if (!isRecordingSupported()) {
      setState('error');
      setError('Microphone recording is not supported in this browser. Try Chrome, Edge, or Safari.');
      return;
    }
    try {
      recorderRef.current = await createRecorder();
      startedAtRef.current = Date.now();
      recorderRef.current.recorder.start();
      setElapsed(0);
      setState('recording');
      timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000)), 500);
    } catch {
      setState('error');
      setError('Microphone permission was denied or revoked. Allow microphone access in your browser settings and try again.');
    }
  };

  const pause = () => {
    recorderRef.current?.recorder.pause();
    clearInterval(timerRef.current);
    setState('paused');
  };

  const resume = () => {
    recorderRef.current?.recorder.resume();
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000)), 500);
    setState('recording');
  };

  const stop = async () => {
    const current = recorderRef.current;
    if (!current) return;
    setState('processing');
    clearInterval(timerRef.current);

    try {
      const stopped = new Promise((resolve) => { current.recorder.onstop = resolve; });
      current.recorder.stop();
      await stopped;
      current.stopTracks();

      const blob = current.getBlob();
      const durationSec = Math.max(1, elapsed);
      validateAudioBlob(blob, durationSec);
      const saved = await transcribeAudio({ blob, durationSec, mimeType: blob.type });
      await saveTranscriptKeywords(saved);
      setTranscript(saved);
      setState('idle');
      onTranscriptSaved?.(saved);
    } catch (err) {
      setState('error');
      setError(err.message || 'Recording could not be processed.');
    }
  };

  return (
    <section className="w-full min-w-0 overflow-hidden border border-[#E6F7FF]/10 rounded-lg bg-[#0D1026]/70 p-4 md:p-7">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-5 min-w-0">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#E6F7FF]/50">Curio Capture</div>
          <h2 className="font-serif text-2xl mt-1">Voice note recorder</h2>
          <p className="text-sm text-[#E6F7FF]/60 mt-2 max-w-xl">SignalForge uses your microphone only to capture a note, transcribe it, and save keywords for provenance.</p>
        </div>
        {state === 'recording' && <span className="flex items-center gap-2 text-xs text-[#FF3B6B]"><span className="w-2 h-2 rounded-full bg-[#FF3B6B] animate-pulse" />REC</span>}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
        <button onClick={state === 'idle' || state === 'error' ? start : state === 'paused' ? resume : undefined} disabled={state === 'processing' || state === 'recording'} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-[#E6F7FF] text-[#080A18] disabled:opacity-50">
          {state === 'processing' ? <Loader2 className="w-4 h-4 animate-spin" /> : state === 'paused' ? <Play className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          {state === 'processing' ? 'Transcribing…' : state === 'paused' ? 'Resume' : 'Start recording'}
        </button>
        {state === 'recording' && <button onClick={pause} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md border border-[#E6F7FF]/15"><Pause className="w-4 h-4" />Pause</button>}
        {(state === 'recording' || state === 'paused') && <button onClick={stop} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md border border-[#E6F7FF]/15"><Square className="w-4 h-4" />Stop</button>}
        <div className="font-serif text-3xl tabular-nums">{formatDuration(elapsed)}</div>
      </div>

      {error && <div className="mt-4 flex gap-2 text-sm text-[#FF3B6B] bg-[#FF3B6B]/8 rounded-md p-3"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}
      {transcript && <div className="mt-5 rounded-md bg-[#E6F7FF]/5 p-4"><div className="text-[10px] uppercase tracking-[0.18em] text-[#E6F7FF]/50 mb-2">Transcript saved</div><p className="text-sm leading-relaxed">{transcript.text}</p></div>}
    </section>
  );
}
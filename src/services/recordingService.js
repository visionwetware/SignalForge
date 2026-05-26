export const RECORDING_LIMITS = {
  maxDurationSec: 180,
  maxFileBytes: 25 * 1024 * 1024,
};

export function isRecordingSupported() {
  return !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
}

export async function createRecorder({ onData, mimeType } = {}) {
  if (!isRecordingSupported()) {
    throw new Error('This browser does not support microphone recording. Try the latest Chrome, Edge, or Safari.');
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks = [];

  recorder.ondataavailable = (event) => {
    if (event.data?.size) {
      chunks.push(event.data);
      onData?.(event.data);
    }
  };

  return {
    recorder,
    stream,
    stopTracks: () => stream.getTracks().forEach((track) => track.stop()),
    getBlob: () => new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }),
  };
}

export function validateAudioBlob(blob, durationSec) {
  if (blob.size > RECORDING_LIMITS.maxFileBytes) {
    throw new Error('Recording is too large. Please keep audio under 25MB.');
  }
  if (durationSec > RECORDING_LIMITS.maxDurationSec) {
    throw new Error('Recording is too long. Please keep it under 3 minutes.');
  }
}

export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}
export const RECORDING_STATES = ['idle', 'recording', 'paused', 'processing', 'error'];

export function canTransitionRecordingState(from, to) {
  const transitions = {
    idle: ['recording', 'error'],
    recording: ['paused', 'processing', 'error'],
    paused: ['recording', 'processing', 'error'],
    processing: ['idle', 'error'],
    error: ['idle', 'recording'],
  };
  return transitions[from]?.includes(to) || false;
}
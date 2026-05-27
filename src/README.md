# Curio Capture + Ingest

## Setup
- The app uses Base44 entities, integrations, and backend functions.
- Microphone capture uses browser APIs: `navigator.mediaDevices.getUserMedia` and `MediaRecorder`.
- Transcription uses the default Base44 Core transcription path and is isolated in `services/transcriptionService.js` so another provider can be swapped later.

## Permissions
- Users must allow microphone access to record Curio notes.
- If access is denied or revoked, the recorder shows browser-setting guidance.
- Audio is uploaded only after the user stops recording.

## Source URL Ingest
- Submit a webpage from Curio Capture.
- The backend fetches the page, extracts title, canonical URL, publish date, cleaned text, meaningful images, keywords, and scan jobs.
- Image scans are stored in `ScanResult` and displayed in the Pokedex gallery.

## Known limitations
- Some sites block server-side fetches, hotlinking, or image access; these are logged as failed scans.
- Robots/CORS restrictions and provider rate limits may prevent full extraction.
- Audio recordings are limited to 3 minutes and 25MB.

## Troubleshooting
- Mic not available: use a modern browser and verify site microphone permissions.
- URL ingest fails: try a publicly accessible article page.
- Image scan fails: open the image URL directly; if blocked by the host, retry may still fail.

## PR summary
- Added Curio recorder, transcription persistence, source ingest, image scan jobs, keyword provenance, and Pokedex gallery.
- Added entities for SourcePage, SourceImage, ScanResult, Keyword, Transcript, Album, and AlbumItem.
- Added backend ingest/retry functions and modular frontend services/components.
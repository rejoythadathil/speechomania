# voice

Text to speech with ElevenLabs, with word timings for read-along. Each line becomes `audio/<hash>.mp3` plus `audio/<hash>.json` (duration and word timings) in the media bucket. The hash covers voice, model, settings and text, so a line is generated once and reused forever.

| File | Exports |
|---|---|
| `service/index.js` | `voiceReady`, `audioKey(text)`, `storedSpeech(text)` → the stored recording or `null` (never calls ElevenLabs), `speechFor(text)` → `{ key, duration, words, generated }` |
| `utils/index.js` | `audioBase(text, { voiceId, model })`, `wordTimings(text, alignment)`, `lessonLines(content)` (every spoken line in lesson content) |
| `constants/index.js` | `VOICE_SETTINGS` (lively, 0.95× speed), ElevenLabs URL and output format, audio folder |
| `exception/index.js` | `voiceNotConfigured()`, `voiceFailed(status, text)` |

Config: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` (default Jessica, a young American woman), `ELEVENLABS_MODEL`, plus the S3 settings.

Used by `scripts/lesson-audio.js` (`bun run audio <slug>`), which writes audio into a lesson draft; `scripts/audio-export.js` and `scripts/audio-import.js` (`bun run audio:export|audio:import <folder>`), which carry recordings from one bucket to another; `bun run lessons:sync --voice`, which attaches stored recordings without generating any; and by the `learning` feature, which signs the URLs.

Tests: `tests/index.test.js` (timings, hashing, line collection; with voice configured, a stored line is reused without calling ElevenLabs).

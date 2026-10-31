# voice

Text to speech with ElevenLabs, with word timings for read-along. Each line becomes `audio/<hash>.mp3` plus `audio/<hash>.json` (duration and word timings) in the media bucket. The hash covers voice, model, settings and text, so a line is generated once and reused forever.

| File | Exports |
|---|---|
| `service/index.js` | `voiceReady`, `audioKey(text)`, `speechFor(text)` → `{ key, duration, words, generated }` |
| `utils/index.js` | `audioBase(text, { voiceId, model })`, `wordTimings(text, alignment)`, `lessonLines(content)` (every spoken line in lesson content) |
| `constants/index.js` | `VOICE_SETTINGS` (calm, 0.8× speed), ElevenLabs URL and output format, audio folder |
| `exception/index.js` | `voiceNotConfigured()`, `voiceFailed(status, text)` |

Config: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` (default Lily), `ELEVENLABS_MODEL`, plus the S3 settings.

Used by `scripts/lesson-audio.js` (`bun run audio <slug>`), which writes audio into a lesson draft, and by the `learning` feature, which signs the URLs.

Tests: `tests/index.test.js` (timings, hashing, line collection; with voice configured, a stored line is reused without calling ElevenLabs).

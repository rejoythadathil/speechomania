export const voiceNotConfigured = () => new Error('Voice is not configured: set ELEVENLABS_API_KEY and the S3 settings')

export const voiceFailed = (status, text) => new Error(`ElevenLabs returned ${status} for "${text}"`)

import type { Emotion } from '../constants'

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY

// Custom voice ID
const DEFAULT_VOICE_ID = 'HECTtlQhQlGs92mhlNnU'

// Emotion-based voice settings (stability: lower = more expressive)
const EMOTION_VOICE_SETTINGS: Record<Emotion, { stability: number; similarity_boost: number }> = {
  happy: { stability: 0.35, similarity_boost: 0.75 },
  excited: { stability: 0.25, similarity_boost: 0.7 },
  sad: { stability: 0.6, similarity_boost: 0.8 },
  thinking: { stability: 0.55, similarity_boost: 0.75 },
  confused: { stability: 0.5, similarity_boost: 0.75 },
  surprised: { stability: 0.25, similarity_boost: 0.7 },
  angry: { stability: 0.2, similarity_boost: 0.75 },
  laughing: { stability: 0.2, similarity_boost: 0.7 },
  dancing: { stability: 0.3, similarity_boost: 0.75 },
  neutral: { stability: 0.5, similarity_boost: 0.75 },
  flirty: { stability: 0.3, similarity_boost: 0.8 },
  seductive: { stability: 0.25, similarity_boost: 0.85 },
  loving: { stability: 0.4, similarity_boost: 0.8 },
  moaning: { stability: 0.15, similarity_boost: 0.85 },
}

export interface AlignmentChar {
  character: string
  start_time_ms: number
  end_time_ms: number
}

export interface ElevenLabsResponse {
  audioUrl: string
  alignment: AlignmentChar[]
}

export async function textToSpeechWithTimestamps(text: string, emotion: Emotion = 'neutral'): Promise<ElevenLabsResponse> {
  const voiceSettings = EMOTION_VOICE_SETTINGS[emotion] || EMOTION_VOICE_SETTINGS.neutral

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${DEFAULT_VOICE_ID}/with-timestamps`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        output_format: 'mp3_44100_128',
        voice_settings: {
          stability: voiceSettings.stability,
          similarity_boost: voiceSettings.similarity_boost,
        },
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Eleven Labs API error: ${response.status}`)
  }

  const data = await response.json()

  console.log('Eleven Labs response:', data)

  // The response contains base64 audio and alignment data
  const audioBase64 = data.audio_base64
  const audioBlob = base64ToBlob(audioBase64, 'audio/mpeg')
  const audioUrl = URL.createObjectURL(audioBlob)

  // Extract character alignment from parallel arrays
  const chars = data.alignment?.characters || []
  const startTimes = data.alignment?.character_start_times_seconds || []
  const endTimes = data.alignment?.character_end_times_seconds || []

  const alignment: AlignmentChar[] = chars.map((char: string, i: number) => ({
    character: char,
    start_time_ms: (startTimes[i] || 0) * 1000,
    end_time_ms: (endTimes[i] || (startTimes[i] || 0) + 0.1) * 1000,
  }))

  console.log('Parsed alignment:', alignment)

  return { audioUrl, alignment }
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

import { auth } from '../firebase'

const FUNCTIONS_BASE_URL = 'https://us-central1-casanaai.cloudfunctions.net'

export interface AlignmentChar {
  character: string
  start_time_ms: number
  end_time_ms: number
}

export interface InworldResponse {
  audioUrl: string
  alignment: AlignmentChar[]
}

export async function textToSpeechWithTimestamps(
  text: string,
  voiceId: string = 'Ashley'
): Promise<InworldResponse> {
  const user = auth.currentUser
  if (!user) {
    throw new Error('User not authenticated')
  }

  const token = await user.getIdToken()

  const response = await fetch(`${FUNCTIONS_BASE_URL}/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ text, voiceId })
  })

  if (!response.ok) {
    throw new Error(`TTS API error: ${response.status}`)
  }

  const data = await response.json()

  // Convert base64 audio to blob URL
  const audioBlob = base64ToBlob(data.audioContent, 'audio/mpeg')
  const audioUrl = URL.createObjectURL(audioBlob)

  // Map character timestamps to alignment format
  const chars = data.timestampInfo?.characterAlignment?.characters || []
  const startTimes = data.timestampInfo?.characterAlignment?.characterStartTimeSeconds || []
  const endTimes = data.timestampInfo?.characterAlignment?.characterEndTimeSeconds || []

  const alignment: AlignmentChar[] = chars.map((char: string, i: number) => ({
    character: char,
    start_time_ms: (startTimes[i] || 0) * 1000,
    end_time_ms: (endTimes[i] || (startTimes[i] || 0) + 0.05) * 1000
  }))

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

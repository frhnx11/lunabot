const INWORLD_API_KEY = import.meta.env.VITE_INWORLD_API_KEY

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
  const response = await fetch('https://api.inworld.ai/tts/v1/voice', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${INWORLD_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voiceId,
      modelId: 'inworld-tts-1',
      timestampType: 'CHARACTER',
      outputFormat: 'mp3',
      audioConfig: {
        speakingRate: 0.9, // Slower speech (0.5 to 1.5, default 1.0)
        temperature: 1.1 // More expressive speech (0.6 to 1.2)
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Inworld API error: ${response.status}`)
  }

  const data = await response.json()

  console.log('Inworld response:', data)

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

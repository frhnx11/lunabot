const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData()
  formData.append('file', audioBlob, 'audio.webm')
  formData.append('model', 'whisper-1')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: formData
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Whisper API error:', error)
    throw new Error(`Whisper API error: ${response.status}`)
  }

  const data = await response.json()
  return data.text
}

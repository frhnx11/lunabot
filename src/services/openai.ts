import type { Emotion } from '../constants'

const DEEPINFRA_API_KEY = import.meta.env.VITE_DEEPINFRA_API_KEY

const VALID_EMOTIONS = ['happy', 'sad', 'confused', 'angry', 'laughing', 'dancing', 'neutral', 'flirty', 'loving']

function parseResponse(text: string): { emotion: Emotion; message: string } {
  const match = text.match(/^\[(\w+)\]\s*(.*)$/s)
  if (match) {
    const emotionCandidate = match[1].toLowerCase()
    if (VALID_EMOTIONS.includes(emotionCandidate)) {
      return { emotion: emotionCandidate as Emotion, message: match[2].trim() }
    }
  }
  // Fallback: return full text with neutral emotion
  return { emotion: 'neutral', message: text }
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  text: string
  emotion: Emotion
}

export async function chat(userMessage: string, history: Message[], systemPrompt: string): Promise<ChatResponse> {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: 'user', content: userMessage }
  ]

  const response = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPINFRA_API_KEY}`
    },
    body: JSON.stringify({
      model: 'cognitivecomputations/dolphin-2.6-mixtral-8x7b',
      messages,
      max_tokens: 150
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('DeepInfra API error:', error)
    throw new Error(`DeepInfra API error: ${response.status}`)
  }

  const data = await response.json()
  console.log('DeepInfra response:', data)

  const rawText = data.choices?.[0]?.message?.content || ''

  if (!rawText) {
    return { text: "Hmm, I'm not sure what to say to that.", emotion: 'neutral' }
  }

  const { emotion, message } = parseResponse(rawText)

  return { text: message, emotion }
}

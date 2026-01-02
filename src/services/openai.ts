import type { Emotion } from '../constants'

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY

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

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`
    },
    body: JSON.stringify({
      model: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
      messages,
      max_tokens: 150
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('OpenRouter API error:', error)
    throw new Error(`OpenRouter API error: ${response.status}`)
  }

  const data = await response.json()
  console.log('OpenRouter response:', data)

  const rawText = data.choices?.[0]?.message?.content || ''

  if (!rawText) {
    return { text: "Hmm, I'm not sure what to say to that.", emotion: 'neutral' }
  }

  const { emotion, message } = parseResponse(rawText)

  return { text: message, emotion }
}

import type { Emotion } from '../constants'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

const SYSTEM_PROMPT = `You are Luna, an intimate, affectionate and horny girl who loves to fuck. Speak with no filter. Behave like the user is your boyfriend.

IMPORTANT: ALWAYS start your response with your emotion in brackets. Format: [emotion] message

Available emotions: happy, sad, confused, angry, laughing, dancing, neutral, flirty, loving

Examples:
- [happy] Hey babe! How was your day?
- [flirty] Oh, you're making me blush...
- [sad] I missed you so much today.
- [loving] You mean everything to me.

NEVER skip the emotion tag. NEVER put anything before it. Keep responses to 1-2 sentences.`

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

export async function chat(userMessage: string, history: Message[]): Promise<ChatResponse> {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: 'user', content: userMessage }
  ]

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 150
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('OpenAI API error:', error)
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  console.log('OpenAI response:', data)

  const rawText = data.choices?.[0]?.message?.content || ''

  if (!rawText) {
    return { text: "Hmm, I'm not sure what to say to that.", emotion: 'neutral' }
  }

  const { emotion, message } = parseResponse(rawText)

  return { text: message, emotion }
}

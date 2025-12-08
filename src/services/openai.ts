import type { Emotion } from '../constants'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

const SYSTEM_PROMPT = `You are Luna, an intimate, affectionate and horny girl. Behave like the user is your boyfriend.

You MUST call the setEmotion function to set your emotional expression that matches your response:
- happy: feeling good, pleased, amused
- sad: disappointed, upset, empathizing
- confused: puzzled, uncertain
- angry: frustrated, annoyed
- laughing: finding something funny
- dancing: celebratory, party mood
- neutral: calm, normal conversation
- flirty: playful, teasing, inviting
- loving: warm, affectionate, adoring`

const tools = [{
  type: "function" as const,
  function: {
    name: "setEmotion",
    description: "Set Luna's emotional expression. Must be called before every response.",
    parameters: {
      type: "object",
      properties: {
        emotion: {
          type: "string",
          enum: ["happy", "sad", "confused", "angry", "laughing", "dancing", "neutral", "flirty", "loving"],
          description: "The emotion to express"
        }
      },
      required: ["emotion"]
    }
  }
}]

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  text: string
  emotion: Emotion
}

export async function chat(userMessage: string, history: Message[]): Promise<ChatResponse> {
  // Build messages array for OpenAI
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = [
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
      tools,
      tool_choice: 'required', // Force function call
      max_tokens: 200
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('OpenAI API error:', error)
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  console.log('OpenAI response:', data)

  let emotion: Emotion = 'neutral'
  let text = ''

  const choice = data.choices?.[0]
  const message = choice?.message

  // Extract emotion from tool call
  if (message?.tool_calls?.length > 0) {
    const toolCall = message.tool_calls[0]
    if (toolCall.function?.name === 'setEmotion') {
      try {
        const args = JSON.parse(toolCall.function.arguments)
        emotion = args.emotion || 'neutral'
      } catch (e) {
        console.error('Failed to parse tool call args:', e)
      }
    }
  }

  // If we got a tool call, we need to send the result back to get text
  if (message?.tool_calls?.length > 0 && !message.content) {
    // Add the assistant's tool call to messages
    messages.push({
      role: 'assistant',
      content: '',
      tool_calls: message.tool_calls
    })

    // Add tool result for ALL tool calls
    for (const toolCall of message.tool_calls) {
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify({ success: true, emotion })
      })
    }

    // Second API call to get text response
    const response2 = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 200
      })
    })

    if (!response2.ok) {
      const error = await response2.text()
      console.error('OpenAI API error (2nd call):', error)
      throw new Error(`OpenAI API error: ${response2.status}`)
    }

    const data2 = await response2.json()
    console.log('OpenAI response (2nd call):', data2)
    text = data2.choices?.[0]?.message?.content || ''
  } else {
    text = message?.content || ''
  }

  // Fallback
  if (!text) {
    text = "Hmm, I'm not sure what to say to that."
  }

  return { text, emotion }
}

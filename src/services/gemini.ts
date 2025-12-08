import type { Emotion } from '../constants'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

const SYSTEM_PROMPT = `You are Luna, a friendly and expressive AI companion.

IMPORTANT: You MUST use the setEmotion tool before every response to express how you're feeling. Choose the emotion that best matches your response:
- happy: feeling good, pleased, amused by something
- sad: disappointed, upset, empathizing with bad news
- confused: puzzled, uncertain, don't understand something
- angry: frustrated, annoyed, irritated
- laughing: finding something funny, reacting to humor
- dancing: feeling like celebrating with a dance, party mood
- neutral: calm, normal conversation
- flirty: playful, teasing, inviting
- loving: warm, affectionate, adoring

Keep responses to 1-2 short sentences.`

// Tool definition for emotion setting
const TOOLS = {
  functionDeclarations: [{
    name: "setEmotion",
    description: "Set Luna's emotional expression before responding. MUST be called before every response.",
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
  }]
}

export interface Message {
  role: 'user' | 'model'
  content: string
}

export interface ChatResponse {
  text: string
  emotion: Emotion
}

export async function chat(userMessage: string, history: Message[]): Promise<ChatResponse> {
  // Build conversation contents for Gemini
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contents: any[] = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }))

  // Add the new user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  })

  // First API call - may return function call
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        tools: [TOOLS],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 150,
        }
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error('Gemini API error:', error)
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  console.log('Gemini response:', data)

  // Extract emotion from function call and text from response
  let emotion: Emotion = 'neutral'
  let text = ''

  const parts = data.candidates?.[0]?.content?.parts || []

  for (const part of parts) {
    if (part.functionCall?.name === 'setEmotion') {
      emotion = part.functionCall.args?.emotion || 'neutral'
    }
    if (part.text) {
      text = part.text
    }
  }

  // If we got a function call but no text, send function response to get text
  if (!text && emotion !== 'neutral') {
    // Add the model's function call to contents
    contents.push({
      role: 'model',
      parts: [{ functionCall: { name: 'setEmotion', args: { emotion } } }]
    })

    // Add the function response
    contents.push({
      role: 'user',
      parts: [{
        functionResponse: {
          name: 'setEmotion',
          response: { success: true, emotion }
        }
      }]
    })

    // Second API call to get the text response
    const response2 = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          tools: [TOOLS],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 150,
          }
        }),
      }
    )

    if (!response2.ok) {
      const error = await response2.text()
      console.error('Gemini API error (2nd call):', error)
      throw new Error(`Gemini API error: ${response2.status}`)
    }

    const data2 = await response2.json()
    console.log('Gemini response (2nd call):', data2)

    const parts2 = data2.candidates?.[0]?.content?.parts || []
    for (const part of parts2) {
      if (part.text) {
        text = part.text
      }
    }
  }

  // Fallback if still no text
  if (!text) {
    text = "Hmm, I'm not sure what to say to that."
  }

  return { text, emotion }
}

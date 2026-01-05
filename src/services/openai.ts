const DEEPINFRA_API_KEY = import.meta.env.VITE_DEEPINFRA_API_KEY

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  text: string
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

  const text = data.choices?.[0]?.message?.content || ''

  if (!text) {
    return { text: "Hmm, I'm not sure what to say to that." }
  }

  return { text }
}

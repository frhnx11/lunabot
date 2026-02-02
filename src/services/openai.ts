import { auth } from '../firebase'

const FUNCTIONS_BASE_URL = 'https://us-central1-casanaai.cloudfunctions.net'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  text: string
}

export interface UserProfile {
  name: string
  occupation: string
  personality: string
  interests: string[]
  lookingFor: string
  additionalInfo: string
  completedOnboarding: boolean
}

export async function chat(
  userMessage: string,
  history: Message[],
  systemPrompt: string,
  profile?: UserProfile
): Promise<ChatResponse> {
  const user = auth.currentUser
  if (!user) {
    throw new Error('User not authenticated')
  }

  const token = await user.getIdToken()

  const response = await fetch(`${FUNCTIONS_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message: userMessage,
      history,
      systemPrompt,
      profile
    })
  })

  if (!response.ok) {
    throw new Error(`Chat API error: ${response.status}`)
  }

  const data = await response.json()
  return { text: data.text }
}

import { useState, useCallback, useRef } from 'react'
import './App.css'
import { Scene } from './components/Scene'
import { textToSpeechWithTimestamps, type AlignmentChar } from './services/elevenLabs'
import { chat, type Message } from './services/openai'
import type { Emotion } from './constants'

function App() {
  const [text, setText] = useState('')
  const [speak, setSpeak] = useState(false)
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [alignment, setAlignment] = useState<AlignmentChar[]>([])
  const [emotion, setEmotion] = useState<Emotion>('neutral')
  const conversationHistory = useRef<Message[]>([])
  const emotionTimeoutRef = useRef<number | null>(null)

  const handleSend = async () => {
    if (!text.trim() || loading || speak) return

    const userMessage = text.trim()
    setText('')
    setLoading(true)

    // Clear any pending emotion reset
    if (emotionTimeoutRef.current) {
      clearTimeout(emotionTimeoutRef.current)
    }

    try {
      // Step 1: Get AI response + emotion from Gemini
      const response = await chat(userMessage, conversationHistory.current)
      console.log('Emotion:', response.emotion, 'Text:', response.text)

      // Set the emotion immediately
      setEmotion(response.emotion)

      // Update conversation history
      conversationHistory.current.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: response.text }
      )

      // Step 2: Convert AI response to speech with Eleven Labs (with emotion)
      const ttsResponse = await textToSpeechWithTimestamps(response.text, response.emotion)
      setAudioUrl(ttsResponse.audioUrl)
      setAlignment(ttsResponse.alignment)
      setSpeak(true)
    } catch (error) {
      console.error('Error:', error)
      alert('Something went wrong. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  const handleSpeakEnd = useCallback(() => {
    setSpeak(false)
    // Clean up audio URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
    setAlignment([])

    // Reset emotion to neutral after 5 seconds
    emotionTimeoutRef.current = window.setTimeout(() => {
      setEmotion('neutral')
    }, 5000)
  }, [audioUrl])

  return (
    <div className="app">
      <div className="canvas-container">
        <Scene
          audioUrl={audioUrl}
          alignment={alignment}
          speak={speak}
          emotion={emotion}
          onSpeakEnd={handleSpeakEnd}
        />
      </div>
      <div className="controls">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Say something to Luna..."
          className="text-input"
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading || speak}
        />
        <button onClick={handleSend} disabled={!text.trim() || speak || loading}>
          {loading ? 'Thinking...' : speak ? 'Speaking...' : 'Send'}
        </button>
      </div>
    </div>
  )
}

export default App

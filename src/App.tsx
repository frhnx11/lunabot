import { useState, useCallback, useRef } from 'react'
import './App.css'
import { Scene } from './components/Scene'
import { Sidebar } from './components/Sidebar'
import { textToSpeechWithTimestamps, type AlignmentChar } from './services/elevenLabs'
import { chat, type Message } from './services/openai'
import { CHARACTERS, DEFAULT_CHARACTER_ID, type Emotion, type Character } from './constants'

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((event: Event) => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

function App() {
  const [speak, setSpeak] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [alignment, setAlignment] = useState<AlignmentChar[]>([])
  const [emotion, setEmotion] = useState<Emotion>('neutral')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(
    CHARACTERS.find(c => c.id === DEFAULT_CHARACTER_ID) || CHARACTERS[0]
  )
  const conversationHistory = useRef<Message[]>([])
  const emotionTimeoutRef = useRef<number | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const handleSelectCharacter = (character: Character) => {
    setSelectedCharacter(character)
    setSidebarOpen(false)
  }

  const handleSend = async (userMessage: string) => {
    if (!userMessage.trim() || loading || speak) return

    setLoading(true)

    // Clear any pending emotion reset
    if (emotionTimeoutRef.current) {
      clearTimeout(emotionTimeoutRef.current)
    }

    try {
      const response = await chat(userMessage, conversationHistory.current, selectedCharacter.systemPrompt)
      console.log('Emotion:', response.emotion, 'Text:', response.text)

      setEmotion(response.emotion)

      conversationHistory.current.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: response.text }
      )

      const ttsResponse = await textToSpeechWithTimestamps(response.text, response.emotion, selectedCharacter.voiceId)
      setAudioUrl(ttsResponse.audioUrl)
      setAlignment(ttsResponse.alignment)
      setSpeak(true)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSpeakEnd = useCallback(() => {
    setSpeak(false)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
    setAlignment([])

    emotionTimeoutRef.current = window.setTimeout(() => {
      setEmotion('neutral')
    }, 5000)
  }, [audioUrl])

  const startListening = () => {
    if (loading || speak || isRecording) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript
      setIsRecording(false)
      if (text.trim()) {
        handleSend(text)
      }
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognition.onerror = () => {
      setIsRecording(false)
    }

    recognition.start()
    setIsRecording(true)
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsRecording(false)
  }

  const handleVoiceButtonClick = () => {
    if (isRecording) {
      stopListening()
    } else {
      startListening()
    }
  }

  const isDisabled = loading || speak

  return (
    <div className="app">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        selectedCharacterId={selectedCharacter.id}
        onSelectCharacter={handleSelectCharacter}
      />
      <div
        className="canvas-container"
        style={{ backgroundImage: `url(${selectedCharacter.backgroundImage})` }}
      >
        <Scene
          audioUrl={audioUrl}
          alignment={alignment}
          speak={speak}
          emotion={emotion}
          onSpeakEnd={handleSpeakEnd}
          avatarPath={selectedCharacter.avatarPath}
        />
      </div>
      <button
        className={`voice-button ${isRecording ? 'recording' : ''}`}
        onClick={handleVoiceButtonClick}
        disabled={isDisabled}
      >
        {isRecording ? (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        )}
      </button>
    </div>
  )
}

export default App

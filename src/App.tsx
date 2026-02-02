import { useState, useCallback, useRef } from 'react'
import './App.css'
import { Scene } from './components/Scene'
import { Sidebar } from './components/Sidebar'
import { AuthPage } from './components/AuthPage'
import { Onboarding } from './components/Onboarding'
import { AuthProvider, useAuth } from './context/AuthContext'
import { textToSpeechWithTimestamps, type AlignmentChar } from './services/inworld'
import { chat, type Message } from './services/openai'
import { CHARACTERS, DEFAULT_CHARACTER_ID, type Character } from './constants'

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

type Page = 'home' | 'characters' | 'about' | 'settings'

function AppContent() {
  const { user, loading: authLoading, needsOnboarding, saveProfile, userData } = useAuth()

  if (authLoading) {
    return (
      <div className="app loading-screen">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  if (needsOnboarding) {
    return (
      <Onboarding
        initialName={userData?.name || user.displayName || ''}
        onComplete={saveProfile}
      />
    )
  }

  return <MainApp />
}

function MainApp() {
  const { userData, deductCredit } = useAuth()
  const [speak, setSpeak] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [alignment, setAlignment] = useState<AlignmentChar[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState<Page>('about')
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(
    CHARACTERS.find(c => c.id === DEFAULT_CHARACTER_ID) || CHARACTERS[0]
  )
  const [danceAnimation, setDanceAnimation] = useState<string | null>(null)
  const conversationHistory = useRef<Message[]>([])
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const handleSelectCharacter = (character: Character) => {
    setSelectedCharacter(character)
    // Clear conversation history when switching characters
    conversationHistory.current = []
  }

  const handleSend = async (userMessage: string) => {
    if (!userMessage.trim() || loading || speak) return

    // Check if user has credits
    if (!userData || userData.credits <= 0) {
      alert('You have no credits left. Please purchase more credits to continue chatting.')
      return
    }

    setLoading(true)

    try {
      const response = await chat(userMessage, conversationHistory.current, selectedCharacter.systemPrompt, userData?.profile)
      console.log('Response:', response.text)

      conversationHistory.current.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: response.text }
      )

      const ttsResponse = await textToSpeechWithTimestamps(response.text, selectedCharacter.voiceId)
      setAudioUrl(ttsResponse.audioUrl)
      setAlignment(ttsResponse.alignment)
      setSpeak(true)

      // Deduct 1 credit after successful response
      await deductCredit()
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
  }, [audioUrl])

  const handleDance = (dance: string) => {
    if (!speak && !loading && !danceAnimation) {
      setDanceAnimation(dance)
    }
  }

  const handleDanceEnd = useCallback(() => {
    setDanceAnimation(null)
  }, [])

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

  const hasNoCredits = !userData || userData.credits <= 0
  const isDisabled = loading || speak || hasNoCredits
  const isDanceDisabled = loading || speak || !!danceAnimation

  return (
    <div className="app">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        selectedCharacter={selectedCharacter}
        onSelectCharacter={handleSelectCharacter}
      />

      {currentPage === 'home' && (
        <>
          <div
            className="canvas-container"
            style={{ backgroundImage: `url(${selectedCharacter.backgroundImage})` }}
          >
            <Scene
              audioUrl={audioUrl}
              alignment={alignment}
              speak={speak}
              onSpeakEnd={handleSpeakEnd}
              avatarPath={selectedCharacter.avatarPath}
              danceAnimation={danceAnimation}
              onDanceEnd={handleDanceEnd}
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
          <div className="dance-buttons">
            <button
              className={`dance-button ${danceAnimation === 'dance1' ? 'active' : ''}`}
              onClick={() => handleDance('dance1')}
              disabled={isDanceDisabled}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                <path d="M14 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-1.8 15l1.3-4.7-2.5 1.5V22h-2v-5.6l3.8-2.3-1.2-4.5c-.3-1.1.1-2.3 1-3L16 4l1.3 1.5-3 2.3 1.5 5.2 3.2-2v-4h2v5.5l-5 3.3-.5 1.7H19v2h-6.8z"/>
              </svg>
            </button>
            <button
              className={`dance-button ${danceAnimation === 'dance2' ? 'active' : ''}`}
              onClick={() => handleDance('dance2')}
              disabled={isDanceDisabled}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                <circle cx="12" cy="12" r="9" fill="none" stroke="white" strokeWidth="1.5"/>
                <circle cx="8" cy="9" r="1.5"/>
                <circle cx="16" cy="9" r="1.5"/>
                <circle cx="12" cy="15" r="1.5"/>
                <circle cx="6" cy="13" r="1"/>
                <circle cx="18" cy="13" r="1"/>
                <circle cx="9" cy="17" r="1"/>
                <circle cx="15" cy="17" r="1"/>
                <circle cx="12" cy="5" r="1"/>
              </svg>
            </button>
            <button
              className={`dance-button ${danceAnimation === 'dance3' ? 'active' : ''}`}
              onClick={() => handleDance('dance3')}
              disabled={isDanceDisabled}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 16.4 5.7 21l2.3-7-6-4.6h7.6z"/>
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App

import { useState, useCallback, useRef } from 'react'
import './App.css'
import { Scene } from './components/Scene'
import { textToSpeechWithTimestamps, type AlignmentChar } from './services/elevenLabs'
import { chat, type Message } from './services/openai'
import { transcribeAudio } from './services/whisper'
import type { Emotion } from './constants'

function App() {
  const [speak, setSpeak] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [alignment, setAlignment] = useState<AlignmentChar[]>([])
  const [emotion, setEmotion] = useState<Emotion>('neutral')
  const [status, setStatus] = useState<string>('')

  const conversationHistory = useRef<Message[]>([])
  const emotionTimeoutRef = useRef<number | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const silenceCheckRef = useRef<number | null>(null)

  const handleSend = async (userMessage: string) => {
    if (!userMessage.trim() || loading || speak) return

    setLoading(true)
    setStatus('Thinking...')

    // Clear any pending emotion reset
    if (emotionTimeoutRef.current) {
      clearTimeout(emotionTimeoutRef.current)
    }

    try {
      // Step 1: Get AI response + emotion from OpenAI
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
      setStatus('Speaking...')
      const ttsResponse = await textToSpeechWithTimestamps(response.text, response.emotion)
      setAudioUrl(ttsResponse.audioUrl)
      setAlignment(ttsResponse.alignment)
      setSpeak(true)
    } catch (error) {
      console.error('Error:', error)
      setStatus('Error occurred')
      setTimeout(() => setStatus(''), 2000)
    } finally {
      setLoading(false)
    }
  }

  const handleSpeakEnd = useCallback(() => {
    setSpeak(false)
    setStatus('')
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

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return

    setIsRecording(false)
    setStatus('Processing...')

    // Stop silence detection
    if (silenceCheckRef.current) {
      cancelAnimationFrame(silenceCheckRef.current)
      silenceCheckRef.current = null
    }

    // Stop the media recorder
    mediaRecorderRef.current.stop()

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  const startRecording = async () => {
    if (loading || speak || isRecording) return

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up audio analyser for silence detection
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })

        if (audioBlob.size > 0) {
          try {
            // Transcribe with Whisper
            const transcribedText = await transcribeAudio(audioBlob)
            console.log('Transcribed:', transcribedText)

            if (transcribedText.trim()) {
              // Send to chat
              await handleSend(transcribedText)
            } else {
              setStatus('')
            }
          } catch (error) {
            console.error('Transcription error:', error)
            setStatus('Could not hear you')
            setTimeout(() => setStatus(''), 2000)
          }
        } else {
          setStatus('')
        }

        audioContext.close()
      }

      // Start recording
      mediaRecorder.start()
      setIsRecording(true)
      setStatus('Listening...')

      // Silence detection
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      let silenceStart: number | null = null

      const checkSilence = () => {
        if (!isRecording && mediaRecorderRef.current?.state !== 'recording') return

        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length

        if (average < 10) {
          // Silence detected
          if (!silenceStart) {
            silenceStart = Date.now()
          } else if (Date.now() - silenceStart > 1500) {
            // 1.5 seconds of silence - stop recording
            stopRecording()
            return
          }
        } else {
          // Sound detected - reset silence timer
          silenceStart = null
        }

        silenceCheckRef.current = requestAnimationFrame(checkSilence)
      }

      // Start silence detection after a short delay to let user start speaking
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          checkSilence()
        }
      }, 500)

    } catch (error) {
      console.error('Microphone error:', error)
      setStatus('Microphone access denied')
      setTimeout(() => setStatus(''), 2000)
    }
  }

  const handleVoiceButtonClick = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const isDisabled = loading || speak

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
        {status && <span className="status-text">{status}</span>}
      </div>
    </div>
  )
}

export default App

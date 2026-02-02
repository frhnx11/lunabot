import { useState } from 'react'

interface OnboardingProps {
  initialName?: string
  onComplete: (profile: UserProfile) => void
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

const OCCUPATIONS = [
  { id: 'student', label: 'Student', emoji: '🎓' },
  { id: 'working', label: 'Working professional', emoji: '💼' },
  { id: 'homemaker', label: 'Homemaker', emoji: '🏠' },
  { id: 'creative', label: 'Creative/Freelancer', emoji: '🎨' },
  { id: 'figuring', label: 'Figuring it out', emoji: '🔍' },
]

const PERSONALITIES = [
  { id: 'cheerful', label: 'Cheerful & outgoing', emoji: '😊' },
  { id: 'calm', label: 'Calm & laid-back', emoji: '😌' },
  { id: 'thoughtful', label: 'Thoughtful & quiet', emoji: '🤔' },
  { id: 'anxious', label: 'Anxious but trying', emoji: '😅' },
  { id: 'chaotic', label: 'Chaotic energy', emoji: '🔥' },
]

const INTERESTS = [
  { id: 'tech', label: 'Tech/Coding', emoji: '💻' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮' },
  { id: 'reading', label: 'Reading', emoji: '📚' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'movies', label: 'Movies/Shows', emoji: '🎬' },
  { id: 'food', label: 'Coffee/Food', emoji: '☕' },
  { id: 'fitness', label: 'Fitness', emoji: '🏃' },
  { id: 'art', label: 'Art/Creative', emoji: '🎨' },
]

const LOOKING_FOR = [
  { id: 'talk', label: 'Someone to talk to', emoji: '💬' },
  { id: 'relax', label: 'Help me relax/destress', emoji: '😌' },
  { id: 'companionship', label: 'Companionship & warmth', emoji: '🥰' },
  { id: 'fun', label: 'Just for fun/roleplay', emoji: '🎭' },
]

export function Onboarding({ initialName = '', onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState(initialName)
  const [occupation, setOccupation] = useState('')
  const [personality, setPersonality] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [lookingFor, setLookingFor] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')

  const totalSteps = 6

  const canProceed = () => {
    switch (step) {
      case 1: return name.trim().length > 0
      case 2: return occupation !== ''
      case 3: return personality !== ''
      case 4: return interests.length > 0
      case 5: return lookingFor !== ''
      case 6: return true // Optional step
      default: return false
    }
  }

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleComplete = () => {
    const profile: UserProfile = {
      name: name.trim(),
      occupation,
      personality,
      interests,
      lookingFor,
      additionalInfo: additionalInfo.trim(),
      completedOnboarding: true
    }
    onComplete(profile)
  }

  const toggleInterest = (id: string) => {
    setInterests(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-container">
        {/* Progress bar */}
        <div className="onboarding-progress">
          <div
            className="onboarding-progress-bar"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        <div className="onboarding-content">
          {/* Step 1: Name */}
          {step === 1 && (
            <div className="onboarding-step">
              <h2>What should I call you?</h2>
              <p className="onboarding-subtitle">Let's get to know each other</p>
              <input
                type="text"
                className="onboarding-input"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {/* Step 2: Occupation */}
          {step === 2 && (
            <div className="onboarding-step">
              <h2>What describes you best?</h2>
              <p className="onboarding-subtitle">No pressure, pick one</p>
              <div className="onboarding-options">
                {OCCUPATIONS.map((opt) => (
                  <button
                    key={opt.id}
                    className={`onboarding-option ${occupation === opt.id ? 'selected' : ''}`}
                    onClick={() => setOccupation(opt.id)}
                  >
                    <span className="option-emoji">{opt.emoji}</span>
                    <span className="option-label">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Personality */}
          {step === 3 && (
            <div className="onboarding-step">
              <h2>How would your friends describe you?</h2>
              <p className="onboarding-subtitle">Be honest, no judgment here</p>
              <div className="onboarding-options">
                {PERSONALITIES.map((opt) => (
                  <button
                    key={opt.id}
                    className={`onboarding-option ${personality === opt.id ? 'selected' : ''}`}
                    onClick={() => setPersonality(opt.id)}
                  >
                    <span className="option-emoji">{opt.emoji}</span>
                    <span className="option-label">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Interests */}
          {step === 4 && (
            <div className="onboarding-step">
              <h2>What are you into?</h2>
              <p className="onboarding-subtitle">Pick as many as you like</p>
              <div className="onboarding-options grid">
                {INTERESTS.map((opt) => (
                  <button
                    key={opt.id}
                    className={`onboarding-option compact ${interests.includes(opt.id) ? 'selected' : ''}`}
                    onClick={() => toggleInterest(opt.id)}
                  >
                    <span className="option-emoji">{opt.emoji}</span>
                    <span className="option-label">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Looking for */}
          {step === 5 && (
            <div className="onboarding-step">
              <h2>What are you looking for?</h2>
              <p className="onboarding-subtitle">What brings you here?</p>
              <div className="onboarding-options">
                {LOOKING_FOR.map((opt) => (
                  <button
                    key={opt.id}
                    className={`onboarding-option ${lookingFor === opt.id ? 'selected' : ''}`}
                    onClick={() => setLookingFor(opt.id)}
                  >
                    <span className="option-emoji">{opt.emoji}</span>
                    <span className="option-label">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Additional info */}
          {step === 6 && (
            <div className="onboarding-step">
              <h2>Anything else I should know?</h2>
              <p className="onboarding-subtitle">This is optional, but helps me understand you better</p>
              <textarea
                className="onboarding-textarea"
                placeholder="E.g., I have social anxiety, I love late night conversations, I'm going through a tough time..."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={4}
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="onboarding-nav">
          {step > 1 && (
            <button className="onboarding-btn back" onClick={handleBack}>
              Back
            </button>
          )}
          <button
            className="onboarding-btn next"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {step === totalSteps ? "Let's go!" : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export function NamePrompt() {
  const { saveUserName } = useAuth()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    setLoading(true)
    setError('')

    try {
      await saveUserName(name.trim())
    } catch {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="name-prompt-overlay">
      <div className="name-prompt-modal">
        <h2>Welcome to Casana!</h2>
        <p>What should we call you?</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            autoFocus
          />
          {error && <p className="name-prompt-error">{error}</p>}
          <button type="submit" disabled={loading || !name.trim()}>
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

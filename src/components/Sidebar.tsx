import { CHARACTERS, type Character } from '../constants'

type Page = 'home' | 'characters' | 'about'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  currentPage: Page
  onNavigate: (page: Page) => void
  selectedCharacter: Character
  onSelectCharacter: (character: Character) => void
}

export function Sidebar({
  isOpen,
  onToggle,
  currentPage,
  onNavigate,
  selectedCharacter,
  onSelectCharacter
}: SidebarProps) {

  const handleCharacterSelect = (character: Character) => {
    onSelectCharacter(character)
    onNavigate('home')
  }

  return (
    <>
      {/* Menu Toggle Button */}
      <button className="menu-toggle" onClick={onToggle}>
        <div className={`hamburger ${isOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      {/* Sidebar Navigation */}
      <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="nav-items">
          <button
            className={`nav-item ${currentPage === 'about' ? 'active' : ''}`}
            onClick={() => { onNavigate('about'); onToggle(); }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <span>About</span>
          </button>

          <button
            className={`nav-item ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => { onNavigate('home'); onToggle(); }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span>Home</span>
          </button>

          <button
            className={`nav-item ${currentPage === 'characters' ? 'active' : ''}`}
            onClick={() => { onNavigate('characters'); onToggle(); }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            <span>Characters</span>
          </button>
        </div>

        {/* Current Character Indicator */}
        <div className="current-character">
          <img
            src={selectedCharacter.profilePicture}
            alt={selectedCharacter.name}
            className="current-avatar"
          />
          <span className="current-name">{selectedCharacter.name}</span>
        </div>
      </nav>

      {/* Overlay */}
      {isOpen && <div className="overlay" onClick={onToggle}></div>}

      {/* About Page */}
      {currentPage === 'about' && (
        <div className="about-page">
          <div className="about-hero">
            <h1>Casana</h1>
            <p className="tagline">Your AI Companion</p>
            <p className="subtitle">Experience meaningful conversations with lifelike 3D characters that listen, understand, and respond with emotion.</p>
            <button className="get-started-btn" onClick={() => onNavigate('characters')}>
              Get Started
            </button>
          </div>

          <div className="about-features">
            <div className="feature">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
                </svg>
              </div>
              <h3>Voice Chat</h3>
              <p>Talk naturally using your voice and hear realistic responses</p>
            </div>

            <div className="feature">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
              <h3>3D Avatars</h3>
              <p>Interact with stunning animated characters that express real emotions</p>
            </div>

            <div className="feature">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
              </div>
              <h3>Multiple Characters</h3>
              <p>Choose from unique personalities, each with their own story</p>
            </div>

            <div className="feature">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <h3>Emotional AI</h3>
              <p>Characters that adapt their mood and expressions to the conversation</p>
            </div>
          </div>

          <div className="about-footer">
            <p>Contact: websitesbyfarhan@gmail.com</p>
            <div className="footer-links">
              <a href="#">Terms of Service</a>
              <span>|</span>
              <a href="#">Privacy Policy</a>
            </div>
          </div>
        </div>
      )}

      {/* Characters Page */}
      {currentPage === 'characters' && (
        <div className="characters-page">
          <div className="page-header">
            <h1>Characters</h1>
            <p>Select a character to chat with</p>
          </div>
          <div className="characters-grid">
            {CHARACTERS.map((character) => (
              <button
                key={character.id}
                className={`character-card ${selectedCharacter.id === character.id ? 'selected' : ''}`}
                onClick={() => handleCharacterSelect(character)}
              >
                <img
                  src={character.profilePicture}
                  alt={character.name}
                  className="card-avatar"
                />
                <div className="card-info">
                  <h3>{character.name}</h3>
                  <p>{character.description}</p>
                </div>
                {selectedCharacter.id === character.id && (
                  <div className="selected-check">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

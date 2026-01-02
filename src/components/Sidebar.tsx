import { CHARACTERS, type Character } from '../constants'

type Page = 'home' | 'characters'

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

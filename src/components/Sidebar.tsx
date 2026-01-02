import { CHARACTERS, type Character } from '../constants'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  selectedCharacterId: string
  onSelectCharacter: (character: Character) => void
}

const CHARACTER_ROLES: Record<string, string> = {
  luna: 'Forest Ranger',
  jessica: 'ER Doctor',
  iris: 'Secret Agent',
  zuri: 'Party Queen',
}

export function Sidebar({ isOpen, onToggle, selectedCharacterId, onSelectCharacter }: SidebarProps) {
  return (
    <>
      <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle menu">
        <div className={`hamburger ${isOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">Characters</span>
          </div>
        </div>

        <div className="sidebar-content">
          {CHARACTERS.map((character) => (
            <button
              key={character.id}
              className={`character-card ${selectedCharacterId === character.id ? 'selected' : ''}`}
              onClick={() => onSelectCharacter(character)}
            >
              <div className="character-card-inner">
                <div className="character-avatar">
                  <span className="avatar-letter">{character.name.charAt(0)}</span>
                  {selectedCharacterId === character.id && (
                    <span className="status-dot"></span>
                  )}
                </div>
                <div className="character-info">
                  <span className="character-name">{character.name}</span>
                  <span className="character-role">{CHARACTER_ROLES[character.id] || 'Companion'}</span>
                </div>
                <div className="character-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="footer-text">Tap to switch</div>
        </div>
      </div>

      {isOpen && <div className="sidebar-overlay" onClick={onToggle}></div>}
    </>
  )
}

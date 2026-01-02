import { CHARACTERS, type Character } from '../constants'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  selectedCharacterId: string
  onSelectCharacter: (character: Character) => void
}

export function Sidebar({ isOpen, onToggle, selectedCharacterId, onSelectCharacter }: SidebarProps) {
  return (
    <>
      <button className="sidebar-toggle" onClick={onToggle}>
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        )}
      </button>

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Characters</h2>
        </div>
        <div className="sidebar-content">
          {CHARACTERS.map((character) => (
            <button
              key={character.id}
              className={`character-item ${selectedCharacterId === character.id ? 'selected' : ''}`}
              onClick={() => onSelectCharacter(character)}
            >
              <div className="character-avatar">
                {character.name.charAt(0)}
              </div>
              <span className="character-name">{character.name}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

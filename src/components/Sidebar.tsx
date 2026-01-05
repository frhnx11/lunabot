import { useState } from 'react'
import { CHARACTERS, type Character } from '../constants'
import { useAuth } from '../context/AuthContext'
import { CREDIT_PACKAGES, createOrder, verifyPayment, openRazorpayCheckout, type CreditPackage } from '../services/payment'

type Page = 'home' | 'characters' | 'about' | 'settings'
type SettingsTab = 'profile' | 'credits'

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
  const { user, userData, logout, refreshCredits } = useAuth()
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('profile')
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null)

  const handlePurchase = async (pkg: CreditPackage) => {
    if (!user || !userData) return

    setPurchaseLoading(pkg.id)

    try {
      // Create order on backend
      const order = await createOrder(pkg.id, user.uid)

      // Open Razorpay checkout
      openRazorpayCheckout(
        order.orderId,
        order.amount,
        pkg,
        userData.name,
        userData.email,
        async (response) => {
          // Verify payment on backend
          try {
            await verifyPayment(response, user.uid, pkg.id)
            await refreshCredits()
            alert(`Successfully purchased ${pkg.credits} credits!`)
          } catch (error) {
            console.error('Payment verification failed:', error)
            alert('Payment verification failed. Please contact support.')
          }
          setPurchaseLoading(null)
        },
        (error) => {
          console.error('Razorpay error:', error)
          setPurchaseLoading(null)
        }
      )
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order. Please try again.')
      setPurchaseLoading(null)
    }
  }

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

          <button
            className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => { onNavigate('settings'); onToggle(); }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
            <span>Settings</span>
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
              <h3>Natural Conversations</h3>
              <p>Characters that engage naturally with expressive animations</p>
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

      {/* Settings Page */}
      {currentPage === 'settings' && (
        <div className="settings-page">
          <div className="settings-inner-sidebar">
            <h2>Settings</h2>
            <div className="settings-nav">
              <button
                className={`settings-nav-item ${settingsTab === 'profile' ? 'active' : ''}`}
                onClick={() => setSettingsTab('profile')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span>Profile</span>
              </button>
              <button
                className={`settings-nav-item ${settingsTab === 'credits' ? 'active' : ''}`}
                onClick={() => setSettingsTab('credits')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
                </svg>
                <span>Credits</span>
              </button>
            </div>
          </div>

          <div className="settings-content">
            {settingsTab === 'profile' && (
              <div className="profile-section">
                <h3>Profile</h3>

                <div className="profile-info">
                  <div className="profile-avatar">
                    {userData?.name?.charAt(0).toUpperCase() || '?'}
                  </div>

                  <div className="profile-details">
                    <div className="profile-field">
                      <label>Name</label>
                      <p>{userData?.name || 'Not set'}</p>
                    </div>

                    <div className="profile-field">
                      <label>Email</label>
                      <p>{userData?.email || 'Not set'}</p>
                    </div>
                  </div>
                </div>

                <button className="logout-btn" onClick={logout}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                  </svg>
                  Sign Out
                </button>
              </div>
            )}

            {settingsTab === 'credits' && (
              <div className="credits-section">
                <h3>Credits</h3>

                <div className="credits-balance">
                  <div className="balance-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
                    </svg>
                  </div>
                  <div className="balance-info">
                    <span className="balance-label">Your Balance</span>
                    <span className="balance-amount">{userData?.credits ?? 0} Credits</span>
                  </div>
                </div>

                <p className="credits-info">1 credit = 1 voice response from your AI companion</p>

                <div className="credits-packages">
                  {CREDIT_PACKAGES.map((pkg) => (
                    <button
                      key={pkg.id}
                      className={`package-card ${pkg.theme || ''}`}
                      onClick={() => handlePurchase(pkg)}
                      disabled={purchaseLoading !== null}
                    >
                      {pkg.badge && <div className="package-badge">{pkg.badge}</div>}
                      <div className="package-name">{pkg.name}</div>
                      <div className="package-credits">{pkg.credits} Credits</div>
                      <div className="package-price">{pkg.priceDisplay}</div>
                      <div className="package-per-credit">{pkg.perCredit}</div>
                      {purchaseLoading === pkg.id && (
                        <div className="package-loading">Processing...</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
